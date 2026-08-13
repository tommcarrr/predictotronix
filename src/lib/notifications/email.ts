import { Resend } from 'resend';

const RESEND_FROM = process.env.RESEND_FROM ?? 'Predictotronix <no-reply@predictotronix.app>';

export interface ReminderEmailParams {
  to: string;
  displayName: string;
  gameweekLabel: string;
  firstKickoff: Date;
  predictionsUrl: string;
  isDryRun?: boolean;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  dryRun?: boolean;
}

export interface TestEmailParams {
  to: string;
  displayName: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character]!);
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<EmailResult> {
  const { to, displayName, gameweekLabel, firstKickoff, predictionsUrl, isDryRun } = params;

  if (isDryRun) {
    console.log('[DRY RUN] Would send reminder email to:', to, { gameweekLabel });
    return { success: true, dryRun: true };
  }

  const kickoffStr = firstKickoff.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: `⚽ ${gameweekLabel} predictions reminder`,
      html: `
        <p>Hi ${displayName},</p>
        <p>Don't forget to submit your predictions for <strong>${gameweekLabel}</strong>!</p>
        <p>First kickoff: <strong>${kickoffStr}</strong></p>
        <p><a href="${predictionsUrl}">Submit predictions →</a></p>
        <p>Good luck!</p>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Send a live, clearly labelled message from the staging test-tools screen. */
export async function sendTestEmail(params: TestEmailParams): Promise<EmailResult> {
  const { to, displayName } = params;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: 'Predictotronix test notification',
      html: `
        <p>Hi ${escapeHtml(displayName)},</p>
        <p>This is a test notification from Predictotronix.</p>
        <p>If you received it, email notifications are wired up correctly.</p>
      `,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
