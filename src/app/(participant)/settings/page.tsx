import { redirect } from 'next/navigation';
import { getParticipant, requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { saveNotificationPreferences } from './actions';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export const metadata = { title: 'Settings' };

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const user = await requireUser().catch(() => null);
  if (!user) redirect('/login');

  const participant = await getParticipant();
  if (!participant) redirect('/dashboard');

  const supabase = await createClient();
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('participant_id', participant.id)
    .maybeSingle();

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <header className="border-b-2 border-[--color-secondary] pb-3">
        <a href="/dashboard" className="text-[--color-text-secondary] text-xs hover:underline">
          ← DASHBOARD
        </a>
        <h1 className="text-[--color-warning] font-bold text-lg uppercase mt-1">
          NOTIFICATION SETTINGS
        </h1>
      </header>

      <form action={saveNotificationPreferences.bind(null, participant.id)} className="space-y-4">
        <div className="space-y-3 border border-[--color-info] p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="email_enabled"
              defaultChecked={prefs?.email_enabled ?? true}
              className="w-4 h-4"
            />
            <span className="text-sm">Email reminders</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="sms_enabled"
              defaultChecked={prefs?.sms_enabled ?? false}
              className="w-4 h-4"
            />
            <span className="text-sm">SMS reminders (requires mobile number)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="remind_when_complete"
              defaultChecked={prefs?.remind_when_complete ?? false}
              className="w-4 h-4"
            />
            <span className="text-sm">Send reminders even when predictions are complete</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="opted_out"
              defaultChecked={prefs?.opted_out ?? false}
              className="w-4 h-4"
            />
            <span className="text-sm text-[--color-error]">Opt out of all notifications</span>
          </label>
        </div>

        <div className="space-y-1">
          <label htmlFor="mobile" className="text-sm text-[--color-text-secondary]">
            Mobile number (optional, for SMS)
          </label>
          <input
            id="mobile"
            name="mobile"
            type="tel"
            defaultValue={participant.mobile ?? ''}
            placeholder="+447700900000"
            className="w-full bg-[--color-action-disabled-bg] border border-[--color-border] text-white px-3 py-2 text-sm"
          />
        </div>

        <FormSubmitButton
          pendingLabel="Saving settings…"
          className="participant-button participant-button--save w-full"
        >
          Save settings
        </FormSubmitButton>
      </form>
    </div>
  );
}
