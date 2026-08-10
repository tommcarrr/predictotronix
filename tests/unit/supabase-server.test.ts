import { beforeEach, describe, expect, it, vi } from 'vitest';

const createServerClient = vi.fn();
const createSupabaseClient = vi.fn(() => ({ client: 'service-role' }));
const cookies = vi.fn();

vi.mock('@supabase/ssr', () => ({ createServerClient }));
vi.mock('@supabase/supabase-js', () => ({ createClient: createSupabaseClient }));
vi.mock('next/headers', () => ({ cookies }));

describe('Supabase server clients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
  });

  it('creates the service-role client without loading the user cookie session', async () => {
    const { createServiceClient } = await import('@/lib/supabase/server');

    const client = createServiceClient();

    expect(client).toEqual({ client: 'service-role' });
    expect(cookies).not.toHaveBeenCalled();
    expect(createServerClient).not.toHaveBeenCalled();
    expect(createSupabaseClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'service-role-key',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  });
});
