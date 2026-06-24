import twilio from 'twilio';

export interface ReminderSmsParams {
  to: string; // E.164 format, e.g. "+447700900000"
  displayName: string;
  gameweekLabel: string;
  firstKickoff: Date;
  isDryRun?: boolean;
}

export interface SmsResult {
  success: boolean;
  messageSid?: string;
  error?: string;
  dryRun?: boolean;
}

export async function sendReminderSms(params: ReminderSmsParams): Promise<SmsResult> {
  const { to, displayName, gameweekLabel, firstKickoff, isDryRun } = params;

  if (isDryRun) {
    console.log('[DRY RUN] Would send reminder SMS to:', to, { gameweekLabel });
    return { success: true, dryRun: true };
  }

  const kickoffStr = firstKickoff.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    hour: '2-digit',
    minute: '2-digit',
  });

  const body = `⚽ ${gameweekLabel} starts at ${kickoffStr}. Don't forget your predictions! — Predictotronix`;

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER,
      to,
    });

    return { success: true, messageSid: message.sid };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
