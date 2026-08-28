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
import { CronExecutionError, executeCronJob } from '@/lib/cron/run';

export const dynamic = 'force-dynamic';

const PROCESSING_CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

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
    isDryRun: boolean;
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
    const { data: existing, error: existingError } = await supabase
      .from('notification_log')
      .select('id, status, sent_at')
      .eq('delivery_key', deliveryKey)
      .maybeSingle();

    if (existingError || !existing) {
      return {
        id: null,
        deliveryKey,
        duplicate: false,
        error: existingError?.message ?? 'Existing notification claim could not be loaded',
      };
    }

    const claimedAt = new Date(existing.sent_at).getTime();
    const staleProcessingClaim =
      existing.status === 'processing' &&
      Number.isFinite(claimedAt) &&
      claimedAt <= Date.now() - PROCESSING_CLAIM_TIMEOUT_MS;
    const retryable =
      existing.status === 'failed' ||
      (existing.status === 'dry_run' && !params.isDryRun) ||
      staleProcessingClaim;

    // Failed sends and abandoned claims are safe to retry. A dry run can also
    // be promoted if the environment is subsequently corrected to live.
    // Restrict by the previous status and timestamp so concurrent retries
    // cannot both win the same delivery occurrence.
    if (retryable) {
      const { data: retried, error: retryError } = await supabase
        .from('notification_log')
        .update({
          status: 'processing',
          sent_at: new Date().toISOString(),
          error_message: null,
          metadata: {
            reminderWindow: params.reminderWindow,
            retry: true,
            previousStatus: existing.status,
          },
        })
        .eq('id', existing.id)
        .eq('status', existing.status)
        .eq('sent_at', existing.sent_at)
        .select('id')
        .maybeSingle();

      if (retryError) {
        return {
          id: null,
          deliveryKey,
          duplicate: false,
          error: retryError.message,
        };
      }
      if (retried) {
        return { id: retried.id, deliveryKey, duplicate: false, error: null };
      }
    }

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
    let dryRuns = 0;
    let suppressed = 0;
    let duplicates = 0;
    let dueGameweeks = 0;
    const errors: string[] = [];

    // Find gameweeks with first_kickoff coming up — due for reminders
    // Reminder occurrences become due at 10:00 London time on matchday and
    // two hours before kickoff. Each due occurrence remains eligible until
    // kickoff and its delivery key records whether it has already been sent.
    const { data: gameweeks, error: gameweeksError } = await supabase
      .from('gameweeks')
      .select(
        `
        id, label, first_kickoff, season_id,
        seasons!inner(season_type, status)
      `
      )
      .eq('status', 'upcoming')
      .eq('seasons.status', 'active')
      .not('first_kickoff', 'is', null);

    if (gameweeksError) {
      throw new CronExecutionError('Could not load upcoming gameweeks for reminders.', 500, {
        error: gameweeksError.message,
      });
    }

    for (const gw of gameweeks ?? []) {
      const now = await getSeasonNow(supabase, gw.season_id);
      const firstKickoff = new Date(gw.first_kickoff!);
      const season = (gw as any).seasons;

      // Staging/development environments always dry-run, even if incorrectly
      // connected to a season marked as production.
      const isDryRun = shouldDryRunNotifications(season?.season_type);

      // Check which scheduled occurrences are due.
      const reminderWindows = getDueReminderWindows(now, firstKickoff);
      if (reminderWindows.length === 0) continue;
      dueGameweeks++;

      // Get season participants with notification preferences
      const [participantsResult, fixturesResult] = await Promise.all([
        supabase
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
          .eq('season_id', gw.season_id),
        supabase.from('fixtures').select('id').eq('gameweek_id', gw.id),
      ]);

      if (participantsResult.error || fixturesResult.error) {
        throw new CronExecutionError('Could not prepare reminder recipients.', 500, {
          gameweekId: gw.id,
          participantsError: participantsResult.error?.message ?? null,
          fixturesError: fixturesResult.error?.message ?? null,
        });
      }

      const participants = participantsResult.data ?? [];
      const fixtureIds = (fixturesResult.data ?? []).map((fixture) => fixture.id);
      if (fixtureIds.length === 0) {
        throw new CronExecutionError('Due gameweek has no fixtures.', 500, {
          gameweekId: gw.id,
        });
      }

      for (const sp of participants) {
        const p = (sp as any).participants;
        let prefs = p?.notification_preferences;

        if (!p) {
          errors.push(`Participant relation missing for season participant ${sp.participant_id}`);
          suppressed++;
          continue;
        }

        // Older participants can predate notification preference creation.
        // Persist and use the database defaults instead of silently suppressing them.
        if (!prefs) {
          const { error: preferencesError } = await supabase
            .from('notification_preferences')
            .upsert({ participant_id: p.id }, { onConflict: 'participant_id' });
          if (preferencesError) {
            errors.push(`Could not create notification preferences for participant ${p.id}`);
            suppressed++;
            continue;
          }
          prefs = {
            email_enabled: true,
            sms_enabled: false,
            remind_when_complete: false,
            opted_out: false,
          };
        }

        if (prefs.opted_out) {
          suppressed++;
          continue;
        }

        // Check if predictions are complete (if remind_when_complete is false, suppress)
        if (!prefs.remind_when_complete) {
          const { count, error: predictionCountError } = await supabase
            .from('predictions')
            .select('id', { count: 'exact', head: true })
            .eq('participant_id', p.id)
            .in('fixture_id', fixtureIds);

          if (predictionCountError || count === null) {
            errors.push(`Could not count predictions for participant ${p.id}`);
            suppressed++;
            continue;
          }

          if (count >= fixtureIds.length) {
            suppressed++;
            const { error: suppressionLogError } = await supabase.from('notification_log').insert({
              participant_id: p.id,
              season_id: gw.season_id,
              gameweek_id: gw.id,
              channel: 'email',
              notification_type: 'reminder',
              status: 'suppressed',
            });
            if (suppressionLogError) {
              errors.push(`Could not record suppression for participant ${p.id}`);
            }
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
              isDryRun,
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
              if (result.dryRun) dryRuns++;
              else if (result.success) sent++;
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
              isDryRun,
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
              if (result.dryRun) dryRuns++;
              else if (result.success) sent++;
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
        dryRuns,
        suppressed,
        duplicates,
        gameweeksChecked: gameweeks?.length ?? 0,
        dueGameweeks,
        errors,
      },
      summary: {
        sent,
        dryRuns,
        suppressed,
        duplicates,
        gameweeksChecked: gameweeks?.length ?? 0,
        dueGameweeks,
        errorCount: errors.length,
      },
      errors,
    };
  });
}
