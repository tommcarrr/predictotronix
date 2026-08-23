import { NextResponse, type NextRequest } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { sendReminderEmail } from '@/lib/notifications/email';
import { sendReminderSms } from '@/lib/notifications/sms';
import { shouldDryRunNotifications } from '@/lib/environment';
import { getSeasonNow } from '@/lib/clock';
import {
  buildReminderDeliveryKey,
  getDueReminderWindows,
  type ReminderChannel,
  type ReminderWindow,
} from '@/lib/notifications/reminders';
import { executeCronJob } from '@/lib/cron/run';

export const dynamic = 'force-dynamic';

function validateCronSecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-cron-secret');
  return !!process.env.CRON_SECRET && secret === process.env.CRON_SECRET;
}

type ServiceClient = Awaited<ReturnType<typeof createServiceClient>>;

type DeliveryClaim =
  | { id: string; deliveryKey: string; duplicate: false; error: null }
  | { id: null; deliveryKey: string; duplicate: true; error: null }
  | { id: null; deliveryKey: string; duplicate: false; error: string };

async function claimReminderDelivery(
  supabase: ServiceClient,
  params: {
    participantId: string;
    seasonId: string;
    gameweekId: string;
    channel: ReminderChannel;
    reminderWindow: ReminderWindow;
  }
): Promise<DeliveryClaim> {
  const deliveryKey = buildReminderDeliveryKey({
    participantId: params.participantId,
    gameweekId: params.gameweekId,
    channel: params.channel,
    reminderWindow: params.reminderWindow,
  });

  const { data, error } = await supabase
    .from('notification_log')
    .insert({
      delivery_key: deliveryKey,
      participant_id: params.participantId,
      season_id: params.seasonId,
      gameweek_id: params.gameweekId,
      channel: params.channel,
      notification_type: 'reminder',
      status: 'processing',
      metadata: { reminderWindow: params.reminderWindow },
    })
    .select('id')
    .single();

  if (error?.code === '23505') {
    return { id: null, deliveryKey, duplicate: true, error: null };
  }

  if (error || !data) {
    return {
      id: null,
      deliveryKey,
      duplicate: false,
      error: error?.message ?? 'Notification delivery claim returned no row',
    };
  }

  return { id: data.id, deliveryKey, duplicate: false, error: null };
}

export async function POST(request: NextRequest) {
  if (!validateCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return executeCronJob('send-reminders', async (supabase) => {
    const processedAt = new Date();
    let sent = 0;
    let suppressed = 0;
    let duplicates = 0;
    const errors: string[] = [];

    // Find gameweeks with first_kickoff coming up — due for reminders
    // Reminder windows:
    //   1. 10:00am on day of first fixture (within the last 30 min)
    //   2. 2 hours before first fixture kickoff (within the last 30 min)
    const { data: gameweeks } = await supabase
      .from('gameweeks')
      .select(
        `
        id, label, first_kickoff, season_id,
        seasons!inner(season_type, status)
      `
      )
      .eq('status', 'upcoming')
      .not('first_kickoff', 'is', null);

    for (const gw of gameweeks ?? []) {
      const now = await getSeasonNow(supabase, gw.season_id);
      const firstKickoff = new Date(gw.first_kickoff!);
      const season = (gw as any).seasons;

      // Staging/development environments always dry-run, even if incorrectly
      // connected to a season marked as production.
      const isDryRun = shouldDryRunNotifications(season?.season_type);

      // Check if a reminder is due (within 30-min window)
      const reminderWindows = getDueReminderWindows(now, firstKickoff);
      if (reminderWindows.length === 0) continue;

      // Get season participants with notification preferences
      const { data: participants } = await supabase
        .from('season_participants')
        .select(
          `
          participant_id,
          participants!inner(
            id, display_name, email, mobile,
            notification_preferences(
              email_enabled, sms_enabled, remind_when_complete, opted_out
            )
          )
        `
        )
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
              (await supabase.from('fixtures').select('id').eq('gameweek_id', gw.id)).data?.map(
                (f: any) => f.id
              ) ?? []
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

        for (const reminderWindow of reminderWindows) {
          // Claim the occurrence before calling either provider. The database's
          // unique delivery_key makes this safe across retries and concurrent jobs.
          if (prefs.email_enabled && p.email) {
            const claim = await claimReminderDelivery(supabase, {
              participantId: p.id,
              seasonId: gw.season_id,
              gameweekId: gw.id,
              channel: 'email',
              reminderWindow,
            });

            if (claim.duplicate) {
              duplicates++;
              suppressed++;
            } else if (claim.error || !claim.id) {
              errors.push(
                `Could not claim email to ${p.email}: ${claim.error ?? 'No claim ID returned'}`
              );
            } else {
              const result = await sendReminderEmail({
                to: p.email,
                displayName: p.display_name,
                gameweekLabel: gw.label ?? `Gameweek`,
                firstKickoff,
                predictionsUrl,
                isDryRun,
                idempotencyKey: claim.deliveryKey,
              });

              const { error: logError } = await supabase
                .from('notification_log')
                .update({
                  status: result.dryRun ? 'dry_run' : result.success ? 'sent' : 'failed',
                  error_message: result.error ?? null,
                  metadata: {
                    reminderWindow,
                    ...(result.messageId ? { messageId: result.messageId } : {}),
                  },
                })
                .eq('id', claim.id);

              if (logError) errors.push(`Could not update email log: ${logError.message}`);
              if (result.success) sent++;
              else if (result.error) errors.push(`Email to ${p.email}: ${result.error}`);
            }
          }

          if (prefs.sms_enabled && p.mobile) {
            const claim = await claimReminderDelivery(supabase, {
              participantId: p.id,
              seasonId: gw.season_id,
              gameweekId: gw.id,
              channel: 'sms',
              reminderWindow,
            });

            if (claim.duplicate) {
              duplicates++;
              suppressed++;
            } else if (claim.error || !claim.id) {
              errors.push(
                `Could not claim SMS to ${p.mobile}: ${claim.error ?? 'No claim ID returned'}`
              );
            } else {
              const result = await sendReminderSms({
                to: p.mobile,
                displayName: p.display_name,
                gameweekLabel: gw.label ?? `Gameweek`,
                firstKickoff,
                isDryRun,
              });

              const { error: logError } = await supabase
                .from('notification_log')
                .update({
                  status: result.dryRun ? 'dry_run' : result.success ? 'sent' : 'failed',
                  error_message: result.error ?? null,
                  metadata: {
                    reminderWindow,
                    ...(result.messageSid ? { messageSid: result.messageSid } : {}),
                  },
                })
                .eq('id', claim.id);

              if (logError) errors.push(`Could not update SMS log: ${logError.message}`);
              if (result.success) sent++;
              else if (result.error) errors.push(`SMS to ${p.mobile}: ${result.error}`);
            }
          }
        }
      }
    }

    return {
      body: {
        ok: errors.length === 0,
        timestamp: processedAt.toISOString(),
        sent,
        suppressed,
        duplicates,
        errors,
      },
      summary: { sent, suppressed, duplicates, errorCount: errors.length },
      errors,
    };
  });
}
