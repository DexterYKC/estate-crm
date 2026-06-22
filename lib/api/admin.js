import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { runRelances } from '@/lib/relances';
import {
  notFound, forbidden, attachMainImages, getPropertyFull, logNotification,
  createInvoiceForRequest, createManualInvoice, notifyAppointment, syncMandateReminder,
} from './helpers';

export async function getAdmin(p, sp, db, session) {
  if (p[1] === 'stats') {
    const [propsAll, propsVente, propsLoc, propsActive, props3D, agentsCount, usersCount, reqAll, reqWeek, reqNew, recentReqs] = await Promise.all([
      db.prepare('SELECT COUNT(*) c FROM properties').get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE "transaction"='vente'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE "transaction"='location'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE status='active'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE tour_enabled=1`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM agents`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM users WHERE role='user'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM requests`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM requests WHERE created_at >= datetime('now','-7 days')`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM requests WHERE status='new'`).get().then(r => r.c),
      db.prepare(`SELECT r.*, p.title AS property_title, p.ref AS property_ref FROM requests r LEFT JOIN properties p ON p.id=r.property_id ORDER BY r.created_at DESC LIMIT 6`).all(),
    ]);
    return NextResponse.json({ propsAll, propsVente, propsLoc, propsActive, props3D, agentsCount, usersCount, reqAll, reqWeek, reqNew, recentReqs });
  }

  if (p[1] === 'properties' && p.length === 2) {
    const rows = await db.prepare(`SELECT pr.*, u.name AS agent_name FROM properties pr LEFT JOIN agents a ON a.id=pr.agent_id LEFT JOIN users u ON u.id=a.user_id ORDER BY pr.created_at DESC`).all();
    await attachMainImages(db, rows);
    return NextResponse.json(rows);
  }
  if (p[1] === 'properties' && p.length === 3) {
    const prop = await getPropertyFull(db, p[2]);
    if (!prop) return notFound();
    return NextResponse.json(prop);
  }
  if (p[1] === 'agents' && p.length === 2) {
    const rows = await db.prepare(`SELECT a.*, u.name, u.email, u.phone, u.status, (SELECT COUNT(*) FROM properties WHERE agent_id=a.id) AS prop_count, (SELECT COUNT(*) FROM requests WHERE agent_id=a.id) AS req_count FROM agents a JOIN users u ON u.id=a.user_id ORDER BY u.name`).all();
    return NextResponse.json(rows);
  }
  if (p[1] === 'users' && p.length === 2) {
    const rows = await db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.status, u.created_at, c.id AS client_id
      FROM users u LEFT JOIN clients c ON c.user_id = u.id
      WHERE u.role='user' ORDER BY u.created_at DESC
    `).all();
    return NextResponse.json(rows);
  }
  if (p[1] === 'requests' && p.length === 2) {
    const status = sp.get('status');
    const decision = sp.get('decision');
    let sql = `SELECT r.*, p.title AS property_title, p.ref AS property_ref, p."transaction" AS property_transaction, p.price AS property_price, u.name AS agent_name FROM requests r LEFT JOIN properties p ON p.id=r.property_id LEFT JOIN agents a ON a.id=r.agent_id LEFT JOIN users u ON u.id=a.user_id`;
    const where = [], args = [];
    if (status && status !== 'all') { where.push('r.status = ?'); args.push(status); }
    if (decision && decision !== 'all') {
      if (decision === 'pending') where.push('r.decision IS NULL');
      else { where.push('r.decision = ?'); args.push(decision); }
    }
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += ' ORDER BY r.created_at DESC';
    return NextResponse.json(await db.prepare(sql).all(...args));
  }
  if (p[1] === 'agents-list') {
    const rows = await db.prepare(`SELECT a.id, u.name FROM agents a JOIN users u ON u.id=a.user_id WHERE u.status='accepted' ORDER BY u.name`).all();
    return NextResponse.json(rows);
  }
  if (p[1] === 'settings') {
    return NextResponse.json((await db.prepare('SELECT * FROM agency_settings LIMIT 1').get()) || {});
  }
  if (p[1] === 'clients' && p.length === 2) {
    const rows = await db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM requests r WHERE r.client_id=c.id) AS request_count,
        (SELECT COUNT(*) FROM requests r WHERE r.client_id=c.id AND r.decision='accepted') AS deal_count,
        (SELECT COUNT(*) FROM properties p WHERE p.owner_id=c.user_id) AS owned_count
      FROM clients c ORDER BY c.created_at DESC
    `).all();
    return NextResponse.json(rows);
  }
  if (p[1] === 'clients' && p.length === 3) {
    const cl = await db.prepare('SELECT * FROM clients WHERE id=?').get(p[2]);
    if (!cl) return notFound();
    const [reqRows, apptRows, propRows, invRows, account] = await Promise.all([
      db.prepare(`SELECT r.*, p.title AS property_title, p.ref AS property_ref, p."transaction" AS property_transaction FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.client_id=? ORDER BY r.created_at DESC`).all(p[2]),
      db.prepare(`SELECT * FROM appointments WHERE (client_email=? AND client_email IS NOT NULL) OR (client_phone=? AND client_phone IS NOT NULL) ORDER BY date DESC`).all(cl.email || '', cl.phone || ''),
      cl.user_id ? db.prepare(`SELECT * FROM properties WHERE owner_id=?`).all(cl.user_id) : Promise.resolve([]),
      db.prepare(`SELECT * FROM invoices WHERE client_id=? ORDER BY issued_at DESC`).all(p[2]),
      cl.user_id ? db.prepare('SELECT id, status FROM users WHERE id=?').get(cl.user_id) : Promise.resolve(null),
    ]);
    return NextResponse.json({ ...cl, requests: reqRows, appointments: apptRows, properties: propRows, invoices: invRows, account });
  }

  if (p[1] === 'invoices' && p.length === 2) {
    const rows = await db.prepare(`
      SELECT i.id, i.number, i.request_id, i.client_id, i.property_id, i.type, i.amount, i.description, i.agent_id,
             i.agent_commission_amount, i.agent_commission_paid, i.agent_commission_paid_at,
             i.agency_name, i.agency_address, i.agency_email, i.agency_phone, i.issued_at,
             COALESCE(c.name, i.client_name) AS client_name,
             p.title AS property_title, p.ref AS property_ref,
             u.name AS agent_name
      FROM invoices i
      LEFT JOIN clients c ON c.id=i.client_id
      LEFT JOIN properties p ON p.id=i.property_id
      LEFT JOIN requests r ON r.id=i.request_id
      LEFT JOIN agents a ON a.id=COALESCE(i.agent_id, r.agent_id)
      LEFT JOIN users u ON u.id=a.user_id
      ORDER BY i.issued_at DESC
    `).all();
    return NextResponse.json(rows);
  }

  if (p[1] === 'reminders' && p.length === 2) {
    const agentId = sp.get('agent_id');
    let sql = `
      SELECT r.*, c.name AS client_name, u.name AS agent_name
      FROM reminders r
      LEFT JOIN clients c ON c.id=r.client_id
      LEFT JOIN agents a ON a.id=r.agent_id
      LEFT JOIN users u ON u.id=a.user_id
    `;
    const args = [];
    if (agentId === 'none') sql += ' WHERE r.agent_id IS NULL';
    else if (agentId) { sql += ' WHERE r.agent_id=?'; args.push(agentId); }
    sql += ' ORDER BY r.done ASC, r.due_date ASC';
    return NextResponse.json(await db.prepare(sql).all(...args));
  }

  return notFound();
}

export async function postAdmin(p, body, db) {
  // Create property
  if (p[1] === 'properties') {
    const id = randomUUID();
    const ref = await db.nextPropertyRef();
    const { title, description, type, transaction, price, surface, rooms, floor, city, district, address,
            agent_id, status, tour_enabled, tour_url, featured, images, amenities, owner_id,
            mandate_type, mandate_commission_pct, mandate_start, mandate_end } = body;
    if (!title || !type || !transaction || !price) return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    await db.prepare(`INSERT INTO properties (id, ref, agent_id, title, description, type, "transaction", price, surface, rooms, floor, city, district, address, status, tour_enabled, tour_url, featured, owner_id, mandate_type, mandate_commission_pct, mandate_start, mandate_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, ref, agent_id || null, title, description || '', type, transaction, parseInt(price), parseInt(surface || 0) || null, parseInt(rooms || 0) || null, parseInt(floor || 0) || null, city || '', district || '', address || '', status || 'active', tour_enabled ? 1 : 0, tour_url || '', featured ? 1 : 0, owner_id || null, mandate_type || null, mandate_commission_pct ? parseFloat(mandate_commission_pct) : null, mandate_start || null, mandate_end || null);
    if (Array.isArray(images)) {
      for (let i = 0; i < images.length; i++) {
        if (!images[i]) continue;
        await db.prepare(`INSERT INTO property_images (id, property_id, url, is_main, "order") VALUES (?,?,?,?,?)`).run(randomUUID(), id, images[i], i === 0 ? 1 : 0, i);
      }
    }
    if (Array.isArray(amenities)) {
      for (const a of amenities) if (a) await db.prepare(`INSERT INTO property_amenities (id, property_id, amenity) VALUES (?,?,?)`).run(randomUUID(), id, a);
    }
    await syncMandateReminder(db, id);
    return NextResponse.json({ ok: true, id });
  }

  // Create agent
  if (p[1] === 'agents') {
    const { name, email, password, phone, bio, photo, speciality } = body;
    if (!name || !email || !password) return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    const exists = await db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
    if (exists) return NextResponse.json({ error: 'Email déjà utilisé.' }, { status: 400 });
    const uid = randomUUID(), aid = randomUUID();
    await db.prepare(`INSERT INTO users (id, name, email, password_hash, role, phone, status) VALUES (?,?,?,?,?,?,?)`)
      .run(uid, name, email.toLowerCase(), bcrypt.hashSync(password, 10), 'agent', phone || null, 'accepted');
    await db.prepare(`INSERT INTO agents (id, user_id, bio, photo, speciality) VALUES (?,?,?,?,?)`)
      .run(aid, uid, bio || '', photo || '', speciality || '');
    return NextResponse.json({ ok: true, id: aid });
  }

  // Créer un RDV depuis une demande
  if (p[1] === 'appointments') {
    const id = randomUUID();
    const { agent_id, client_name, client_phone, client_email, date, time, notes, request_id, property_id, user_id } = body;
    await db.prepare(`INSERT INTO appointments (id, agent_id, request_id, property_id, user_id, client_name, client_phone, client_email, date, time, notes, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, agent_id || null, request_id || null, property_id || null, user_id || null, client_name || '', client_phone || '', client_email || null, date || null, time || null, notes || '', 'scheduled');
    let notif = { emailSent: false, whatsappLink: null };
    if (request_id) notif = await notifyAppointment(db, { client_email, client_phone, client_name, date, time, property_id });
    return NextResponse.json({ ok: true, id, ...notif });
  }

  // Déclenchement manuel des relances (démo/tests, en plus du cron Netlify planifié)
  if (p[1] === 'relances' && p[2] === 'run') {
    const result = await runRelances(db);
    return NextResponse.json({ ok: true, ...result });
  }

  if (p[1] === 'invoices') {
    const { request_id, description, amount, type, client_id, client_name, agent_id, issued_at } = body;
    const result = request_id
      ? await createInvoiceForRequest(db, request_id)
      : await createManualInvoice(db, { description, amount, type, client_id, client_name, agent_id, issued_at });
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...result });
  }

  if (p[1] === 'reminders') {
    const { text, due_date, client_id, request_id, agent_id } = body;
    if (!text) return NextResponse.json({ error: 'Le texte du rappel est obligatoire.' }, { status: 400 });
    const id = randomUUID();
    await db.prepare(`INSERT INTO reminders (id, agent_id, client_id, request_id, text, due_date) VALUES (?,?,?,?,?,?)`)
      .run(id, agent_id || null, client_id || null, request_id || null, text, due_date || null);
    return NextResponse.json({ ok: true, id });
  }

  return notFound();
}

export async function patchAdmin(p, body, db, session) {
  // Toggle / update property fields
  if (p[1] === 'properties' && p[2]) {
    const id = p[2];
    const exists = await db.prepare('SELECT id FROM properties WHERE id=?').get(id);
    if (!exists) return notFound();
    const allowed = ['title', 'description', 'type', 'transaction', 'price', 'surface', 'rooms', 'floor', 'city', 'district', 'address', 'agent_id', 'status', 'tour_enabled', 'tour_url', 'featured', 'owner_id', 'mandate_type', 'mandate_commission_pct', 'mandate_start', 'mandate_end'];
    const fields = [], args = [];
    for (const k of allowed) {
      if (k in body) {
        const col = k === 'transaction' ? '"transaction"' : k;
        fields.push(`${col} = ?`);
        let v = body[k];
        if (['tour_enabled', 'featured'].includes(k)) v = v ? 1 : 0;
        if (['price', 'surface', 'rooms', 'floor'].includes(k)) v = v == null || v === '' ? null : parseInt(v);
        if (k === 'mandate_commission_pct') v = v == null || v === '' ? null : parseFloat(v);
        args.push(v);
      }
    }
    if (fields.length) await db.prepare(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`).run(...args, id);

    if (Array.isArray(body.images)) {
      await db.prepare('DELETE FROM property_images WHERE property_id = ?').run(id);
      for (let i = 0; i < body.images.length; i++) {
        if (!body.images[i]) continue;
        await db.prepare(`INSERT INTO property_images (id, property_id, url, is_main, "order") VALUES (?,?,?,?,?)`).run(randomUUID(), id, body.images[i], i === 0 ? 1 : 0, i);
      }
    }
    if (Array.isArray(body.amenities)) {
      await db.prepare('DELETE FROM property_amenities WHERE property_id = ?').run(id);
      for (const a of body.amenities) if (a) await db.prepare(`INSERT INTO property_amenities (id, property_id, amenity) VALUES (?,?,?)`).run(randomUUID(), id, a);
    }
    if ('mandate_end' in body || 'agent_id' in body) await syncMandateReminder(db, id);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'agents' && p[2]) {
    const aid = p[2];
    const a = await db.prepare('SELECT * FROM agents WHERE id=?').get(aid);
    if (!a) return notFound();
    const { name, email, phone, status, bio, photo, speciality, password, commission_pct } = body;
    if (name || email || phone || status || password) {
      const fields = [], args = [];
      if (name) { fields.push('name = ?'); args.push(name); }
      if (email) { fields.push('email = ?'); args.push(email.toLowerCase()); }
      if (phone !== undefined) { fields.push('phone = ?'); args.push(phone); }
      if (status) { fields.push('status = ?'); args.push(status); }
      if (password) { fields.push('password_hash = ?'); args.push(bcrypt.hashSync(password, 10)); }
      if (fields.length) await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...args, a.user_id);
    }
    const agentFields = [], agentArgs = [];
    if (bio !== undefined) { agentFields.push('bio = ?'); agentArgs.push(bio); }
    if (photo !== undefined) { agentFields.push('photo = ?'); agentArgs.push(photo); }
    if (speciality !== undefined) { agentFields.push('speciality = ?'); agentArgs.push(speciality); }
    if (commission_pct !== undefined) { agentFields.push('commission_pct = ?'); agentArgs.push(commission_pct === '' || commission_pct == null ? null : parseFloat(commission_pct)); }
    if (agentFields.length) await db.prepare(`UPDATE agents SET ${agentFields.join(', ')} WHERE id = ?`).run(...agentArgs, aid);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'users' && p[2]) {
    const { status, notes } = body;
    if (status) await db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, p[2]);
    if (status === 'accepted') {
      const u = await db.prepare('SELECT email, name FROM users WHERE id=?').get(p[2]);
      logNotification('USER_ACCEPTED', { ...u, message: 'Bienvenue chez Prestige Immobilier ! Votre compte est désormais actif.' });
    }
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'requests' && p[2]) {
    const allowed = ['status', 'agent_id', 'notes', 'decision', 'refusal_reason', 'viewed_at', 'deal_date', 'deal_end_date', 'deal_price'];
    const fields = [], args = [];
    for (const k of allowed) {
      if (k in body) {
        fields.push(`${k} = ?`);
        args.push(k === 'deal_price' ? (body[k] === '' || body[k] == null ? null : parseInt(body[k])) : body[k]);
      }
    }
    if (fields.length) await db.prepare(`UPDATE requests SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'settings') {
    const existing = await db.prepare('SELECT id FROM agency_settings LIMIT 1').get();
    const superAdminOnly = ['currency_mode', 'tour_feature_enabled', 'relances_enabled', 'invoices_enabled', 'default_commission_pct'];
    const allowed = session.user.isSuperAdmin
      ? ['name', 'address', 'phone', 'whatsapp', 'email', 'about', 'maps_embed', ...superAdminOnly]
      : ['name', 'address', 'phone', 'whatsapp', 'email', 'about', 'maps_embed'];
    const boolFields = ['tour_feature_enabled', 'relances_enabled', 'invoices_enabled'];
    const fields = [], args = [];
    for (const k of allowed) {
      if (k in body) {
        fields.push(`${k} = ?`);
        if (boolFields.includes(k)) args.push(body[k] ? 1 : 0);
        else if (k === 'default_commission_pct') args.push(body[k] === '' || body[k] == null ? 50 : parseFloat(body[k]));
        else args.push(body[k]);
      }
    }
    if (existing && fields.length) await db.prepare(`UPDATE agency_settings SET ${fields.join(', ')} WHERE id = ?`).run(...args, existing.id);
    else if (!existing) await db.prepare(`INSERT INTO agency_settings (id, name, address, phone, whatsapp, email, about, maps_embed, currency_mode, tour_feature_enabled, relances_enabled) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(randomUUID(), body.name || '', body.address || '', body.phone || '', body.whatsapp || '', body.email || '', body.about || '', body.maps_embed || '', body.currency_mode || 'BOTH', body.tour_feature_enabled === false ? 0 : 1, body.relances_enabled === false ? 0 : 1);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'clients' && p[2]) {
    const allowed = ['name', 'phone', 'notes'];
    const fields = [], args = [];
    for (const k of allowed) if (k in body) { fields.push(`${k} = ?`); args.push(body[k]); }
    if (fields.length) await db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'reminders' && p[2]) {
    const allowed = ['text', 'due_date', 'done'];
    const fields = [], args = [];
    for (const k of allowed) if (k in body) { fields.push(`${k} = ?`); args.push(k === 'done' ? (body[k] ? 1 : 0) : body[k]); }
    if (fields.length) await db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'invoices' && p[2]) {
    if (!('agent_commission_paid' in body)) return notFound();
    const paid = body.agent_commission_paid ? 1 : 0;
    await db.prepare('UPDATE invoices SET agent_commission_paid=?, agent_commission_paid_at=? WHERE id=?')
      .run(paid, paid ? new Date().toISOString() : null, p[2]);
    return NextResponse.json({ ok: true });
  }

  return notFound();
}

export async function deleteAdmin(p, db) {
  if (p[1] === 'properties' && p[2]) {
    await db.prepare('DELETE FROM properties WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'reminders' && p[2]) {
    await db.prepare('DELETE FROM reminders WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'agents' && p[2]) {
    const a = await db.prepare('SELECT user_id FROM agents WHERE id = ?').get(p[2]);
    if (a) {
      await db.prepare('DELETE FROM agents WHERE id = ?').run(p[2]);
      await db.prepare('DELETE FROM users WHERE id = ?').run(a.user_id);
    }
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'users' && p[2]) {
    await db.prepare('DELETE FROM users WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'requests' && p[2]) {
    await db.prepare('DELETE FROM requests WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  return notFound();
}
