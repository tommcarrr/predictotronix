import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/notifications/email';
import { sendReminderSms } from '@/lib/notifications/sms';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createServiceClient();
    const now = new Date();
    let sent = 0;
    let suppressed = 0;
    const errors: string[] = [];

    // Find gameweeks with first_kickoff coming up — due for reminders
    // Reminder windows:
    //   1. 10:00am on day of first fixture (within the last 30 min)
    //   2. 2 hours before first fixture kickoff (within the last 30 min)
    const ukNow = new Date(now.toLocaleString('en-GB', { timeZone: 'Europe/London' }));
    const todayAt10 = new Date(ukNow);
    todayAt10.setHours(10, 0, 0, 0);
    const twoHoursBefore = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const { data: gameweeks } = await supabase
      .from('gameweeks')
      .select(`
        id, label, first_kickoff, season_id,
        seasons!inner(season_type, status)
      `)
      .eq('status', 'upcoming')
      .not('first_kickoff', 'is', null);

    for (const gw of gameweeks ?? []) {
      const firstKickoff = new Date(gw.first_kickoff!);
      const season = (gw as any).seasons;

      // Determine if this is a test season (dry-run by default)
      const isDryRun = season?.season_type !== 'production';

      // Check if a reminder is due (within 30-min window)
      const diffToKickoff = firstKickoff.getTime() - now.getTime();
      const diffTo10am = Math.abs(now.getTime() - todayAt10.getTime());
      const isNear2HourWindow =
        diffToKickoff > 0 &&
        diffToKickoff <= 2 * 60 * 60 * 1000 &&
        diffToKickoff >= 1.5 * 60 * 60 * 1000;
      const isNear10amWindow =
        diffTo10am <= 30 * 60 * 1000 &&
        now >= todayAt10 &&
        firstKickoff > now;

      if (!isNear2HourWindow && !isNear10amWindow) continue;

      // Get season participants with notification preferences
      const { data: participants } = await supabase
        .from('season_participants')
        .select(`
          participant_id,
          participants!inner(
            id, display_name, email, mobile,
            notification_preferences(
              email_enabled, sms_enabled, remind_when_complete, opted_out
            )
          )
        `)
        .eq('season_id', gw.season_id);

      for (const sp of participants ?? []) {
        const p = (sp as any).participants;
        const prefs = p?.notification_preferences?.[0];

        if (!p || !prefs || prefs.opted_out) {
          suppressed++;
          continue;
        }

        // Check if predictions are complete (if remind_when_complete is false, suppress)
        if (!prefs.remind_when_complete) {
          const { count } = await supabase
            .from('predictions')
            .select('id', { count: 'exact', head: true })
            .eq('participant_id', p.id)
            .in(
              'fixture_id',
              (
                await supabase
                  .from('fixtures')
                  .select('id')
                  .eq('gameweek_id', gw.id)
              ).data?.map((f: any) => f.id) ?? []
            );

          const { count: fixtureCount } = await supabase
            .from('fixtures')
            .select('id', { count: 'exact', head: true })
            .eq('gameweek_id', gw.id);

          if (count !== null && fixtureCount !== null && count >= fixtureCount) {
            suppressed++;
            await supabase.from('notification_log').insert({
              participant_id: p.id,
              season_id: gw.season_id,
              gameweek_id: gw.id,
              channel: 'email',
              notification_type: 'reminder',
              status: 'suppressed',
            });
            continue;
          }
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
        const predictionsUrl = `${appUrl}/predictions/${gw.id}`;

        // Send email
        if (prefs.email_enabled && p.email) {
          const result = await sendReminderEmail({
            to: p.email,
            displayName: p.display_name,
            gameweekLabel: gw.label ?? `Gameweek`,
            firstKickoff,
            predictionsUrl,
            isDryRun,
          });

          await supabase.from('notification_log').insert({
            participant_id: p.id,
            season_id: gw.season_id,
            gameweek_id: gw.id,
            channel: 'email',
            notification_type: 'reminder',
            status: result.dryRun ? 'dry_run' : result.success ? 'sent' : 'failed',
            error_message: result.error,
            metadata: result.messageId ? { messageId: result.messageId } : null,
          });

          if (result.success) sent++;
          else if (result.error) errors.push(`Email to ${p.email}: ${result.error}`);
        }

        // Send SMS
        if (prefs.sms_enabled && p.mobile) {
          const result = await sendReminderSms({
            to: p.mobile,
            displayName: p.display_name,
            gameweekLabel: gw.label ?? `Gameweek`,
            firstKickoff,
            isDryRun,
          });

          await supabase.from('notification_log').insert({
            participant_id: p.id,
            season_id: gw.season_id,
            gameweek_id: gw.id,
            channel: 'sms',
            notification_type: 'reminder',
            status: result.dryRun ? 'dry_run' : result.success ? 'sent' : 'failed',
            error_message: result.error,
            metadata: result.messageSid ? { messageSid: result.messageSid } : null,
          });

          if (result.success) sent++;
          else if (result.error) errors.push(`SMS to ${p.mobile}: ${result.error}`);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      timestamp: now.toISOString(),
      sent,
      suppressed,
      errors,
    });
  } catch (err) {
    console.error('[cron/send-reminders]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
