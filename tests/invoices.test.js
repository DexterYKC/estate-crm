import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('next-auth', () => ({ getServerSession: vi.fn().mockResolvedValue(null) }));

import { getDb } from '@/lib/db';
import { postPublic } from '@/lib/api/public';
import { postAdmin, patchAdmin } from '@/lib/api/admin';
import { postAgent } from '@/lib/api/agent';
import { createInvoiceForRequest, createManualInvoice } from '@/lib/api/helpers';

let db, agentAId, agentBId, requestId;

beforeAll(async () => {
  db = await getDb();

  const agentA = await postAdmin(['admin', 'agents'], { name: 'Agent A', email: `agent-a-${Date.now()}@test.com`, password: 'pass1234' }, db);
  agentAId = (await agentA.json()).id;
  const agentB = await postAdmin(['admin', 'agents'], { name: 'Agent B', email: `agent-b-${Date.now()}@test.com`, password: 'pass1234' }, db);
  agentBId = (await agentB.json()).id;

  const prop = await postAdmin(['admin', 'properties'], {
    title: 'Bien test facture', type: 'appartement', transaction: 'vente', price: 300000, agent_id: agentAId,
  }, db);
  const propertyId = (await prop.json()).id;

  const req = await postPublic(['requests'], { name: 'Client Facture', email: 'client.facture@test.com', property_id: propertyId }, db);
  requestId = (await req.json()).id;

  await patchAdmin(['admin', 'requests', requestId], { decision: 'accepted', status: 'closed', deal_date: '2026-02-01', deal_price: 300000 }, db, { user: { isSuperAdmin: 1 } });
});

describe('createInvoiceForRequest', () => {
  it('génère une facture pour une demande acceptée', async () => {
    const result = await createInvoiceForRequest(db, requestId);
    expect(result.error).toBeUndefined();
    expect(result.id).toBeTruthy();
    expect(result.number).toBeTruthy();
  });

  it('refuse de générer une facture pour une demande non acceptée', async () => {
    const req = await postPublic(['requests'], { name: 'Non accepté', email: 'non.accepte@test.com' }, db);
    const { id } = await req.json();
    const result = await createInvoiceForRequest(db, id);
    expect(result.error).toBeTruthy();
  });
});

describe('createManualInvoice', () => {
  it('refuse une entrée manuelle sans description/montant', async () => {
    const result = await createManualInvoice(db, { description: '', amount: null, type: 'autre' });
    expect(result.error).toBeTruthy();
  });

  it('crée une entrée manuelle valide', async () => {
    const result = await createManualInvoice(db, { description: 'Commission diverse', amount: 500, type: 'autre' });
    expect(result.error).toBeUndefined();
    expect(result.id).toBeTruthy();
  });
});

describe('isolation agent sur les factures', () => {
  it('un agent ne peut pas facturer la demande d\'un autre agent', async () => {
    const res = await postAgent(['agent', 'invoices'], { request_id: requestId }, db, { user: { role: 'agent' } }, agentBId);
    expect(res.status).toBe(403);
  });

  it('l\'agent propriétaire de la demande peut la facturer', async () => {
    const res = await postAgent(['agent', 'invoices'], { request_id: requestId }, db, { user: { role: 'agent' } }, agentAId);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });
});
