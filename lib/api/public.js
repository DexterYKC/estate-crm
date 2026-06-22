import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { notFound, unauthorized, forbidden, attachMainImages, getPropertyFull, logNotification, getAgentId } from './helpers';

export async function getPublic(p, sp, db) {
  if (p[0] === 'agency') {
    return NextResponse.json((await db.prepare('SELECT * FROM agency_settings LIMIT 1').get()) || {});
  }
  if (p[0] === 'agents') {
    const rows = await db.prepare(`SELECT a.id, a.bio, a.photo, a.speciality, u.name, u.email, u.phone FROM agents a JOIN users u ON u.id = a.user_id WHERE u.status = 'accepted'`).all();
    return NextResponse.json(rows);
  }
  if (p[0] === 'stats') {
    const [properties, agents, cities] = await Promise.all([
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE status = 'active'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(*) c FROM agents a JOIN users u ON u.id=a.user_id WHERE u.status='accepted'`).get().then(r => r.c),
      db.prepare(`SELECT COUNT(DISTINCT city) c FROM properties WHERE status='active'`).get().then(r => r.c),
    ]);
    return NextResponse.json({ properties, agents, cities, years: 20 });
  }
  if (p[0] === 'properties' && p.length === 1) {
    const filters = ['status = ?']; const args = ['active'];
    const type = sp.get('type'), trans = sp.get('transaction'), city = sp.get('city');
    const minPrice = sp.get('minPrice'), maxPrice = sp.get('maxPrice');
    const minSurface = sp.get('minSurface'), featured = sp.get('featured'), search = sp.get('q');
    if (type) { filters.push('type = ?'); args.push(type); }
    if (trans) { filters.push('"transaction" = ?'); args.push(trans); }
    if (city) { filters.push('(city LIKE ? OR district LIKE ?)'); args.push(`%${city}%`, `%${city}%`); }
    if (minPrice) { filters.push('price >= ?'); args.push(parseInt(minPrice)); }
    if (maxPrice) { filters.push('price <= ?'); args.push(parseInt(maxPrice)); }
    if (minSurface) { filters.push('surface >= ?'); args.push(parseInt(minSurface)); }
    if (featured === '1') filters.push('featured = 1');
    if (search) { filters.push('(title LIKE ? OR description LIKE ?)'); args.push(`%${search}%`, `%${search}%`); }
    const page = Math.max(1, parseInt(sp.get('page') || '1'));
    const limit = Math.min(48, parseInt(sp.get('limit') || '12'));
    const offset = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      db.prepare(`SELECT * FROM properties WHERE ${filters.join(' AND ')} ORDER BY featured DESC, created_at DESC LIMIT ? OFFSET ?`).all(...args, limit, offset),
      db.prepare(`SELECT COUNT(*) c FROM properties WHERE ${filters.join(' AND ')}`).get(...args).then(r => r.c),
    ]);
    await attachMainImages(db, rows);
    return NextResponse.json({ items: rows, total, page, limit, pages: Math.ceil(total / limit) });
  }
  if (p[0] === 'properties' && p.length === 2) {
    const prop = await getPropertyFull(db, p[1]);
    if (!prop) return notFound();
    await db.prepare('UPDATE properties SET views = views + 1 WHERE id = ?').run(p[1]);
    return NextResponse.json(prop);
  }

  // Liste des comptes clients (pour rattacher un propriétaire à un bien) — admin et agent
  if (p[0] === 'users-list') {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorized();
    if (!['admin', 'agent'].includes(session.user.role)) return forbidden();
    const rows = await db.prepare(`SELECT id, name, email FROM users WHERE role='user' AND status='accepted' ORDER BY name`).all();
    return NextResponse.json(rows);
  }

  // Lecture d'une facture — admin, agent propriétaire de la demande liée, ou le client lui-même
  if (p[0] === 'factures' && p[1]) {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorized();
    const inv = await db.prepare('SELECT * FROM invoices WHERE id=?').get(p[1]);
    if (!inv) return notFound();
    const [req, cl, prop] = await Promise.all([
      inv.request_id ? db.prepare('SELECT * FROM requests WHERE id=?').get(inv.request_id) : Promise.resolve(null),
      inv.client_id ? db.prepare('SELECT * FROM clients WHERE id=?').get(inv.client_id) : Promise.resolve(null),
      inv.property_id ? db.prepare('SELECT * FROM properties WHERE id=?').get(inv.property_id) : Promise.resolve(null),
    ]);
    let allowed = session.user.role === 'admin';
    if (!allowed && session.user.role === 'agent') {
      const aid = await getAgentId(session, db);
      allowed = !!aid && req?.agent_id === aid;
    }
    if (!allowed && cl) {
      allowed = cl.user_id === session.user.id || (cl.email && cl.email.toLowerCase() === session.user.email?.toLowerCase());
    }
    if (!allowed) return forbidden();
    return NextResponse.json({ ...inv, request: req, client: cl, property: prop });
  }

  return notFound();
}

export async function postPublic(p, body, db) {
  // Public: contact request
  if (p[0] === 'requests') {
    const id = randomUUID();
    const { property_id, name, email, phone, message, contact_preference, submission_type, source } = body;
    if (!name || (!email && !phone)) return NextResponse.json({ error: 'Le nom et un moyen de contact sont obligatoires.' }, { status: 400 });
    let agent_id = null, propertyTitle = null;
    if (property_id) {
      const pr = await db.prepare('SELECT agent_id, title FROM properties WHERE id = ?').get(property_id);
      agent_id = pr?.agent_id || null;
      propertyTitle = pr?.title;
    }
    // Attach user_id if logged in
    const session = await getServerSession(authOptions);
    const user_id = session?.user?.id || null;
    const client_id = await db.findOrCreateClient({ name, email, phone, user_id });
    await db.prepare(`INSERT INTO requests (id, property_id, user_id, name, email, phone, message, contact_preference, status, agent_id, submission_type, client_id, source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .run(id, property_id || null, user_id, name, email || null, phone || null, message || null, contact_preference || 'email', 'new', agent_id, submission_type || null, client_id, source || null);
    logNotification('NEW_REQUEST', { id, name, email, phone, message, contact_preference, property: propertyTitle, agent_id, user_id, submission_type });
    return NextResponse.json({ ok: true, id });
  }

  // Public: register
  if (p[0] === 'register') {
    const { name, email, password, phone } = body;
    if (!name || !email || !password) return NextResponse.json({ error: 'Champs obligatoires manquants.' }, { status: 400 });
    const exists = await db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (exists) return NextResponse.json({ error: 'Un compte avec cet email existe déjà.' }, { status: 400 });
    const id = randomUUID();
    // Auto-accept for MVP demo (in production: keep 'pending' so admin validates)
    await db.prepare(`INSERT INTO users (id, name, email, password_hash, role, phone, status) VALUES (?,?,?,?,?,?,?)`)
      .run(id, name, email.toLowerCase(), bcrypt.hashSync(password, 10), 'user', phone || null, 'accepted');
    logNotification('NEW_USER_REGISTRATION', { id, name, email, phone, note: 'Compte auto-accepté pour la démo. En prod, mettre status=pending puis valider via admin.' });
    return NextResponse.json({ ok: true, message: 'Votre compte a été créé. Vous pouvez maintenant vous connecter.' });
  }

  return notFound();
}
