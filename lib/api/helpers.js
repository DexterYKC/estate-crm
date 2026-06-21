import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { randomUUID } from 'crypto';
import { sendAppointmentConfirmation } from '@/lib/email';
import { buildWhatsAppLink } from '@/lib/notifications';

export function notFound() { return NextResponse.json({ error: 'Not found' }, { status: 404 }); }
export function unauthorized() { return NextResponse.json({ error: 'Non autorisé' }, { status: 401 }); }
export function forbidden() { return NextResponse.json({ error: 'Accès refusé' }, { status: 403 }); }

export async function requireRole(roles) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: unauthorized(), session: null };
  if (roles && !roles.includes(session.user.role)) return { error: forbidden(), session: null };
  return { error: null, session };
}

export async function getAgentId(session, db) {
  if (!session?.user) return null;
  const a = await db.prepare('SELECT id FROM agents WHERE user_id = ?').get(session.user.id);
  return a?.id || null;
}

// Récupère l'image principale de plusieurs biens en un seul aller-retour DB (évite le N+1
// qui coûte cher en latence avec une base distante comme Turso).
export async function attachMainImages(db, rows) {
  if (!rows.length) return;
  const placeholders = rows.map(() => '?').join(',');
  const imgs = await db.prepare(`
    SELECT property_id, url FROM (
      SELECT property_id, url,
        ROW_NUMBER() OVER (PARTITION BY property_id ORDER BY is_main DESC, "order" ASC) AS rn
      FROM property_images
      WHERE property_id IN (${placeholders})
    ) WHERE rn = 1
  `).all(...rows.map(r => r.id));
  const byProp = new Map(imgs.map(i => [i.property_id, i.url]));
  for (const r of rows) r.main_image = byProp.get(r.id) || null;
}

export async function getPropertyFull(db, id) {
  const prop = await db.prepare('SELECT * FROM properties WHERE id = ?').get(id);
  if (!prop) return null;
  const [images, amenities, agent] = await Promise.all([
    db.prepare('SELECT * FROM property_images WHERE property_id = ? ORDER BY "order" ASC').all(id),
    db.prepare('SELECT amenity FROM property_amenities WHERE property_id = ?').all(id),
    prop.agent_id
      ? db.prepare(`SELECT a.id, a.bio, a.photo, a.speciality, u.name, u.email, u.phone FROM agents a JOIN users u ON u.id = a.user_id WHERE a.id = ?`).get(prop.agent_id)
      : Promise.resolve(null),
  ]);
  prop.images = images;
  prop.amenities = amenities.map(r => r.amenity);
  prop.agent = agent;
  return prop;
}

export function logNotification(type, payload) {
  console.log(`\n========== [NOTIFICATION MOCKED — ${type}] ==========`);
  console.log(JSON.stringify(payload, null, 2));
  console.log('====================================================\n');
}

// Calcule la part de commission qui revient à l'agent sur un montant facturé (snapshot au moment de l'émission).
async function computeAgentCommission(db, agentId, amount, agencyDefaultPct) {
  if (!agentId) return null;
  const agent = await db.prepare('SELECT commission_pct FROM agents WHERE id=?').get(agentId);
  const pct = agent?.commission_pct ?? agencyDefaultPct ?? 50;
  return Math.round((amount || 0) * pct / 100);
}

