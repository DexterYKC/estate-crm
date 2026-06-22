import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { runRelances } from '@/lib/relances';

export async function GET(request) {
  const secret = request.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const db = await getDb();
  const result = await runRelances(db);
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request) {
  return GET(request);
}
