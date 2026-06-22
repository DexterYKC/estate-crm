import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));

import { getDb } from '@/lib/db';
import { postAdmin, patchAdmin, getAdmin } from '@/lib/api/admin';
import { postUser, getUser, deleteUser } from '@/lib/api/user';
import { createManualInvoice } from '@/lib/api/helpers';

let db;

beforeAll(async () => {
  db = await getDb();
});

describe('commission agent vs agence', () => {
  it("utilise le pourcentage par défaut de l'agence quand l'agent n'a pas d'override", async () => {
    const agentRes = await postAdmin(['admin', 'agents'], { name: 'Agent Défaut', email: `agent-defaut-${Date.now()}@test.com`, password: 'pass1234' }, db);
    const agentId = (await agentRes.json()).id;

    await patchAdmin(['admin', 'settings'], { default_commission_pct: 40 }, db, { user: { isSuperAdmin: 1 } });

    const result = await createManualInvoice(db, { description: 'Test commission défaut', amount: 1000, type: 'autre', agent_id: agentId });
    const invoice = await db.prepare('SELECT agent_commission_amount FROM invoices WHERE id=?').get(result.id);
    expect(invoice.agent_commission_amount).toBe(400);
  });

  it("utilise le pourcentage propre à l'agent quand il est défini (override)", async () => {
    const agentRes = await postAdmin(['admin', 'agents'], { name: 'Agent Override', email: `agent-override-${Date.now()}@test.com`, password: 'pass1234' }, db);
    const agentId = (await agentRes.json()).id;
    await patchAdmin(['admin', 'agents', agentId], { commission_pct: 70 }, db);

    const result = await createManualInvoice(db, { description: 'Test commission override', amount: 1000, type: 'autre', agent_id: agentId });
    const invoice = await db.prepare('SELECT agent_commission_amount FROM invoices WHERE id=?').get(result.id);
    expect(invoice.agent_commission_amount).toBe(700);
  });
});

describe('suivi du versement de la commission', () => {
  it('peut marquer une commission comme versée puis revenir en arrière', async () => {
    const agentRes = await postAdmin(['admin', 'agents'], { name: 'Agent Paiement', email: `agent-paiement-${Date.now()}@test.com`, password: 'pass1234' }, db);
    const agentId = (await agentRes.json()).id;
    const result = await createManualInvoice(db, { description: 'Test paiement', amount: 1000, type: 'autre', agent_id: agentId });

    await patchAdmin(['admin', 'invoices', result.id], { agent_commission_paid: true }, db);
    let invoice = await db.prepare('SELECT agent_commission_paid, agent_commission_paid_at FROM invoices WHERE id=?').get(result.id);
    expect(invoice.agent_commission_paid).toBe(1);
    expect(invoice.agent_commission_paid_at).toBeTruthy();

    await patchAdmin(['admin', 'invoices', result.id], { agent_commission_paid: false }, db);
    invoice = await db.prepare('SELECT agent_commission_paid, agent_commission_paid_at FROM invoices WHERE id=?').get(result.id);
    expect(invoice.agent_commission_paid).toBe(0);
    expect(invoice.agent_commission_paid_at).toBeNull();
  });
});

describe('mandat -> rappel automatique', () => {
  it("crée un rappel J-30 quand un mandat avec date d'expiration est défini", async () => {
    const propRes = await postAdmin(['admin', 'properties'], {
      title: 'Bien avec mandat', type: 'appartement', transaction: 'vente', price: 200000,
      mandate_type: 'exclusif', mandate_end: '2026-12-31',
    }, db);
    const propertyId = (await propRes.json()).id;

    const reminder = await db.prepare('SELECT * FROM reminders WHERE property_id=?').get(propertyId);
    expect(reminder).toBeTruthy();
    expect(reminder.due_date).toBe('2026-12-01');
    expect(reminder.text).toContain('2026-12-31');
  });

  it('met à jour le rappel existant si la date de fin du mandat change', async () => {
    const propRes = await postAdmin(['admin', 'properties'], {
      title: 'Bien mandat à modifier', type: 'maison', transaction: 'location', price: 1200,
      mandate_type: 'simple', mandate_end: '2026-06-30',
    }, db);
    const propertyId = (await propRes.json()).id;

    await patchAdmin(['admin', 'properties', propertyId], { mandate_end: '2027-01-31' }, db, { user: { isSuperAdmin: 1 } });

    const reminders = await db.prepare('SELECT * FROM reminders WHERE property_id=?').all(propertyId);
    expect(reminders.length).toBe(1);
    expect(reminders[0].due_date).toBe('2027-01-01');
  });

  it('supprime le rappel si le mandat est retiré', async () => {
    const propRes = await postAdmin(['admin', 'properties'], {
      title: 'Bien mandat à retirer', type: 'terrain', transaction: 'vente', price: 50000,
      mandate_type: 'exclusif', mandate_end: '2026-09-15',
    }, db);
    const propertyId = (await propRes.json()).id;
    expect(await db.prepare('SELECT id FROM reminders WHERE property_id=?').get(propertyId)).toBeTruthy();

    await patchAdmin(['admin', 'properties', propertyId], { mandate_end: null }, db, { user: { isSuperAdmin: 1 } });

    expect(await db.prepare('SELECT id FROM reminders WHERE property_id=?').get(propertyId)).toBeFalsy();
  });
});

describe('rappels personnels (admin)', () => {
  it('crée, met à jour et supprime un rappel', async () => {
    const created = await postAdmin(['admin', 'reminders'], { text: 'Rappeler ce client', due_date: '2026-07-01' }, db);
    const { id } = await created.json();

    const list = await getAdmin(['admin', 'reminders'], new URLSearchParams({ agent_id: 'none' }), db);
    const rows = await list.json();
    expect(rows.some(r => r.id === id)).toBe(true);

    await patchAdmin(['admin', 'reminders', id], { done: true }, db);
    const updated = await db.prepare('SELECT done FROM reminders WHERE id=?').get(id);
    expect(updated.done).toBe(1);
  });
});

describe('alertes de recherche', () => {
  it("enregistre une recherche et calcule le nombre de biens correspondants", async () => {
    await postAdmin(['admin', 'properties'], {
      title: 'Bien correspondant', type: 'appartement', transaction: 'vente', price: 150000, city: 'Tunis', status: 'active',
    }, db);

    const session = { user: { id: `user-${Date.now()}` } };
    const created = await postUser(['user', 'search-alerts'], { name: 'Ma recherche', city: 'Tunis', type: 'appartement', transaction: 'vente', max_price: 200000 }, db, session);
    const { id } = await created.json();

    const list = await getUser(['user', 'search-alerts'], new URLSearchParams(), db, session);
    const alerts = await list.json();
    const alert = alerts.find(a => a.id === id);
    expect(alert).toBeTruthy();
    expect(alert.match_count).toBeGreaterThanOrEqual(1);

    await deleteUser(['user', 'search-alerts', id], db, session);
    const afterDelete = await db.prepare('SELECT id FROM search_alerts WHERE id=?').get(id);
    expect(afterDelete).toBeFalsy();
  });
});
