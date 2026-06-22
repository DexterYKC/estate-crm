import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { notFound, attachMainImages } from './helpers';

export async function getUser(p, sp, db, session) {
  const uid = session.user.id;

  if (p[1] === 'me') {
    const u = await db.prepare('SELECT id, name, email, phone, role, status, created_at FROM users WHERE id=?').get(uid);
    return NextResponse.json(u);
  }

  if (p[1] === 'favorites') {
    const rows = await db.prepare(`SELECT pr.*, (SELECT url FROM property_images WHERE property_id=pr.id ORDER BY is_main DESC LIMIT 1) AS main_image FROM favorites f JOIN properties pr ON pr.id=f.property_id WHERE f.user_id=? ORDER BY f.id DESC`).all(uid);
    return NextResponse.json(rows);
  }

  if (p[1] === 'favorites-ids') {
    const ids = (await db.prepare('SELECT property_id FROM favorites WHERE user_id=?').all(uid)).map(r => r.property_id);
    return NextResponse.json(ids);
  }

  if (p[1] === 'requests') {
    const rows = await db.prepare(`SELECT r.*, p.title AS property_title, p.ref AS property_ref, (SELECT url FROM property_images WHERE property_id=p.id ORDER BY is_main DESC LIMIT 1) AS property_image FROM requests r LEFT JOIN properties p ON p.id=r.property_id WHERE r.user_id=? OR r.email=? ORDER BY r.created_at DESC`).all(uid, session.user.email);
    return NextResponse.json(rows);
  }

  if (p[1] === 'stats') {
    const [favCount, reqCount, reqOpen] = await Promise.all([
      db.prepare('SELECT COUNT(*) c FROM favorites WHERE user_id=?').get(uid).then(r => r.c),
      db.prepare('SELECT COUNT(*) c FROM requests WHERE user_id=? OR email=?').get(uid, session.user.email).then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM requests WHERE (user_id=? OR email=?) AND status != 'closed'`).get(uid, session.user.email).then(r => r.c),
    ]);
    return NextResponse.json({ favCount, reqCount, reqOpen });
  }

  if (p[1] === 'appointments') {
    const rows = await db.prepare(`SELECT a.*, p.title AS property_title, p.ref AS property_ref FROM appointments a LEFT JOIN properties p ON p.id=a.property_id WHERE a.user_id=? ORDER BY a.date ASC, a.time ASC`).all(uid);
    return NextResponse.json(rows);
  }

  if (p[1] === 'my-properties') {
    const rows = await db.prepare(`SELECT * FROM properties WHERE owner_id=? ORDER BY created_at DESC`).all(uid);
    await attachMainImages(db, rows);
    return NextResponse.json(rows);
  }

  if (p[1] === 'my-deals') {
    const rows = await db.prepare(`
      SELECT r.*, p.title AS property_title, p.ref AS property_ref, p."transaction" AS property_transaction,
        (SELECT id FROM invoices WHERE request_id=r.id LIMIT 1) AS invoice_id
      FROM requests r LEFT JOIN properties p ON p.id=r.property_id
      WHERE (r.user_id=? OR r.email=?) AND r.decision='accepted'
      ORDER BY r.deal_date DESC
    `).all(uid, session.user.email);
    return NextResponse.json(rows);
  }

  if (p[1] === 'search-alerts') {
    const alerts = await db.prepare('SELECT * FROM search_alerts WHERE user_id=? ORDER BY created_at DESC').all(uid);
    for (const a of alerts) {
      const filters = ["status = 'active'"]; const args = [];
      if (a.city) { filters.push('(city LIKE ? OR district LIKE ?)'); args.push(`%${a.city}%`, `%${a.city}%`); }
      if (a.type) { filters.push('type = ?'); args.push(a.type); }
      if (a.transaction) { filters.push('"transaction" = ?'); args.push(a.transaction); }
      if (a.max_price) { filters.push('price <= ?'); args.push(a.max_price); }
      a.match_count = (await db.prepare(`SELECT COUNT(*) c FROM properties WHERE ${filters.join(' AND ')}`).get(...args)).c;
    }
    return NextResponse.json(alerts);
  }

  return notFound();
}

export async function postUser(p, body, db, session) {
  if (p[1] === 'favorites' && p[2]) {
    const exists = await db.prepare('SELECT id FROM favorites WHERE user_id=? AND property_id=?').get(session.user.id, p[2]);
    if (!exists) await db.prepare('INSERT INTO favorites (id, user_id, property_id) VALUES (?,?,?)').run(randomUUID(), session.user.id, p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'search-alerts') {
    const { name, city, type, transaction, max_price } = body;
    const id = randomUUID();
    await db.prepare(`INSERT INTO search_alerts (id, user_id, name, city, type, "transaction", max_price) VALUES (?,?,?,?,?,?,?)`)
      .run(id, session.user.id, name || null, city || null, type || null, transaction || null, max_price || null);
    return NextResponse.json({ ok: true, id });
  }
  return notFound();
}

export async function patchUser(p, body, db, session) {
  if (p[1] === 'profile') {
    const { name, phone, password } = body;
    const fields = [], args = [];
    if (name) { fields.push('name = ?'); args.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); args.push(phone); }
    if (password) { fields.push('password_hash = ?'); args.push(bcrypt.hashSync(password, 10)); }
    if (fields.length) await db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...args, session.user.id);
    return NextResponse.json({ ok: true });
  }
  return notFound();
}

export async function deleteUser(p, db, session) {
  if (p[1] === 'favorites' && p[2]) {
    await db.prepare('DELETE FROM favorites WHERE user_id=? AND property_id=?').run(session.user.id, p[2]);
    return NextResponse.json({ ok: true });
  }
  if (p[1] === 'search-alerts' && p[2]) {
    await db.prepare('DELETE FROM search_alerts WHERE id=? AND user_id=?').run(p[2], session.user.id);
    return NextResponse.json({ ok: true });
  }
  return notFound();
}