// Crée une facture à partir d'une demande acceptée (snapshot des infos agence au moment de l'émission).
export async function createInvoiceForRequest(db, requestId) {
  const agency = await db.prepare('SELECT name, address, email, phone, invoices_enabled, default_commission_pct FROM agency_settings LIMIT 1').get();
  if (agency && (agency.invoices_enabled === 0 || agency.invoices_enabled === false)) {
    return { error: 'La génération de factures est désactivée pour cette agence.' };
  }
  const r = await db.prepare(`SELECT r.*, p.price AS property_price, p."transaction" AS property_transaction FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.id=?`).get(requestId);
  if (!r) return { error: 'Demande introuvable' };
  if (r.decision !== 'accepted') return { error: 'Cette demande n\'est pas encore acceptée.' };
  const id = randomUUID();
  const number = await db.nextInvoiceNumber();
  const amount = r.deal_price ?? r.property_price ?? 0;
  const agentCommission = await computeAgentCommission(db, r.agent_id, amount, agency?.default_commission_pct);
  await db.prepare(`INSERT INTO invoices (id, number, request_id, client_id, property_id, type, amount, agency_name, agency_address, agency_email, agency_phone, agent_id, agent_commission_amount) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, number, requestId, r.client_id || null, r.property_id || null, r.property_transaction || null, amount, agency?.name || '', agency?.address || '', agency?.email || '', agency?.phone || '', r.agent_id || null, agentCommission);
  return { id, number };
}

// Crée une entrée comptable manuelle (pas liée à une demande, ex: commission perçue autrement, frais, régularisation).
export async function createManualInvoice(db, { description, amount, type, client_id, client_name, agent_id, issued_at }) {
  const agency = await db.prepare('SELECT name, address, email, phone, invoices_enabled, default_commission_pct FROM agency_settings LIMIT 1').get();
  if (agency && (agency.invoices_enabled === 0 || agency.invoices_enabled === false)) {
    return { error: 'La génération de factures est désactivée pour cette agence.' };
  }
  if (!description || !amount) return { error: 'Description et montant sont obligatoires.' };
  const id = randomUUID();
  const number = await db.nextInvoiceNumber();
  const agentCommission = await computeAgentCommission(db, agent_id, parseInt(amount), agency?.default_commission_pct);
  await db.prepare(`INSERT INTO invoices (id, number, client_id, type, amount, description, client_name, agent_id, agent_commission_amount, agency_name, agency_address, agency_email, agency_phone${issued_at ? ', issued_at' : ''}) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?${issued_at ? ',?' : ''})`)
    .run(id, number, client_id || null, type || 'autre', parseInt(amount), description, client_name || null, agent_id || null, agentCommission, agency?.name || '', agency?.address || '', agency?.email || '', agency?.phone || '', ...(issued_at ? [issued_at] : []));
  return { id, number };
}

// Maintient un rappel "mandat expire bientôt" (J-30) en phase avec le mandat courant du bien :
// crée/met à jour/supprime le rappel selon que mandate_end est défini ou pas. Idempotent.
export async function syncMandateReminder(db, propertyId) {
  const prop = await db.prepare('SELECT id, ref, title, agent_id, mandate_end FROM properties WHERE id=?').get(propertyId);
  if (!prop) return;
  const existing = await db.prepare('SELECT id FROM reminders WHERE property_id=? AND done=0').get(propertyId);
  if (!prop.mandate_end) {
    if (existing) await db.prepare('DELETE FROM reminders WHERE id=?').run(existing.id);
    return;
  }
  const due = new Date(prop.mandate_end);
  due.setDate(due.getDate() - 30);
  const dueDate = due.toISOString().slice(0, 10);
  const text = `Mandat sur "${prop.title}" (${prop.ref}) expire le ${prop.mandate_end}`;
  if (existing) {
    await db.prepare('UPDATE reminders SET text=?, due_date=?, agent_id=? WHERE id=?').run(text, dueDate, prop.agent_id || null, existing.id);
  } else {
    await db.prepare('INSERT INTO reminders (id, agent_id, property_id, text, due_date) VALUES (?,?,?,?,?)').run(randomUUID(), prop.agent_id || null, propertyId, text, dueDate);
  }
}

export async function notifyAppointment(db, { client_email, client_phone, client_name, date, time, property_id }) {
  const agency = await db.prepare('SELECT name FROM agency_settings LIMIT 1').get();
  const agencyName = agency?.name || 'Agence immobilière';
  let propertyTitle = null, propertyRef = null;
  if (property_id) {
    const prop = await db.prepare('SELECT title, ref FROM properties WHERE id = ?').get(property_id);
    propertyTitle = prop?.title || null;
    propertyRef = prop?.ref || null;
  }
  let emailResult = { sent: false };
  if (client_email) {
    emailResult = await sendAppointmentConfirmation({ to: client_email, clientName: client_name, date, time, propertyTitle, propertyRef, agencyName });
  }
  const whatsappLink = buildWhatsAppLink({ phone: client_phone, clientName: client_name, date, time, propertyTitle, propertyRef, agencyName });
  return { emailSent: emailResult.sent, whatsappLink };
}
