'use server';

import { revalidatePath } from 'next/cache';
import { requireUser, getParticipant } from '@/lib/auth';
import { requireLeagueAdminForGameweek } from '@/lib/admin/authorization';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { parseRichTextDocument } from './document';
import type { Json } from '@/types/database';

export interface SaveGameweekMessageResult {
  success: boolean;
  deleted?: boolean;
  error?: string;
}

export async function saveGameweekMessage(
  gameweekId: string,
  content: unknown
): Promise<SaveGameweekMessageResult> {
  await requireUser();
  const participant = await getParticipant();
  if (!participant) return { success: false, error: 'No participant record found.' };

  const parsed = parseRichTextDocument(content);
  if (!parsed) return { success: false, error: 'The note is invalid or exceeds 1,000 characters.' };

  const supabase = await createClient();
  const { data: gameweek } = await supabase
    .from('gameweeks')
    .select('id, season_id')
    .eq('id', gameweekId)
    .maybeSingle();

  if (!gameweek) return { success: false, error: 'That gameweek is not available.' };

  const { data: enrolment } = await supabase
    .from('season_participants')
    .select('id')
    .eq('season_id', gameweek.season_id)
    .eq('participant_id', participant.id)
    .maybeSingle();

  if (!enrolment) return { success: false, error: 'You are not enrolled in this season.' };

  if (!parsed.plainText.trim()) {
    const { error } = await supabase
      .from('gameweek_messages')
      .delete()
      .eq('gameweek_id', gameweek.id)
      .eq('participant_id', participant.id);
    if (error) return { success: false, error: 'The note could not be removed.' };
    revalidatePath('/dashboard');
    revalidatePath('/admin/predictions');
    return { success: true, deleted: true };
  }

  const { error } = await supabase.from('gameweek_messages').upsert(
    {
      gameweek_id: gameweek.id,
      participant_id: participant.id,
      content: parsed.document as unknown as Json,
      plain_text: parsed.plainText,
    },
    { onConflict: 'gameweek_id,participant_id' }
  );

  if (error) return { success: false, error: 'The note could not be saved.' };
  revalidatePath('/dashboard');
  revalidatePath('/admin/predictions');
  return { success: true };
}

export async function markGameweekMessagesRead(gameweekId: string) {
  const { user } = await requireLeagueAdminForGameweek(gameweekId);
  const supabase = await createServiceClient();
  const { error } = await supabase.from('admin_gameweek_message_reads').upsert(
    {
      gameweek_id: gameweekId,
      user_id: user.id,
      last_read_at: new Date().toISOString(),
    },
    { onConflict: 'gameweek_id,user_id' }
  );

  if (error) return { success: false };
  revalidatePath('/admin/predictions');
  return { success: true };
}
