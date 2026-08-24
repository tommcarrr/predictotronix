import { describe, expect, it } from 'vitest';
import {
  getLoginNoticeFormBounds,
  isLoginNoticeDismissed,
  parseLondonDateTimeLocal,
  validateLoginNoticeInput,
} from '@/lib/login-notices';

function validForm(expiry: string) {
  const form = new FormData();
  form.set('title', 'Fixture delay');
  form.set('body', 'Tonight’s fixtures will start later than planned.');
  form.set('tone', 'warning');
  form.set('display_mode', 'once');
  form.set('expires_at', expiry);
  return form;
}

describe('login notice validation', () => {
  it('parses UK wall-clock values consistently across daylight saving time', () => {
    expect(parseLondonDateTimeLocal('2026-08-24T18:30')?.toISOString()).toBe(
      '2026-08-24T17:30:00.000Z'
    );
    expect(parseLondonDateTimeLocal('2026-12-24T18:30')?.toISOString()).toBe(
      '2026-12-24T18:30:00.000Z'
    );
    expect(parseLondonDateTimeLocal('2026-02-31T18:30')).toBeNull();
  });

  it('defaults to one week and caps the input at exactly two weeks', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const bounds = getLoginNoticeFormBounds(now);
    expect(parseLondonDateTimeLocal(bounds.defaultValue)?.getTime()).toBe(
      now.getTime() + 7 * 24 * 60 * 60 * 1000
    );
    expect(parseLondonDateTimeLocal(bounds.max)?.getTime()).toBe(
      now.getTime() + 14 * 24 * 60 * 60 * 1000
    );
  });

  it('accepts valid content and normalizes whitespace', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = validateLoginNoticeInput(validForm('2026-08-31T13:00'), now);
    expect(result).toEqual({
      ok: true,
      value: {
        title: 'Fixture delay',
        body: 'Tonight’s fixtures will start later than planned.',
        tone: 'warning',
        displayMode: 'once',
        expiresAt: '2026-08-31T12:00:00.000Z',
      },
    });
  });

  it('rejects expiries beyond two weeks even if the browser constraint is bypassed', () => {
    const now = new Date('2026-08-24T12:00:00.000Z');
    const result = validateLoginNoticeInput(validForm('2026-09-08T13:00'), now);
    expect(result).toEqual({ ok: false, error: 'Expiry cannot be more than 2 weeks from now.' });
  });

  it('rejects unsupported tones and display modes', () => {
    const form = validForm('2026-08-31T13:00');
    form.set('tone', 'magenta');
    expect(validateLoginNoticeInput(form, new Date('2026-08-24T12:00:00.000Z'))).toEqual({
      ok: false,
      error: 'Choose a valid notice colour.',
    });
  });
});

describe('login notice dismissals', () => {
  const dismissals = [
    { notice_id: 'once', session_id: null },
    { notice_id: 'repeat', session_id: 'session-1' },
  ];

  it('keeps a once-only notice dismissed across sessions', () => {
    expect(
      isLoginNoticeDismissed({ id: 'once', display_mode: 'once' }, dismissals, 'session-2')
    ).toBe(true);
  });

  it('shows an every-login notice again in a new session', () => {
    expect(
      isLoginNoticeDismissed({ id: 'repeat', display_mode: 'every_login' }, dismissals, 'session-1')
    ).toBe(true);
    expect(
      isLoginNoticeDismissed({ id: 'repeat', display_mode: 'every_login' }, dismissals, 'session-2')
    ).toBe(false);
  });
});
