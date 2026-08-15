import { Resend } from 'resend';

const RESEND_FROM = process.env.RESEND_FROM ?? 'Predictotronix <no-reply@predictotronix.app>';

export interface ReminderEmailParams {
  to: string;
  displayName: string;
  gameweekLabel: string;
  firstKickoff: Date;
  predictionsUrl: string;
  isDryRun?: boolean;
  idempotencyKey?: string;
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

export interface JoinRequestEmailParams {
  to: string;
  adminDisplayName: string;
  applicantDisplayName: string;
  applicantEmail: string;
  leagueName: string;
  reviewUrl: string;
  idempotencyKey: string;
}

interface BrandedEmailParams {
  preheader: string;
  label: string;
  heading: string;
  bodyHtml: string;
  action?: {
    href: string;
    label: string;
  };
  footer: string;
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

function renderBrandedEmail(params: BrandedEmailParams): string {
  const { preheader, label, heading, bodyHtml, action, footer } = params;
  const actionHtml = action
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
        <tr>
          <td style="background:#ffff00; border:2px solid #ffffff;">
            <a
              href="${escapeHtml(action.href)}"
              style="display:inline-block; padding:14px 22px; color:#000000; font-size:16px; font-weight:bold; text-decoration:none;"
            >
              ${escapeHtml(action.label)} →
            </a>
          </td>
        </tr>
      </table>`
    : '';

  return `<!doctype html>
<html lang="en">
  <body style="margin:0; padding:0; background:#050505;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#050505; font-family:'Courier New', Courier, monospace;">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; background:#0a0a0a; border:2px solid #00e5ff;">
            <tr>
              <td style="padding:24px 28px; border-bottom:2px solid #00e5ff;">
                <div style="color:#39ff14; font-size:24px; font-weight:bold; letter-spacing:2px;">PREDICTOTRONIX</div>
                <div style="margin-top:6px; color:#00e5ff; font-size:13px; letter-spacing:1px;">PLAYER SERVICE</div>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                <div style="color:#ffff00; font-size:13px; font-weight:bold; letter-spacing:1px;">${escapeHtml(label)}</div>
                <h1 style="margin:12px 0 16px; color:#ffffff; font-size:28px; line-height:1.2;">${escapeHtml(heading)}</h1>
                <div style="color:#c7c7c7; font-size:16px; line-height:1.6;">${bodyHtml}</div>
                ${actionHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px; border-top:1px solid #333333;">
                <p style="margin:0; color:#777777; font-size:12px; line-height:1.5;">${escapeHtml(footer)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendReminderEmail(params: ReminderEmailParams): Promise<EmailResult> {
  const { to, displayName, gameweekLabel, firstKickoff, predictionsUrl, isDryRun, idempotencyKey } = params;

  if (isDryRun) {
    console.log('[DRY RUN] Would send reminder email to:', to, { gameweekLabel });
    return { success: true, dryRun: true };
  }

  const kickoffStr = firstKickoff.toLocaleString('en-GB', {
    timeZone: 'Europe/London',
    dateStyle: 'full',
    timeStyle: 'short',
  });
  const safeDisplayName = escapeHtml(displayName);
  const safeGameweekLabel = escapeHtml(gameweekLabel);
  const safeKickoff = escapeHtml(kickoffStr);

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: `[PREDICTOTRONIX] ${gameweekLabel} prediction reminder`,
      html: renderBrandedEmail({
        preheader: `${gameweekLabel} starts ${kickoffStr}. Submit your predictions before kickoff.`,
        label: 'PREDICTION DEADLINE',
        heading: `${gameweekLabel} is approaching`,
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${safeDisplayName},</p>
          <p style="margin:0 0 16px;">Your predictions for <strong style="color:#ffffff;">${safeGameweekLabel}</strong> are due before the first fixture kicks off.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0; border-left:4px solid #00e5ff; background:#111111;">
            <tr>
              <td style="padding:14px 16px; color:#ffffff;">
                FIRST KICKOFF<br>
                <strong style="color:#00e5ff;">${safeKickoff}</strong>
              </td>
            </tr>
          </table>`,
        action: { href: predictionsUrl, label: 'SUBMIT PREDICTIONS' },
        footer: 'You are receiving this because prediction reminders are enabled for your account.',
      }),
      text: `Hi ${displayName},\n\n${gameweekLabel} starts ${kickoffStr}. Submit your predictions before kickoff:\n${predictionsUrl}\n\n— Predictotronix`,
    }, idempotencyKey ? { idempotencyKey } : undefined);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/** Notify a league administrator that a player is waiting for review. */
export async function sendJoinRequestEmail(params: JoinRequestEmailParams): Promise<EmailResult> {
  const {
    to,
    adminDisplayName,
    applicantDisplayName,
    applicantEmail,
    leagueName,
    reviewUrl,
    idempotencyKey,
  } = params;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to,
      subject: `[PREDICTOTRONIX] New join request for ${leagueName}`,
      html: renderBrandedEmail({
        preheader: `${applicantDisplayName} has asked to join ${leagueName}.`,
        label: 'JOIN REQUEST',
        heading: 'A player is waiting for review',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${escapeHtml(adminDisplayName)},</p>
          <p style="margin:0 0 16px;"><strong style="color:#ffffff;">${escapeHtml(applicantDisplayName)}</strong> has asked to join <strong style="color:#ffffff;">${escapeHtml(leagueName)}</strong>.</p>
          <p style="margin:0; color:#00e5ff;">${escapeHtml(applicantEmail)}</p>`,
        action: { href: reviewUrl, label: 'REVIEW REQUEST' },
        footer: 'You are receiving this because you are an administrator for this league.',
      }),
      text: `Hi ${adminDisplayName},\n\n${applicantDisplayName} (${applicantEmail}) has asked to join ${leagueName}.\n\nReview the request:\n${reviewUrl}\n\n— Predictotronix`,
    }, { idempotencyKey });

    if (error) return { success: false, error: error.message };
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
      subject: '[PREDICTOTRONIX] Test notification',
      html: renderBrandedEmail({
        preheader: 'Predictotronix email notifications are connected and ready.',
        label: 'SYSTEM TEST',
        heading: 'Signal received',
        bodyHtml: `
          <p style="margin:0 0 16px;">Hi ${escapeHtml(displayName)},</p>
          <p style="margin:0;">This is a live test notification from Predictotronix.</p>
          <p style="margin:16px 0 0; color:#39ff14; font-weight:bold;">EMAIL STATUS: OPERATIONAL</p>`,
        footer: 'Sent from the Predictotronix staging test tools.',
      }),
      text: `Hi ${displayName},\n\nThis is a live test notification from Predictotronix.\n\nEMAIL STATUS: OPERATIONAL`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}
