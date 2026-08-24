export const LOGIN_NOTICE_TONES = ['info', 'success', 'warning', 'error'] as const;
export const LOGIN_NOTICE_DISPLAY_MODES = ['once', 'every_login'] as const;

export type LoginNoticeTone = (typeof LOGIN_NOTICE_TONES)[number];
export type LoginNoticeDisplayMode = (typeof LOGIN_NOTICE_DISPLAY_MODES)[number];

export type LoginNoticeDismissal = { notice_id: string; session_id: string | null };

export const MAX_LOGIN_NOTICE_DURATION_MS = 14 * 24 * 60 * 60 * 1000;
export const DEFAULT_LOGIN_NOTICE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

const londonFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/London',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function londonParts(date: Date) {
  const parts = Object.fromEntries(
    londonFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value])
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function formatLondonDateTimeLocal(date: Date) {
  const parts = londonParts(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}T${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** Parse a datetime-local value as Europe/London time without relying on the server timezone. */
export function parseLondonDateTimeLocal(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;

  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const values = [yearText, monthText, dayText, hourText, minuteText].map(Number);
  const [year, month, day, hour, minute] = values;
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;

  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wallClockUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const shown = londonParts(new Date(instant));
    const shownAsUtc = Date.UTC(shown.year, shown.month - 1, shown.day, shown.hour, shown.minute);
    instant -= shownAsUtc - wallClockUtc;
  }

  const result = new Date(instant);
  return formatLondonDateTimeLocal(result) === value ? result : null;
}

export function getLoginNoticeFormBounds(now = new Date()) {
  return {
    min: formatLondonDateTimeLocal(new Date(now.getTime() + 60 * 1000)),
    defaultValue: formatLondonDateTimeLocal(
      new Date(now.getTime() + DEFAULT_LOGIN_NOTICE_DURATION_MS)
    ),
    max: formatLondonDateTimeLocal(new Date(now.getTime() + MAX_LOGIN_NOTICE_DURATION_MS)),
  };
}

export function isLoginNoticeDismissed(
  notice: { id: string; display_mode: LoginNoticeDisplayMode },
  dismissals: LoginNoticeDismissal[],
  currentSessionId: string | null
) {
  return dismissals.some(
    (dismissal) =>
      dismissal.notice_id === notice.id &&
      (notice.display_mode === 'once'
        ? dismissal.session_id === null
        : Boolean(currentSessionId) && dismissal.session_id === currentSessionId)
  );
}

type ValidNoticeInput = {
  title: string;
  body: string;
  tone: LoginNoticeTone;
  displayMode: LoginNoticeDisplayMode;
  expiresAt: string;
};

export function validateLoginNoticeInput(
  formData: FormData,
  now = new Date()
): { ok: true; value: ValidNoticeInput } | { ok: false; error: string } {
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  const tone = String(formData.get('tone') ?? 'info');
  const displayMode = String(formData.get('display_mode') ?? 'once');
  const expiresAt = parseLondonDateTimeLocal(String(formData.get('expires_at') ?? ''));

  if (!title || title.length > 100) {
    return { ok: false, error: 'Title must be between 1 and 100 characters.' };
  }
  if (!body || body.length > 2000) {
    return { ok: false, error: 'Message must be between 1 and 2,000 characters.' };
  }
  if (!LOGIN_NOTICE_TONES.includes(tone as LoginNoticeTone)) {
    return { ok: false, error: 'Choose a valid notice colour.' };
  }
  if (!LOGIN_NOTICE_DISPLAY_MODES.includes(displayMode as LoginNoticeDisplayMode)) {
    return { ok: false, error: 'Choose a valid display frequency.' };
  }
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) {
    return { ok: false, error: 'Expiry must be a future UK date and time.' };
  }
  if (expiresAt.getTime() > now.getTime() + MAX_LOGIN_NOTICE_DURATION_MS) {
    return { ok: false, error: 'Expiry cannot be more than 2 weeks from now.' };
  }

  return {
    ok: true,
    value: {
      title,
      body,
      tone: tone as LoginNoticeTone,
      displayMode: displayMode as LoginNoticeDisplayMode,
      expiresAt: expiresAt.toISOString(),
    },
  };
}
