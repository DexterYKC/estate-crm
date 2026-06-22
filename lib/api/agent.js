import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import {
  notFound, forbidden, attachMainImages, getPropertyFull,
  createInvoiceForRequest, createManualInvoice, notifyAppointment, syncMandateReminder,
} from './helpers';

export async function getAgent(p, sp, db, session, aid) {
  if (p[1] === 'stats') {
    if (!aid) return NextResponse.json({ propsCount: 0, reqNew: 0, reqAll: 0, apptUpcoming: 0, totalViews: 0, recentReqs: [], agent_id: aid });
    const [propsCount, reqNew, reqAll, apptUpcoming, totalViews, recentReqs] = await Promise.all([
      db.prepare('SELECT COUNT(*) c FROM properties WHERE agent_id=?').get(aid).then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM requests WHERE agent_id=? AND status='new'`).get(aid).then(r => r.c),
      db.prepare('SELECT COUNT(*) c FROM requests WHERE agent_id=?').get(aid).then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM appointments WHERE agent_id=? AND date >= date('now')`).get(aid).then(r => r.c),
      db.prepare(`SELECT COALESCE(SUM(views),0) c FROM properties WHERE agent_id=?`).get(aid).then(r => r.c),
      db.prepare(`SELECT r.*, p.title AS property_title, p.ref AS property_ref FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.agent_id=? ORDER BY r.created_at DESC LIMIT 5`).all(aid),
    ]);
    return NextResponse.json({ propsCount, reqNew, reqAll, apptUpcoming, totalViews, recentReqs, agent_id: aid });
  }

  if (p[1] === 'properties' && p.length === 2) {
    if (!aid) return NextResponse.json([]);
    const rows = await db.prepare(`SELECT * FROM properties WHERE agent_id=? ORDER BY created_at DESC`).all(aid);
    await attachMainImages(db, rows);
    return NextResponse.json(rows);
  }
  if (p[1] === 'properties' && p.length === 3) {
    const prop = await getPropertyFull(db, p[2]);
    if (!prop) return notFound();
    if (session.user.role === 'agent' && prop.agent_id !== aid) return forbidden();
    return NextResponse.json(prop);
  }

  if (p[1] === 'requests' && p.length === 2) {
    if (!aid) return NextResponse.json([]);
    const status = sp.get('status');
    const decision = sp.get('decision');
    let sql = `SELECT r.*, p.title AS property_title, p.ref AS property_ref, p."transaction" AS property_transaction, p.price AS property_price FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.agent_id=?`;
    const args = [aid];
    if (status && status !== 'all') { sql += ' AND r.status = ?'; args.push(status); }
    if (decision && decision !== 'all') {
      if (decision === 'pending') sql += ' AND r.decision IS NULL';
      else { sql += ' AND r.decision = ?'; args.push(decision); }
    }
    sql += ' ORDER BY r.created_at DESC';
    return NextResponse.json(await db.prepare(sql).all(...args));
  }

  if (p[1] === 'appointments') {
    if (!aid) return NextResponse.json([]);
    return NextResponse.json(await db.prepare('SELECT * FROM appointments WHERE agent_id=? ORDER BY date ASC, time ASC').all(aid));
  }

  if (p[1] === 'profile') {
    if (!aid) return notFound();
    const row = await db.prepare(`SELECT a.*, u.name, u.email, u.phone FROM agents a JOIN users u ON u.id=a.user_id WHERE a.id=?`).get(aid);
    return NextResponse.json(row);
  }

  if (p[1] === 'clients' && p.length === 2) {
    if (!aid) return NextResponse.json([]);
    const rows = await db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM requests r WHERE r.client_id=c.id AND r.agent_id=?) AS request_count,
        (SELECT COUNT(*) FROM requests r WHERE r.client_id=c.id AND r.agent_id=? AND r.decision='accepted') AS deal_count
      FROM clients c
      WHERE c.id IN (SELECT DISTINCT client_id FROM requests WHERE agent_id=? AND client_id IS NOT NULL)
      ORDER BY c.created_at DESC
    `).all(aid, aid, aid);
    return NextResponse.json(rows);
  }
  if (p[1] === 'clients' && p.length === 3) {
    if (!aid) return notFound();
    const owns = await db.prepare('SELECT id FROM requests WHERE client_id=? AND agent_id=? LIMIT 1').get(p[2], aid);
    if (!owns) return forbidden();
    const cl = await db.prepare('SELECT * FROM clients WHERE id=?').get(p[2]);
    if (!cl) return notFound();
    const [reqRows, apptRows, invRows] = await Promise.all([
      db.prepare(`SELECT r.*, p.title AS property_title, p.ref AS property_ref, p."transaction" AS property_transaction FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.client_id=? AND r.agent_id=? ORDER BY r.created_at DESC`).all(p[2], aid),
      db.prepare(`SELECT * FROM appointments WHERE agent_id=? AND ((client_email=? AND client_email IS NOT NULL) OR (client_phone=? AND client_phone IS NOT NULL)) ORDER BY date DESC`).all(aid, cl.email || '', cl.phone || ''),
      db.prepare(`SELECT * FROM invoices WHERE client_id=? ORDER BY issued_at DESC`).all(p[2]),
    ]);
    return NextResponse.json({ ...cl, requests: reqRows, appointments: apptRows, properties: [], invoices: invRows });
  }

  if (p[1] === 'invoices' && p.length === 2) {
    if (!aid) return NextResponse.json([]);
    const rows = await db.prepare(`
      SELECT i.id, i.number, i.request_id, i.client_id, i.property_id, i.type, i.amount, i.description, i.agent_id,
             i.agent_commission_amount, i.agent_commission_paid, i.agent_commission_paid_at,
             i.agency_name, i.agency_address, i.agency_email, i.agency_phone, i.issued_at,
             COALESCE(c.name, i.client_name) AS client_name,
             p.title AS property_title, p.ref AS property_ref
      FROM invoices i
      LEFT JOIN requests r ON r.id=i.request_id
      LEFT JOIN clients c ON c.id=i.client_id
      LEFT JOIN properties p ON p.id=i.property_id
      WHERE COALESCE(i.agent_id, r.agent_id)=?
      ORDER BY i.issued_at DESC
    `).all(aid);
    return NextResponse.json(rows);
  }

  if (p[1] === 'reminders' && p.length === 2) {
    if (!aid) return NextResponse.json([]);
    const rows = await db.prepare(`
      SELECT r.*, c.name AS client_name
      FROM reminders r LEFT JOIN clients c ON c.id=r.client_id
      WHERE r.agent_id=? ORDER BY r.done ASC, r.due_date ASC
    `).all(aid);
    return NextResponse.json(rows);
  }

  return notFound();
}

export async function postAgent(p, body, db, session, aid) {
  if (!aid) return NextResponse.json({ error: 'Aucun profil agent associé.' }, { status: 400 });

  if (p[1] === 'reminders') {
    const { text, due_date, client_id, request_id } = body;
    if (!text) return NextResponse.json({ error: 'Le texte du rappel est obligatoire.' }, { status: 400 });
    const id = randomUUID();
    await db.prepare(`INSERT INTO reminders (id, agent_id, client_id, request_id, text, due_date) VALUES (?,?,?,?,?,?)`)
      .run(id, aid, client_id || null, request_id || null, text, due_date || null);
    return NextResponse.json({ ok: true, id });
  }

  // Create my property
  if (p[1] === 'properties') {
    const id = randomUUID();
    const ref = await db.nextPropertyRef();
    const { title, description, type, transaction, price, surface, rooms, floor, city, district, address,
            status, tour_enabled, tour_url, images, amenities, owner_id,
            mandate_type, mandate_commission_pct, mandate_start, mandate_end } = body;
    if (!title || !type || !transaction || !price) return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    await db.prepare(`INSERT INTO properties (id, ref, agent_id, title, description, type, "transaction", price, surface, rooms, floor, city, district, address, status, tour_enabled, tour_url, featured, owner_id, mandate_type, mandate_commission_pct, mandate_start, mandate_end) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, ref, aid, title, description || '', type, transaction, parseInt(price), parseInt(surface || 0) || null, parseInt(rooms || 0) || null, parseInt(floor || 0) || null, city || '', district || '', address || '', status || 'active', tour_enabled ? 1 : 0, tour_url || '', 0, owner_id || null, mandate_type || null, mandate_commission_pct ? parseFloat(mandate_commission_pct) : null, mandate_start || null, mandate_end || null);
    if (Array.isArray(images)) for (let i = 0; i < images.length; i++) if (images[i]) await db.prepare(`INSERT INTO property_images (id, property_id, url, is_main, "order") VALUES (?,?,?,?,?)`).run(randomUUID(), id, images[i], i === 0 ? 1 : 0, i);
    if (Array.isArray(amenities)) for (const a of amenities) if (a) await db.prepare(`INSERT INTO property_amenities (id, property_id, amenity) VALUES (?,?,?)`).run(randomUUID(), id, a);
    await syncMandateReminder(db, id);
    return NextResponse.json({ ok: true, id });
  }

  if (p[1] === 'appointments') {
    const id = randomUUID();
    const { client_name, client_phone, client_email, date, time, notes, request_id, property_id, user_id } = body;
    await db.prepare(`INSERT INTO appointments (id, agent_id, request_id, property_id, user_id, client_name, client_phone, client_email, date, time, notes, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, aid, request_id || null, property_id || null, user_id || null, client_name || '', client_phone || '', client_email || null, date || null, time || null, notes || '', 'scheduled');
    let notif = { emailSent: false, whatsappLink: null };
    if (request_id) notif = await notifyAppointment(db, { client_email, client_phone, client_name, date, time, property_id });
    return NextResponse.json({ ok: true, id, ...notif });
  }

  if (p[1] === 'invoices') {
    const { request_id, description, amount, type, client_id, client_name, issued_at } = body;
    let result;
    if (request_id) {
      const owns = await db.prepare('SELECT id FROM requests WHERE id=? AND agent_id=?').get(request_id, aid);
      if (!owns) return forbidden();
      result = await createInvoiceForRequest(db, request_id);
    } else {
      result = await createManualInvoice(db, { description, amount, type, client_id, client_name, agent_id: aid, issued_at });
    }
    if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
    return NextResponse.json({ ok: true, ...result });
  }

  return notFound();
}

export async function patchAgent(p, body, db, session, aid) {
  if (!aid) return NextResponse.json({ error: 'Pas de profil agent.' }, { status: 400 });

  if (p[1] === 'reminders' && p[2]) {
    const rem = await db.prepare('SELECT agent_id FROM reminders WHERE id=?').get(p[2]);
    if (!rem) return notFound();
    if (session.user.role === 'agent' && rem.agent_id !== aid) return forbidden();
    const allowed = ['text', 'due_date', 'done'];
    const fields = [], args = [];
    for (const k of allowed) if (k in body) { fields.push(`${k} = ?`); args.push(k === 'done' ? (body[k] ? 1 : 0) : body[k]); }
    if (fields.length) await db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'properties' && p[2]) {
    const prop = await db.prepare('SELECT agent_id FROM properties WHERE id=?').get(p[2]);
    if (!prop) return notFound();
    if (session.user.role === 'agent' && prop.agent_id !== aid) return forbidden();
    const allowed = ['title', 'description', 'type', 'transaction', 'price', 'surface', 'rooms', 'floor', 'city', 'district', 'address', 'status', 'tour_enabled', 'tour_url', 'owner_id', 'mandate_type', 'mandate_commission_pct', 'mandate_start', 'mandate_end'];
    const fields = [], args = [];
    for (const k of allowed) {
      if (k in body) {
        const col = k === 'transaction' ? '"transaction"' : k;
        fields.push(`${col} = ?`);
        let v = body[k];
        if (k === 'tour_enabled') v = v ? 1 : 0;
        if (['price', 'surface', 'rooms', 'floor'].includes(k)) v = v == null || v === '' ? null : parseInt(v);
        if (k === 'mandate_commission_pct') v = v == null || v === '' ? null : parseFloat(v);
        args.push(v);
      }
    }
    if (fields.length) await db.prepare(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    if (Array.isArray(body.images)) {
      await db.prepare('DELETE FROM property_images WHERE property_id = ?').run(p[2]);
      for (let i = 0; i < body.images.length; i++) if (body.images[i]) await db.prepare(`INSERT INTO property_images (id, property_id, url, is_main, "order") VALUES (?,?,?,?,?)`).run(randomUUID(), p[2], body.images[i], i === 0 ? 1 : 0, i);
    }
    if (Array.isArray(body.amenities)) {
      await db.prepare('DELETE FROM property_amenities WHERE property_id = ?').run(p[2]);
      for (const a of body.amenities) if (a) await db.prepare(`INSERT INTO property_amenities (id, property_id, amenity) VALUES (?,?,?)`).run(randomUUID(), p[2], a);
    }
    if ('mandate_end' in body) await syncMandateReminder(db, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'requests' && p[2]) {
    const r = await db.prepare('SELECT agent_id FROM requests WHERE id=?').get(p[2]);
    if (!r) return notFound();
    if (session.user.role === 'agent' && r.agent_id !== aid) return forbidden();
    const allowed = ['status', 'notes', 'decision', 'refusal_reason', 'viewed_at', 'deal_date', 'deal_end_date', 'deal_price'];
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

  if (p[1] === 'appointments' && p[2]) {
    const a = await db.prepare('SELECT agent_id FROM appointments WHERE id=?').get(p[2]);
    if (!a) return notFound();
    if (session.user.role === 'agent' && a.agent_id !== aid) return forbidden();
    const allowed = ['client_name', 'client_phone', 'date', 'time', 'notes', 'status'];
    const fields = [], args = [];
    for (const k of allowed) if (k in body) { fields.push(`${k} = ?`); args.push(body[k]); }
    if (fields.length) await db.prepare(`UPDATE appointments SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'profile') {
    const a = await db.prepare('SELECT user_id FROM agents WHERE id=?').get(aid);
    const { name, phone, bio, photo, speciality, password } = body;
    const uFields = [], uArgs = [];
    if (name) { uFields.push('name = ?'); uArgs.push(name); }
    if (phone !== undefined) { uFields.push('phone = ?'); uArgs.push(phone); }
    if (password) { uFields.push('password_hash = ?'); uArgs.push(bcrypt.hashSync(password, 10)); }
    if (uFields.length) await db.prepare(`UPDATE users SET ${uFields.join(', ')} WHERE id = ?`).run(...uArgs, a.user_id);
    const aFields = [], aArgs = [];
    if (bio !== undefined) { aFields.push('bio = ?'); aArgs.push(bio); }
    if (photo !== undefined) { aFields.push('photo = ?'); aArgs.push(photo); }
    if (speciality !== undefined) { aFields.push('speciality = ?'); aArgs.push(speciality); }
    if (aFields.length) await db.prepare(`UPDATE agents SET ${aFields.join(', ')} WHERE id = ?`).run(...aArgs, aid);
    return NextResponse.json({ ok: true });
  }

  if (p[1] === 'clients' && p[2]) {
    const owns = await db.prepare('SELECT id FROM requests WHERE client_id=? AND agent_id=? LIMIT 1').get(p[2], aid);
    if (!owns) return forbidden();
    const allowed = ['name', 'phone', 'notes'];
    const fields = [], args = [];
    for (const k of allowed) if (k in body) { fields.push(`${k} = ?`); args.push(body[k]); }
    if (fields.length) await db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...args, p[2]);
    return NextResponse.json({ ok: true });
  }

  return notFound();
}

export async function deleteAgent(p, db, session, aid) {
  if (!aid) return forbidden();
  if (p[1] === 'properties' && p[2]) {
    const prop = await db.prepare('SELECT agent_id FROM properties WHERE id=?').get(p[2]);
    if (!prop) return notFound();
    if (session.user.role === 'agent' && prop.agent_id !== aid) return forbidden();
    await db.prepare('DELETE FROM properties WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'appointments' && p[2]) {
    const a = await db.prepare('SELECT agent_id FROM appointments WHERE id=?').get(p[2]);
    if (!a) return notFound();
    if (session.user.role === 'agent' && a.agent_id !== aid) return forbidden();
    await db.prepare('DELETE FROM appointments WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'reminders' && p[2]) {
    const rem = await db.prepare('SELECT agent_id FROM reminders WHERE id=?').get(p[2]);
    if (!rem) return notFound();
    if (session.user.role === 'agent' && rem.agent_id !== aid) return forbidden();
    await db.prepare('DELETE FROM reminders WHERE id = ?').run(p[2]);
    return NextResponse.json({ ok: true });
  }
  return notFound();
}
