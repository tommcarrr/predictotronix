import { X } from 'lucide-react';
import { dismissLoginNotice } from '@/app/(participant)/dashboard/actions';
import type { LoginNoticeDisplayMode, LoginNoticeTone } from '@/lib/login-notices';
import { FormSubmitButton } from '@/components/ui/form-submit-button';

export type VisibleLoginNotice = {
  id: string;
  title: string;
  body: string;
  tone: LoginNoticeTone;
  display_mode: LoginNoticeDisplayMode;
};

export function LoginNotices({ notices }: { notices: VisibleLoginNotice[] }) {
  if (!notices.length) return null;

  return (
    <section className="space-y-3" aria-label="League notices">
      {notices.map((notice) => (
        <article
          key={notice.id}
          className={`participant-login-notice participant-login-notice--${notice.tone}`}
          role={notice.tone === 'error' || notice.tone === 'warning' ? 'alert' : 'status'}
        >
          <div className="min-w-0 flex-1">
            <h2 className="participant-login-notice__title">{notice.title}</h2>
            <p className="participant-login-notice__body">{notice.body}</p>
          </div>
          <form action={dismissLoginNotice.bind(null, notice.id)}>
            <FormSubmitButton
              pendingLabel="Dismissing…"
              aria-label={`Dismiss ${notice.title}`}
              title={notice.display_mode === 'every_login' ? 'Dismiss until next login' : 'Dismiss'}
              className="participant-login-notice__dismiss"
            >
              <X className="size-4" aria-hidden="true" />
            </FormSubmitButton>
          </form>
        </article>
      ))}
    </section>
  );
}
