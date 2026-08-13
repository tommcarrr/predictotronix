import '@/styles/ceefax.css';
import { PlayerAccessibilityMode } from '@/components/participant/PlayerAccessibilityMode';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerAccessibilityMode>
      <div className="auth-ceefax-background min-h-screen flex items-center justify-center p-4">
        {children}
      </div>
    </PlayerAccessibilityMode>
  );
}
