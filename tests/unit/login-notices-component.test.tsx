import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/app/(participant)/dashboard/actions', () => ({
  dismissLoginNotice: vi.fn(),
}));

import { LoginNotices } from '@/components/participant/LoginNotices';

describe('LoginNotices', () => {
  it('uses Ceefax tone classes and accessible semantics', () => {
    render(
      <LoginNotices
        notices={[
          {
            id: 'notice-1',
            title: 'Kick-off delayed',
            body: 'Check back at 8pm.',
            tone: 'warning',
            display_mode: 'every_login',
          },
          {
            id: 'notice-2',
            title: 'Saved',
            body: 'Predictions restored.',
            tone: 'success',
            display_mode: 'once',
          },
        ]}
      />
    );

    expect(screen.getByRole('alert')).toHaveClass('participant-login-notice--warning');
    expect(screen.getByRole('status')).toHaveClass('participant-login-notice--success');
    expect(screen.getByRole('button', { name: 'Dismiss Kick-off delayed' })).toHaveAttribute(
      'title',
      'Dismiss until next login'
    );
  });

  it('renders nothing when there are no active notices', () => {
    const { container } = render(<LoginNotices notices={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
