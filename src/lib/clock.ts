import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type SeasonClockPosition = 'before' | 'in_progress' | 'after';

const HOUR_MS = 60 * 60 * 1000;

/** Resolve the same season-aware time used by prediction RLS in PostgreSQL. */
export async function getSeasonNow(
  supabase: SupabaseClient<Database>,
  seasonId: string,
): Promise<Date> {
  const { data, error } = await supabase.rpc('get_season_time', {
    p_season_id: seasonId,
  });

  if (error || !data) {
    throw new Error(error?.message ?? `Season ${seasonId} has no clock`);
  }

  const now = new Date(data);
  if (Number.isNaN(now.getTime())) {
    throw new Error(`Season ${seasonId} returned an invalid clock value`);
  }

  return now;
}

/** Choose useful test moments around a gameweek without changing fixture data. */
export function clockTimeForGameweek(
  firstKickoff: Date,
  lastKickoff: Date,
  position: SeasonClockPosition,
): Date {
  if (
    Number.isNaN(firstKickoff.getTime()) ||
    Number.isNaN(lastKickoff.getTime()) ||
    lastKickoff < firstKickoff
  ) {
    throw new Error('Invalid gameweek kickoff range');
  }

  switch (position) {
    case 'before':
      return new Date(firstKickoff.getTime() - 24 * HOUR_MS);
    case 'in_progress':
      return new Date(firstKickoff.getTime() + HOUR_MS);
    case 'after':
      return new Date(lastKickoff.getTime() + 3 * HOUR_MS);
  }
}

