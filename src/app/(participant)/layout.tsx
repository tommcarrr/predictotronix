import '@/styles/ceefax.css';
import { PlayerAccessibilityMode } from '@/components/participant/PlayerAccessibilityMode';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerAccessibilityMode>
      <div className="ceefax min-h-screen">{children}</div>
    </PlayerAccessibilityMode>
  );
}
