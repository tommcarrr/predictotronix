import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createServiceClient, redirect, requireSuperAdmin, revalidatePath } = vi.hoisted(() => ({
  createServiceClient: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  requireSuperAdmin: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({ createServiceClient }));
vi.mock('@/lib/auth', () => ({
  getUser: vi.fn(),
  isLeagueAdmin: vi.fn(),
  requireLeagueAdmin: vi.fn(),
  requireSuperAdmin,
}));
vi.mock('@/lib/admin/authorization', () => ({ requireLeagueAdminForSeason: vi.fn() }));
vi.mock('next/cache', () => ({ revalidatePath }));
vi.mock('next/navigation', () => ({ redirect }));

import { deleteUnattachedUser } from '@/app/(admin)/admin/participants/actions';

const actorId = '11111111-1111-4111-8111-111111111111';
const targetId = '22222222-2222-4222-8222-222222222222';

describe('unattached user deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireSuperAdmin.mockResolvedValue({ id: actorId });
  });

  it('deletes an unattached user after exact email confirmation', async () => {
    const getUserById = vi.fn().mockResolvedValue({
      data: { user: { id: targetId, email: 'bot@example.com' } },
      error: null,
    });
    const rpc = vi.fn().mockResolvedValue({ data: true, error: null });
    createServiceClient.mockResolvedValue({ auth: { admin: { getUserById } }, rpc });
    const formData = new FormData();
    formData.set('confirmation', 'bot@example.com');

    await expect(deleteUnattachedUser(targetId, formData)).rejects.toThrow(
      'REDIRECT:/admin/participants?tab=unattached&deleted=1'
    );

    expect(rpc).toHaveBeenCalledWith('delete_unattached_auth_user', {
      p_user_id: targetId,
      p_actor_user_id: actorId,
    });
    expect(revalidatePath).toHaveBeenCalledWith('/admin/participants');
  });

  it('does not delete when the confirmation does not match', async () => {
    const rpc = vi.fn();
    createServiceClient.mockResolvedValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: targetId, email: 'bot@example.com' } },
            error: null,
          }),
        },
      },
      rpc,
    });
    const formData = new FormData();
    formData.set('confirmation', 'wrong@example.com');

    await expect(deleteUnattachedUser(targetId, formData)).rejects.toThrow(
      'REDIRECT:/admin/participants?tab=unattached&error=Enter+the+exact+email+address+to+confirm+deletion'
    );
    expect(rpc).not.toHaveBeenCalled();
  });

  it('cannot delete the acting super-admin account', async () => {
    const formData = new FormData();
    formData.set('confirmation', 'admin@example.com');

    await expect(deleteUnattachedUser(actorId, formData)).rejects.toThrow(
      'REDIRECT:/admin/participants?tab=unattached&error=You+cannot+delete+your+own+account'
    );
    expect(createServiceClient).not.toHaveBeenCalled();
  });

  it('surfaces a database recheck that finds the user is now attached', async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: null,
      error: {
        message: 'This user is now attached to a participant, league, request, role, or invitation',
      },
    });
    createServiceClient.mockResolvedValue({
      auth: {
        admin: {
          getUserById: vi.fn().mockResolvedValue({
            data: { user: { id: targetId, email: 'bot@example.com' } },
            error: null,
          }),
        },
      },
      rpc,
    });
    const formData = new FormData();
    formData.set('confirmation', 'bot@example.com');

    await expect(deleteUnattachedUser(targetId, formData)).rejects.toThrow(
      'REDIRECT:/admin/participants?tab=unattached&error=This%20user%20is%20now%20attached%20to%20a%20participant%2C%20league%2C%20request%2C%20role%2C%20or%20invitation'
    );
  });

  it('requires super-admin authorization before accessing the service client', async () => {
    requireSuperAdmin.mockRejectedValue(new Error('FORBIDDEN'));

    await expect(deleteUnattachedUser(targetId, new FormData())).rejects.toThrow('FORBIDDEN');
    expect(createServiceClient).not.toHaveBeenCalled();
  });
});
