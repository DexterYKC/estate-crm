import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));

import { getDb } from '@/lib/db';
import { postPublic } from '@/lib/api/public';
import { patchAdmin } from '@/lib/api/admin';

let db;
beforeAll(async () => { db = await getDb(); });

describe('cycle de vie d\'une demande', () => {
  it('crée une demande, l\'accepte, et persiste la décision', async () => {
    const created = await postPublic(['requests'], { name: 'Test Client', email: 'test.client@example.com', message: 'Intéressé' }, db);
    const { id } = await created.json();
    expect(id).toBeTruthy();

    const patched = await patchAdmin(['admin', 'requests', id], {
      decision: 'accepted', status: 'closed', deal_date: '2026-01-15', deal_price: 250000,
    }, db, { user: { isSuperAdmin: 1 } });
    expect((await patched.json()).ok).toBe(true);

    const row = await db.prepare('SELECT * FROM requests WHERE id=?').get(id);
    expect(row.decision).toBe('accepted');
    expect(row.status).toBe('closed');
    expect(row.deal_price).toBe(250000);
  });

  it('refuse une demande avec un motif et clôture le statut', async () => {
    const created = await postPublic(['requests'], { name: 'Autre Client', phone: '+21612345678' }, db);
    const { id } = await created.json();

    await patchAdmin(['admin', 'requests', id], {
      decision: 'refused', status: 'closed', refusal_reason: 'Budget insuffisant',
    }, db, { user: { isSuperAdmin: 1 } });

    const row = await db.prepare('SELECT * FROM requests WHERE id=?').get(id);
    expect(row.decision).toBe('refused');
    expect(row.status).toBe('closed');
    expect(row.refusal_reason).toBe('Budget insuffisant');
  });

  it('refuse la création sans nom ni moyen de contact', async () => {
    const res = await postPublic(['requests'], { name: '' }, db);
    expect(res.status).toBe(400);
  });
});
