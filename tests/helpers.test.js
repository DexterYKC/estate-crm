import { describe, it, expect, vi } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));

import { getServerSession } from 'next-auth';
import { requireRole } from '@/lib/api/helpers';

describe('requireRole', () => {
  it('renvoie 401 si aucune session', async () => {
    getServerSession.mockResolvedValueOnce(null);
    const { error, session } = await requireRole(['admin']);
    expect(session).toBeNull();
    expect(error.status).toBe(401);
  });

  it('renvoie 403 si le rôle ne correspond pas', async () => {
    getServerSession.mockResolvedValueOnce({ user: { id: '1', role: 'agent' } });
    const { error, session } = await requireRole(['admin']);
    expect(session).toBeNull();
    expect(error.status).toBe(403);
  });

  it('laisse passer si le rôle correspond', async () => {
    const fakeSession = { user: { id: '1', role: 'admin' } };
    getServerSession.mockResolvedValueOnce(fakeSession);
    const { error, session } = await requireRole(['admin']);
    expect(error).toBeNull();
    expect(session).toEqual(fakeSession);
  });

  it('laisse passer sans liste de rôles (juste authentifié)', async () => {
    const fakeSession = { user: { id: '1', role: 'user' } };
    getServerSession.mockResolvedValueOnce(fakeSession);
    const { error, session } = await requireRole(null);
    expect(error).toBeNull();
    expect(session).toEqual(fakeSession);
  });
});
