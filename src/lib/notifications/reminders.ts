export const REMINDER_WINDOWS = {
  DAY_10AM: 'day_10am',
  TWO_HOURS_BEFORE: 'two_hours_before',
} as const;

export type ReminderWindow = (typeof REMINDER_WINDOWS)[keyof typeof REMINDER_WINDOWS];
export type ReminderChannel = 'email' | 'sms';

const LONDON_TIME_ZONE = 'Europe/London';
const HOUR_MS = 60 * 60 * 1000;

const londonDateFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: LONDON_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

function londonParts(date: Date) {
  const values = Object.fromEntries(
    londonDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

/** Convert 10:00 on the kickoff's London calendar date to an absolute instant. */
function london10amOnKickoffDay(firstKickoff: Date): Date {
  const { year, month, day } = londonParts(firstKickoff);
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 10));
  const guessParts = londonParts(utcGuess);
  const representedAsUtc = Date.UTC(
    guessParts.year,
    guessParts.month - 1,
    guessParts.day,
    guessParts.hour,
    guessParts.minute,
    guessParts.second
  );
  const londonOffset = representedAsUtc - utcGuess.getTime();

  return new Date(utcGuess.getTime() - londonOffset);
}

export function getDueReminderWindows(now: Date, firstKickoff: Date): ReminderWindow[] {
  if (Number.isNaN(now.getTime()) || Number.isNaN(firstKickoff.getTime()) || now >= firstKickoff) {
    return [];
  }

  const schedules = [
    {
      window: REMINDER_WINDOWS.DAY_10AM,
      at: london10amOnKickoffDay(firstKickoff),
    },
    {
      window: REMINDER_WINDOWS.TWO_HOURS_BEFORE,
      at: new Date(firstKickoff.getTime() - 2 * HOUR_MS),
    },
  ]
    .filter((schedule) => schedule.at < firstKickoff && schedule.at <= now)
    .sort((left, right) => right.at.getTime() - left.at.getTime());

  // If a cron tick was missed, send only the most recent useful reminder.
  // Earlier occurrences remain skipped instead of arriving back-to-back.
  return schedules.length > 0 ? [schedules[0].window] : [];
}

export function buildReminderDeliveryKey(params: {
  participantId: string;
  gameweekId: string;
  channel: ReminderChannel;
  reminderWindow: ReminderWindow;
}): string {
  return [
    'reminder',
    params.participantId,
    params.gameweekId,
    params.channel,
    params.reminderWindow,
  ].join(':');
}
