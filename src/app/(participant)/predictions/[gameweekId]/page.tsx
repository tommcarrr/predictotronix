import { redirect } from 'next/navigation';

export const metadata = { title: 'Predictions' };

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ gameweekId: string }>;
}

export default async function PredictionsPage({ params }: Props) {
  const { gameweekId } = await params;
  redirect(`/dashboard?gameweek=${encodeURIComponent(gameweekId)}`);
}
