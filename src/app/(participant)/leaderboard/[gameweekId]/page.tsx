import { redirect } from 'next/navigation';

export const metadata = { title: 'Gameweek leaderboard' };

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ gameweekId: string }>;
}

export default async function GameweekLeaderboardPage(_props: Props) {
  redirect('/dashboard');
}
