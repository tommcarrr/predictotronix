import '@/styles/ceefax.css';
import { PlayerAccessibilityMode } from '@/components/participant/PlayerAccessibilityMode';

export default function ParticipantLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlayerAccessibilityMode showToolbarToggle={false}>
      <div className="ceefax min-h-screen">{children}</div>
    </PlayerAccessibilityMode>
  );
}
