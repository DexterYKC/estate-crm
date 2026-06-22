# Estate CRM — real-estate agency website + CRM back-office

A full-stack **real-estate agency platform**: a public showcase website for buyers, renters and sellers, plus a role-based CRM back-office where agents and the agency owner manage listings, clients, deals, mandates, commissions and invoices.

It started as a client project (agency site + internal tooling). This repo is a **sanitized demo export**: all branding, credentials and client data were removed, and the seed data is fictional ("Prestige Immobilier", Unsplash photos, placeholder phone numbers). The UI is in French; code and docs are in English.

## Features

**Public website**
- Property search with filters (type, transaction, price, surface, rooms, city), featured listings, image gallery
- Optional **3D virtual tour** embed per listing and a **currency switcher** (configurable by the agency)
- Contact form, "sell or rent your property" submission form for owners, agency page with map
- Client accounts: favorites, saved searches with **search alerts**, appointment booking, own submissions and requests

**Back-office (admin + agent roles)**
- Listings CRUD with photo upload, agent profiles and specialities
- Requests / deals pipeline (inquiries and owner submissions merged into one tracked flow)
- Appointment calendar with confirmation emails
- **Client records** (one page per client)
- **Accounting**: invoices plus manual entries, filters, **CSV export**
- **Mandates** with expiry dates, **agent commissions** and payout tracking
- **Automatic reminders** (follow-ups, mandate expiry) driven by a protected cron endpoint and a Netlify Scheduled Function
- Restricted super-admin (CEO) area for agency-wide settings and user management

## Stack

Next.js 14 (App Router) · React 18 · Tailwind CSS + shadcn/ui (Radix) · NextAuth (credentials, bcrypt, JWT roles) · libSQL / Turso (local SQLite file in dev) · Resend (transactional email) · Recharts · Vitest · Netlify (`@netlify/plugin-nextjs`), with a PM2 + nginx sample for self-hosting.

## Architecture notes

- One catch-all route handler (`app/api/[[...path]]/route.js`) dispatches to modular API files in `lib/api/`, split by audience: `public`, `user`, `agent`, `admin`.
- `lib/db.js` creates the schema on boot (idempotent `CREATE TABLE IF NOT EXISTS` plus additive `ALTER TABLE` migrations) and seeds demo data when the DB is empty. A MySQL schema (`lib/mysql-schema.sql`) is included for a future migration.
- Authorization is enforced server-side per role in each API module, not only in the UI. The cron endpoint is protected by a shared-secret header.
- Emails degrade gracefully: without a Resend key they are logged instead of sent.

## Run it locally

```bash
cp .env.example .env.local   # set NEXTAUTH_SECRET at minimum
npm install
npm run dev                  # the SQLite file is created and seeded automatically
npm test                     # Vitest
```

Demo logins are listed on the `/login` page (seed accounts only: `admin@agence.com`, `sophie@agence.com`, `client@agence.com`).

## Status

Working demo, derived from a real agency project. Not packaged as a generic product.
