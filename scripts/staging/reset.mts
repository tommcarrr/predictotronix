import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { assertSafeStagingTarget } from '../../src/lib/environment.ts';
import {
  buildStagingScenario,
  deterministicUuid,
  STAGING_LEAGUE_ID,
  STAGING_SCENARIO_KEY,
  STAGING_SEASON_ID,
  type ScenarioPersona,
} from './scenario.mts';

const INSERT_BATCH_SIZE = 500;

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function insertBatches(
  supabase: SupabaseClient,
  table: string,
  rows: Array<Record<string, unknown>>,
) {
  for (let index = 0; index < rows.length; index += INSERT_BATCH_SIZE) {
    const { error } = await supabase
      .from(table)
      .insert(rows.slice(index, index + INSERT_BATCH_SIZE));
    if (error) throw new Error(`Failed inserting ${table}: ${error.message}`);
  }
}

async function ensurePersonaUser(
  supabase: SupabaseClient,
  persona: ScenarioPersona,
): Promise<User> {
  let page = 1;
  let existing: User | undefined;

  while (!existing) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw new Error(`Failed listing Auth users: ${error.message}`);
    existing = data.users.find(
      (user) => user.email?.toLowerCase() === persona.email.toLowerCase(),
    );
    if (existing || data.users.length < 1000) break;
    page++;
  }

  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: persona.password,
      email_confirm: true,
      user_metadata: { display_name: persona.displayName, staging: true },
    });
    if (error) throw new Error(`Failed updating ${persona.email}: ${error.message}`);
    return data.user;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: persona.email,
    password: persona.password,
    email_confirm: true,
    user_metadata: { display_name: persona.displayName, staging: true },
  });
  if (error) throw new Error(`Failed creating ${persona.email}: ${error.message}`);
  return data.user;
}

async function scoreCompletedFixtures(
  supabase: SupabaseClient,
  fixtureIds: string[],
) {
  for (let index = 0; index < fixtureIds.length; index += 10) {
    const batch = fixtureIds.slice(index, index + 10);
    await Promise.all(
      batch.map(async (fixtureId) => {
        const { error } = await supabase.rpc('score_predictions', {
          p_fixture_id: fixtureId,
        });
        if (error) throw new Error(`Failed scoring ${fixtureId}: ${error.message}`);
      }),
    );
  }
}

async function assertCount(
  supabase: SupabaseClient,
  table: string,
  column: string,
  value: string,
  expected: number,
) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq(column, value);
  if (error) throw new Error(`Failed validating ${table}: ${error.message}`);
  if (count !== expected) {
    throw new Error(`Expected ${expected} ${table} rows, found ${count ?? 'unknown'}.`);
  }
}

