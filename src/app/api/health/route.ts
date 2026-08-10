import { resolveAppEnvironment } from '@/lib/environment';

export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    {
      ok: true,
      environment: resolveAppEnvironment(),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  );
}
