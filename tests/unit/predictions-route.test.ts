import { describe, expect, it, vi } from 'vitest';

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock('next/navigation', () => ({ redirect }));

import PredictionsPage from '@/app/(participant)/predictions/[gameweekId]/page';

describe('predictions notification link', () => {
  it('preserves the gameweek ID when redirecting to the dashboard', async () => {
    await PredictionsPage({
      params: Promise.resolve({ gameweekId: '0f98d674-f3e0-4cbb-97af-fc9e431fe7c5' }),
    });

    expect(redirect).toHaveBeenCalledWith(
      '/dashboard?gameweek=0f98d674-f3e0-4cbb-97af-fc9e431fe7c5'
    );
  });
});
