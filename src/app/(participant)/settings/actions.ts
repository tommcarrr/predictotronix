'use server';

import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function saveNotificationPreferences(participantId: string, formData: FormData) {
  await requireUser();
  const supabase = await createClient();

  const mobile = (formData.get('mobile') as string | null)?.trim() || null;

  // Update participant mobile
  if (mobile !== null) {
    await supabase.from('participants').update({ mobile }).eq('id', participantId);
  }

  // Upsert preferences
  await supabase.from('notification_preferences').upsert(
    {
      participant_id: participantId,
      email_enabled: formData.get('email_enabled') === 'on',
      sms_enabled: formData.get('sms_enabled') === 'on',
      remind_when_complete: formData.get('remind_when_complete') === 'on',
      opted_out: formData.get('opted_out') === 'on',
    },
    { onConflict: 'participant_id' }
  );

  revalidatePath('/settings');
}