async function main() {
  const { projectRef } = assertSafeStagingTarget();
  const supabaseUrl = requiredEnvironment('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = requiredEnvironment('SUPABASE_SERVICE_ROLE_KEY');
  const emailDomain =
    process.env.STAGING_EMAIL_DOMAIN?.trim() || 'staging.predictotronix.test';
  const scenario = buildStagingScenario(new Date(), emailDomain);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Resetting ${STAGING_SCENARIO_KEY} in Supabase project ${projectRef}...`);

  const usersByPersona = new Map<string, User>();
  for (const persona of scenario.personas) {
    usersByPersona.set(persona.key, await ensurePersonaUser(supabase, persona));
  }

  const { error: leagueDeleteError } = await supabase
    .from('leagues')
    .delete()
    .eq('id', STAGING_LEAGUE_ID);
  if (leagueDeleteError) {
    throw new Error(`Failed deleting prior staging league: ${leagueDeleteError.message}`);
  }

  const { error: roleDeleteError } = await supabase
    .from('league_roles')
    .delete()
    .in('id', [
      deterministicUuid('role:superadmin'),
      deterministicUuid('role:leagueadmin'),
    ]);
  if (roleDeleteError) {
    throw new Error(`Failed deleting prior staging roles: ${roleDeleteError.message}`);
  }

  const participantIds = scenario.participants.map((participant) => participant.id);
  const { error: participantDeleteError } = await supabase
    .from('participants')
    .delete()
    .in('id', participantIds);
  if (participantDeleteError) {
    throw new Error(
      `Failed deleting prior staging participants: ${participantDeleteError.message}`,
    );
  }

  const superAdmin = usersByPersona.get('superadmin')!;
  const leagueAdmin = usersByPersona.get('leagueadmin')!;
  const player = usersByPersona.get('player')!;
  const pending = usersByPersona.get('pending')!;
  const outsider = usersByPersona.get('outsider')!;

  await insertBatches(supabase, 'leagues', [
    {
      id: STAGING_LEAGUE_ID,
      name: 'Predictotronix Staging League',
      slug: 'predictotronix-staging',
      invite_code: 'staging-midseason-2026',
      invite_active: true,
      created_by: superAdmin.id,
    },
  ]);
  await insertBatches(supabase, 'seasons', [
    {
      id: STAGING_SEASON_ID,
      league_id: STAGING_LEAGUE_ID,
      name: 'Staging Mid-Season',
      api_football_league_id: 39,
      api_football_season: new Date().getUTCFullYear(),
      season_type: 'test',
      status: 'active',
    },
  ]);

  await insertBatches(
    supabase,
    'participants',
    scenario.participants.map(({ personaKey, ...participant }) => ({
      ...participant,
      user_id: personaKey ? usersByPersona.get(personaKey)!.id : null,
    })),
  );
  await insertBatches(
    supabase,
    'season_participants',
    scenario.participants.map((participant) => ({
      id: deterministicUuid(`season-participant:${participant.id}`),
      season_id: STAGING_SEASON_ID,
      participant_id: participant.id,
    })),
  );
  await insertBatches(supabase, 'league_roles', [
    {
      id: deterministicUuid('role:superadmin'),
      league_id: null,
      user_id: superAdmin.id,
      role: 'super_admin',
      granted_by: superAdmin.id,
    },
    {
      id: deterministicUuid('role:leagueadmin'),
      league_id: STAGING_LEAGUE_ID,
      user_id: leagueAdmin.id,
      role: 'league_admin',
      granted_by: superAdmin.id,
    },
  ]);
  await insertBatches(supabase, 'join_requests', [
    {
      id: deterministicUuid('join-request:player'),
      league_id: STAGING_LEAGUE_ID,
      user_id: player.id,
      status: 'approved',
      reviewed_by: leagueAdmin.id,
      reviewed_at: scenario.generatedAt,
    },
    {
      id: deterministicUuid('join-request:pending'),
      league_id: STAGING_LEAGUE_ID,
      user_id: pending.id,
      status: 'pending',
    },
    {
      id: deterministicUuid('join-request:outsider'),
      league_id: STAGING_LEAGUE_ID,
      user_id: outsider.id,
      status: 'rejected',
      reviewed_by: leagueAdmin.id,
      reviewed_at: scenario.generatedAt,
    },
  ]);

  await insertBatches(
    supabase,
    'gameweeks',
    scenario.gameweeks as unknown as Array<Record<string, unknown>>,
  );
  await insertBatches(
    supabase,
    'fixtures',
    scenario.fixtures as unknown as Array<Record<string, unknown>>,
  );
  await insertBatches(
    supabase,
    'notification_preferences',
    scenario.participants.map((participant, index) => ({
      id: deterministicUuid(`notification-preference:${participant.id}`),
      participant_id: participant.id,
      email_enabled: index % 5 !== 0,
      sms_enabled: Boolean(participant.mobile) && index % 2 === 0,
      remind_when_complete: index % 4 === 0,
      opted_out: index % 11 === 0,
    })),
  );
  await insertBatches(
    supabase,
    'predictions',
    scenario.predictions.map((prediction) => ({
      ...prediction,
      entered_by: prediction.is_admin_entered ? leagueAdmin.id : player.id,
    })),
  );

  await scoreCompletedFixtures(supabase, scenario.completedFixtureIds);

  const auditRows = scenario.predictions.slice(0, 250).map((prediction) => ({
    id: deterministicUuid(`prediction-audit:${prediction.id}`),
    prediction_id: prediction.id,
    actor_id: prediction.is_admin_entered ? leagueAdmin.id : player.id,
    action: prediction.is_admin_entered ? 'admin_created' : 'created',
    new_home_score: prediction.home_score,
    new_away_score: prediction.away_score,
    is_admin_action: prediction.is_admin_entered,
  }));
  await insertBatches(supabase, 'prediction_audit', auditRows);

  await insertBatches(
    supabase,
    'notification_log',
    scenario.participants.slice(0, 20).map((participant, index) => ({
      id: deterministicUuid(`notification-log:${participant.id}`),
      participant_id: participant.id,
      season_id: STAGING_SEASON_ID,
      gameweek_id: scenario.gameweeks[18].id,
      channel: index % 4 === 0 ? 'sms' : 'email',
      notification_type: 'reminder',
      status: index % 6 === 0 ? 'suppressed' : 'dry_run',
      metadata: { scenario: STAGING_SCENARIO_KEY },
    })),
  );

  await assertCount(supabase, 'gameweeks', 'season_id', STAGING_SEASON_ID, 38);
  await assertCount(supabase, 'fixtures', 'season_id', STAGING_SEASON_ID, 380);
  await assertCount(
    supabase,
    'season_participants',
    'season_id',
    STAGING_SEASON_ID,
    scenario.participants.length,
  );
  await assertCount(
    supabase,
    'predictions',
    'season_id',
    STAGING_SEASON_ID,
    scenario.predictions.length,
  );

  console.log('Staging reset complete.');
  console.table(
    scenario.personas.map((persona) => ({
      persona: persona.key,
      email: persona.email,
      password: persona.password,
    })),
  );
  console.log({
    leagueId: STAGING_LEAGUE_ID,
    seasonId: STAGING_SEASON_ID,
    gameweeks: scenario.gameweeks.length,
    fixtures: scenario.fixtures.length,
    participants: scenario.participants.length,
    predictions: scenario.predictions.length,
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
