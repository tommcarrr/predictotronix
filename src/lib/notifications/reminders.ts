export const REMINDER_WINDOWS = {
  DAY_10AM: 'day_10am',
  TWO_HOURS_BEFORE: 'two_hours_before',
} as const;

export type ReminderWindow = (typeof REMINDER_WINDOWS)[keyof typeof REMINDER_WINDOWS];
export type ReminderChannel = 'email' | 'sms';

export function getDueReminderWindows(now: Date, firstKickoff: Date): ReminderWindow[] {
  const ukNow = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
  const todayAt10 = new Date(ukNow);
  todayAt10.setHours(10, 0, 0, 0);

  const diffToKickoff = firstKickoff.getTime() - now.getTime();
  const diffTo10am = Math.abs(now.getTime() - todayAt10.getTime());
  const windows: ReminderWindow[] = [];

  if (diffTo10am <= 30 * 60 * 1000 && now >= todayAt10 && firstKickoff > now) {
    windows.push(REMINDER_WINDOWS.DAY_10AM);
  }

  if (
    diffToKickoff > 0 &&
    diffToKickoff <= 2 * 60 * 60 * 1000 &&
    diffToKickoff >= 1.5 * 60 * 60 * 1000
  ) {
    windows.push(REMINDER_WINDOWS.TWO_HOURS_BEFORE);
  }

  return windows;
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
