import { createClient } from '@libsql/client';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

function resolveDbUrl() {
  if (process.env.TURSO_DATABASE_URL) return process.env.TURSO_DATABASE_URL;
  const DATA_DIR = path.join(process.cwd(), 'data');
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return `file:${path.join(DATA_DIR, 'agency.db')}`;
}

let dbPromise;

function getDb() {
  if (!dbPromise) dbPromise = initialize();
  return dbPromise;
}

async function initialize() {
  const client = createClient({
    url: resolveDbUrl(),
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  await initSchema(client);
  await seedIfEmpty(client);
  return wrapClient(client);
}

function wrapClient(client) {
  return {
    prepare(sql) {
      return {
        async get(...args) {
          const rs = await client.execute({ sql, args });
          return rs.rows[0] ? { ...rs.rows[0] } : undefined;
        },
        async all(...args) {
          const rs = await client.execute({ sql, args });
          return rs.rows.map(r => ({ ...r }));
        },
        async run(...args) {
          const rs = await client.execute({ sql, args });
          return { changes: rs.rowsAffected };
        },
      };
    },
    nextPropertyRef() {
      return nextPropertyRef(client);
    },
    nextInvoiceNumber() {
      return nextInvoiceNumber(client);
    },
    findOrCreateClient(info) {
      return findOrCreateClient(client, info);
    },
  };
}

async function initSchema(client) {
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      phone TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bio TEXT,
      photo TEXT,
      speciality TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      ref TEXT,
      agent_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      "transaction" TEXT NOT NULL,
      price INTEGER NOT NULL,
      surface INTEGER,
      rooms INTEGER,
      floor INTEGER,
      city TEXT,
      district TEXT,
      address TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      views INTEGER NOT NULL DEFAULT 0,
      tour_enabled INTEGER NOT NULL DEFAULT 0,
      tour_url TEXT,
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS property_images (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      url TEXT NOT NULL,
      is_main INTEGER NOT NULL DEFAULT 0,
      "order" INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS property_amenities (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      amenity TEXT NOT NULL,
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS requests (
      id TEXT PRIMARY KEY,
      property_id TEXT,
      user_id TEXT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      message TEXT,
      contact_preference TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      agent_id TEXT,
      notes TEXT,
      relance_sent_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      property_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      request_id TEXT,
      property_id TEXT,
      user_id TEXT,
      client_name TEXT,
      client_phone TEXT,
      client_email TEXT,
      date TEXT,
      time TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled'
    );

    CREATE TABLE IF NOT EXISTS agency_settings (
      id TEXT PRIMARY KEY,
      name TEXT,
      address TEXT,
      phone TEXT,
      whatsapp TEXT,
      email TEXT,
      about TEXT,
      maps_embed TEXT
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      notes TEXT,
      user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      number TEXT,
      request_id TEXT,
      client_id TEXT,
      property_id TEXT,
      type TEXT,
      amount INTEGER,
      agency_name TEXT,
      agency_address TEXT,
      agency_email TEXT,
      agency_phone TEXT,
      issued_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      agent_id TEXT,
      client_id TEXT,
      request_id TEXT,
      text TEXT NOT NULL,
      due_date TEXT,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS search_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT,
      city TEXT,
      type TEXT,
      "transaction" TEXT,
      max_price INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Migrations légères pour les bases déjà seedées avant l'ajout de ces colonnes.
  const migrations = [
    `ALTER TABLE agency_settings ADD COLUMN currency_mode TEXT NOT NULL DEFAULT 'BOTH'`,
    `ALTER TABLE agency_settings ADD COLUMN tour_feature_enabled INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE properties ADD COLUMN ref TEXT`,
    `ALTER TABLE appointments ADD COLUMN request_id TEXT`,
    `ALTER TABLE appointments ADD COLUMN property_id TEXT`,
    `ALTER TABLE appointments ADD COLUMN user_id TEXT`,
    `ALTER TABLE appointments ADD COLUMN client_email TEXT`,
    `ALTER TABLE agency_settings ADD COLUMN relances_enabled INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE requests ADD COLUMN relance_sent_at TEXT`,
    `ALTER TABLE requests ADD COLUMN decision TEXT`,
    `ALTER TABLE requests ADD COLUMN refusal_reason TEXT`,
    `ALTER TABLE requests ADD COLUMN viewed_at TEXT`,
    `ALTER TABLE requests ADD COLUMN deal_date TEXT`,
    `ALTER TABLE requests ADD COLUMN deal_end_date TEXT`,
    `ALTER TABLE requests ADD COLUMN deal_price INTEGER`,
    `ALTER TABLE requests ADD COLUMN submission_type TEXT`,
    `ALTER TABLE properties ADD COLUMN owner_id TEXT`,
    `ALTER TABLE requests ADD COLUMN client_id TEXT`,
    `ALTER TABLE agency_settings ADD COLUMN invoices_enabled INTEGER NOT NULL DEFAULT 1`,
    `ALTER TABLE invoices ADD COLUMN agent_id TEXT`,
    `ALTER TABLE invoices ADD COLUMN description TEXT`,
    `ALTER TABLE invoices ADD COLUMN client_name TEXT`,
    // Mandat de vente/location
    `ALTER TABLE properties ADD COLUMN mandate_type TEXT`,
    `ALTER TABLE properties ADD COLUMN mandate_commission_pct REAL`,
    `ALTER TABLE properties ADD COLUMN mandate_start TEXT`,
    `ALTER TABLE properties ADD COLUMN mandate_end TEXT`,
    // Commission agent vs agence
    `ALTER TABLE agency_settings ADD COLUMN default_commission_pct REAL NOT NULL DEFAULT 50`,
    `ALTER TABLE agents ADD COLUMN commission_pct REAL`,
    `ALTER TABLE invoices ADD COLUMN agent_commission_amount INTEGER`,
    // Source du lead
    `ALTER TABLE requests ADD COLUMN source TEXT`,
    // Suivi du versement de la commission agent
    `ALTER TABLE invoices ADD COLUMN agent_commission_paid INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE invoices ADD COLUMN agent_commission_paid_at TEXT`,
    // Rappel lié à l'expiration d'un mandat
    `ALTER TABLE reminders ADD COLUMN property_id TEXT`,
  ];
  for (const sql of migrations) {
    try { await client.execute(sql); } catch (e) { /* colonne déjà existante */ }
  }

  // Distinction admin complet (accès Devise/Fonctionnalités) vs admin restreint (ex: CEO).
  let superAdminColAdded = false;
  try {
    await client.execute(`ALTER TABLE users ADD COLUMN is_super_admin INTEGER NOT NULL DEFAULT 0`);
    superAdminColAdded = true;
  } catch (e) { /* colonne déjà existante */ }
  if (superAdminColAdded) {
    // Première migration : les admins déjà existants gardent tous leurs droits (rétrocompatibilité).
    await client.execute(`UPDATE users SET is_super_admin = 1 WHERE role = 'admin'`);
  }

  // Backfill des références pour les biens créés avant l'ajout de la colonne `ref`.
  const missingRefs = await client.execute(`SELECT id FROM properties WHERE ref IS NULL ORDER BY created_at ASC`);
  if (missingRefs.rows.length > 0) {
    const startRs = await client.execute(`SELECT COUNT(*) c FROM properties WHERE ref IS NOT NULL`);
    let n = startRs.rows[0].c;
    for (const row of missingRefs.rows) {
      n += 1;
      await client.execute({ sql: 'UPDATE properties SET ref = ? WHERE id = ?', args: [`REF-${String(n).padStart(4, '0')}`, row.id] });
    }
  }

  // Backfill des clients pour les demandes créées avant l'ajout de la table `clients`.
  const orphanRequests = await client.execute(`SELECT id, name, email, phone, user_id FROM requests WHERE client_id IS NULL ORDER BY created_at ASC`);
  for (const r of orphanRequests.rows) {
    const clientId = await findOrCreateClient(client, { name: r.name, email: r.email, phone: r.phone, user_id: r.user_id });
    await client.execute({ sql: 'UPDATE requests SET client_id = ? WHERE id = ?', args: [clientId, r.id] });
  }
}

async function findOrCreateClient(client, { name, email, phone, user_id }) {
  let existing = null;
  if (email) {
    const rs = await client.execute({ sql: 'SELECT id, user_id FROM clients WHERE email = ? COLLATE NOCASE', args: [email] });
    existing = rs.rows[0] || null;
  }
  if (!existing && phone) {
    const rs = await client.execute({ sql: 'SELECT id, user_id FROM clients WHERE phone = ?', args: [phone] });
    existing = rs.rows[0] || null;
  }
  if (existing) {
    if (user_id && !existing.user_id) {
      await client.execute({ sql: 'UPDATE clients SET user_id = ? WHERE id = ?', args: [user_id, existing.id] });
    }
    return existing.id;
  }
  const id = randomUUID();
  await client.execute({
    sql: 'INSERT INTO clients (id, name, email, phone, user_id) VALUES (?,?,?,?,?)',
    args: [id, name || '', email || null, phone || null, user_id || null],
  });
  return id;
}

async function nextPropertyRef(client) {
  const rs = await client.execute('SELECT COUNT(*) c FROM properties');
  return `REF-${String(rs.rows[0].c + 1).padStart(4, '0')}`;
}

async function nextInvoiceNumber(client) {
  const rs = await client.execute('SELECT COUNT(*) c FROM invoices');
  return `FAC-${String(rs.rows[0].c + 1).padStart(4, '0')}`;
}

async function seedIfEmpty(client) {
  const countRs = await client.execute('SELECT COUNT(*) AS c FROM properties');
  const count = countRs.rows[0].c;
  if (count > 0) return;

  console.log('[DB] Seeding initial data...');

  // Agency settings
  await client.execute({
    sql: `INSERT INTO agency_settings (id, name, address, phone, whatsapp, email, about, maps_embed, currency_mode, tour_feature_enabled, relances_enabled)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      randomUUID(),
      'Prestige Immobilier',
      '12 Avenue des Champs, 75008 Paris',
      '+33 1 42 00 00 00',
      '+33612345678',
      'contact@prestige-immobilier.fr',
      "Depuis plus de 20 ans, Prestige Immobilier accompagne ses clients dans la concrétisation de leurs projets immobiliers. Notre équipe d'experts vous propose une sélection rigoureuse des plus beaux biens en France.",
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.987!2d2.3071!3d48.8722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1sen!2sfr!4v1',
      'BOTH',
      1,
      1,
    ],
  });

  // Admin user
  const adminId = randomUUID();
  await client.execute({
    sql: `INSERT INTO users (id, name, email, password_hash, role, phone, status, is_super_admin) VALUES (?,?,?,?,?,?,?,?)`,
    args: [adminId, 'Admin Principal', 'admin@agence.com', bcrypt.hashSync('admin123', 10), 'admin', '+33600000001', 'accepted', 1],
  });

  // Agents
  const agents = [
    { name: 'Sophie Laurent', email: 'sophie@agence.com', phone: '+33611111111', bio: "Spécialiste de l'immobilier de prestige à Paris depuis 10 ans.", photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400', speciality: 'Appartements de luxe' },
    { name: 'Thomas Martin', email: 'thomas@agence.com', phone: '+33622222222', bio: "Expert en villas et maisons d'exception sur la Côte d'Azur.", photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400', speciality: 'Villas & maisons' },
    { name: 'Camille Dubois', email: 'camille@agence.com', phone: '+33633333333', bio: 'Conseillère senior, spécialisée dans la location haut de gamme.', photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400', speciality: 'Location prestige' },
  ];
  const agentIds = [];
  for (const a of agents) {
    const uid = randomUUID();
    const aid = randomUUID();
    await client.execute({
      sql: `INSERT INTO users (id, name, email, password_hash, role, phone, status) VALUES (?,?,?,?,?,?,?)`,
      args: [uid, a.name, a.email, bcrypt.hashSync('agent123', 10), 'agent', a.phone, 'accepted'],
    });
    await client.execute({
      sql: `INSERT INTO agents (id, user_id, bio, photo, speciality) VALUES (?,?,?,?,?)`,
      args: [aid, uid, a.bio, a.photo, a.speciality],
    });
    agentIds.push(aid);
  }

  // Properties
  const propsData = [
    {
      title: 'Villa contemporaine avec piscine',
      description: "Splendide villa contemporaine offrant des prestations haut de gamme. Vastes espaces de vie baignés de lumière, cuisine équipée, suite parentale avec dressing, et magnifique jardin paysager avec piscine chauffée. Garage double et système domotique complet.",
      type: 'maison', transaction: 'vente', price: 1850000, surface: 280, rooms: 7, floor: 0,
      city: 'Cannes', district: 'Croisette', address: '15 Boulevard de la Croisette',
      featured: 1, tour_enabled: 1, tour_url: 'https://my.matterport.com/show/?m=zEWsxhZpGba',
      images: ['https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1596178067639-5c6e68aea6dc?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1680416124510-5eae1beca412?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Piscine', 'Garage', 'Jardin', 'Climatisation', 'Domotique', 'Sécurité']
    },
    {
      title: "Appartement haussmannien d'exception",
      description: "Magnifique appartement haussmannien au cœur du 8ème arrondissement. Hauteurs sous plafond de 3,5m, parquet en point de Hongrie, moulures et cheminées d'époque entièrement préservées. Triple exposition avec vue dégagée.",
      type: 'appartement', transaction: 'vente', price: 2450000, surface: 185, rooms: 5, floor: 4,
      city: 'Paris', district: '8ème', address: '24 Avenue Hoche',
      featured: 1, tour_enabled: 1, tour_url: 'https://my.matterport.com/show/?m=zEWsxhZpGba',
      images: ['https://images.unsplash.com/photo-1737898378296-94dc316cd443?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1653972233597-05822baa3c4e?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1680416124510-5eae1beca412?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Ascenseur', 'Cave', 'Concierge', 'Cheminée', 'Parquet ancien']
    },
    {
      title: 'Penthouse vue mer panoramique',
      description: 'Penthouse exclusif au dernier étage avec terrasse panoramique de 80m². Vue mer à 180°, finitions premium, cuisine professionnelle, salle de cinéma privée. Accès direct par ascenseur privatif.',
      type: 'appartement', transaction: 'vente', price: 3200000, surface: 220, rooms: 6, floor: 12,
      city: 'Nice', district: 'Promenade des Anglais', address: '88 Promenade des Anglais',
      featured: 1, tour_enabled: 0, tour_url: '',
      images: ['https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1737898378296-94dc316cd443?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Terrasse', 'Vue mer', 'Ascenseur privé', 'Climatisation', 'Parking']
    },
    {
      title: 'Maison de charme avec jardin',
      description: "Charmante maison familiale entièrement rénovée, située dans un quartier résidentiel calme. Beaux volumes, cuisine moderne ouverte sur séjour, 4 chambres à l'étage, jardin clos et arboré.",
      type: 'maison', transaction: 'vente', price: 875000, surface: 165, rooms: 6, floor: 0,
      city: 'Lyon', district: 'Caluire', address: '7 rue du Parc',
      featured: 0, tour_enabled: 0, tour_url: '',
      images: ['https://images.unsplash.com/photo-1706808849780-7a04fbac83ef?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Jardin', 'Garage', 'Cave', 'Cuisine équipée']
    },
    {
      title: 'Loft industriel rénové',
      description: "Magnifique loft de 145m² au sein d'une ancienne manufacture. Volumes spectaculaires, verrières d'origine, mezzanine, prestations haut de gamme. Idéal pour amateurs d'architecture.",
      type: 'appartement', transaction: 'location', price: 3800, surface: 145, rooms: 3, floor: 2,
      city: 'Paris', district: '11ème', address: '42 rue de la Roquette',
      featured: 1, tour_enabled: 1, tour_url: 'https://my.matterport.com/show/?m=zEWsxhZpGba',
      images: ['https://images.unsplash.com/photo-1680416124510-5eae1beca412?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85', 'https://images.unsplash.com/photo-1653972233597-05822baa3c4e?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Mezzanine', 'Verrière', 'Cuisine équipée', 'Ascenseur']
    },
    {
      title: 'Studio meublé Centre-ville',
      description: 'Studio entièrement meublé et équipé, idéal pour étudiant ou jeune actif. Lumineux, calme, proche des transports et commerces.',
      type: 'appartement', transaction: 'location', price: 850, surface: 28, rooms: 1, floor: 3,
      city: 'Bordeaux', district: 'Centre', address: '15 cours Pasteur',
      featured: 0, tour_enabled: 0, tour_url: '',
      images: ['https://images.unsplash.com/photo-1653972233597-05822baa3c4e?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Meublé', 'Internet', 'Ascenseur']
    },
    {
      title: 'Terrain constructible vue mer',
      description: 'Beau terrain plat de 1200m² entièrement constructible, vue mer dégagée, exposition sud. Viabilisé, permis de construire accordé pour villa contemporaine de 250m².',
      type: 'terrain', transaction: 'vente', price: 680000, surface: 1200, rooms: 0, floor: 0,
      city: 'Saint-Tropez', district: 'Les Salins', address: 'Chemin des Salins',
      featured: 0, tour_enabled: 0, tour_url: '',
      images: ['https://images.unsplash.com/photo-1692736933760-8a8a9b8c1b6f?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Vue mer', 'Viabilisé', 'Permis accordé']
    },
    {
      title: "Local commercial pied d'immeuble",
      description: 'Excellent emplacement commercial, double vitrine, fort passage piéton. Idéal restaurant, retail ou showroom. 90m² + arrière-boutique.',
      type: 'commercial', transaction: 'location', price: 4500, surface: 90, rooms: 2, floor: 0,
      city: 'Paris', district: '16ème', address: '101 avenue Victor Hugo',
      featured: 0, tour_enabled: 0, tour_url: '',
      images: ['https://images.unsplash.com/photo-1679364297777-1db77b6199be?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85'],
      amenities: ['Double vitrine', 'Climatisation', 'Réserve']
    },
  ];

  for (let i = 0; i < propsData.length; i++) {
    const p = propsData[i];
    const pid = randomUUID();
    const ref = `REF-${String(i + 1).padStart(4, '0')}`;
    await client.execute({
      sql: `INSERT INTO properties (id, ref, agent_id, title, description, type, "transaction", price, surface, rooms, floor, city, district, address, status, views, tour_enabled, tour_url, featured)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      args: [
        pid, ref, agentIds[i % agentIds.length], p.title, p.description, p.type, p.transaction,
        p.price, p.surface, p.rooms, p.floor, p.city, p.district, p.address,
        'active', Math.floor(Math.random() * 500) + 50, p.tour_enabled, p.tour_url, p.featured,
      ],
    });
    for (let j = 0; j < p.images.length; j++) {
      await client.execute({
        sql: `INSERT INTO property_images (id, property_id, url, is_main, "order") VALUES (?,?,?,?,?)`,
        args: [randomUUID(), pid, p.images[j], j === 0 ? 1 : 0, j],
      });
    }
    for (const am of p.amenities) {
      await client.execute({
        sql: `INSERT INTO property_amenities (id, property_id, amenity) VALUES (?,?,?)`,
        args: [randomUUID(), pid, am],
      });
    }
  }

  console.log('[DB] Seed complete.');
}

export { getDb };
