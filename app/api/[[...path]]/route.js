import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { notFound, unauthorized, forbidden, requireRole, getAgentId } from '@/lib/api/helpers';
import { getPublic, postPublic } from '@/lib/api/public';
import { getAdmin, postAdmin, patchAdmin, deleteAdmin } from '@/lib/api/admin';
import { getAgent, postAgent, patchAgent, deleteAgent } from '@/lib/api/agent';
import { getUser, postUser, patchUser, deleteUser } from '@/lib/api/user';

const PUBLIC_PREFIXES = ['agency', 'agents', 'stats', 'properties', 'users-list', 'factures'];

// ============================================================
// GET
// ============================================================
export async function GET(request, { params }) {
  const db = await getDb();
  const p = (params?.path || []);
  const url = new URL(request.url);
  const sp = url.searchParams;

  try {
    if (p.length === 0 || p[0] === 'health') return NextResponse.json({ status: 'ok' });

    if (PUBLIC_PREFIXES.includes(p[0])) return await getPublic(p, sp, db);

    if (p[0] === 'admin') {
      const { error, session } = await requireRole(['admin']);
      if (error) return error;
      return await getAdmin(p, sp, db, session);
    }

    if (p[0] === 'agent') {
      const { error, session } = await requireRole(['agent', 'admin']);
      if (error) return error;
      const aid = await getAgentId(session, db);
      return await getAgent(p, sp, db, session, aid);
    }

    if (p[0] === 'user') {
      const session = await getServerSession(authOptions);
      if (!session?.user) return unauthorized();
      return await getUser(p, sp, db, session);
    }

    return notFound();
  } catch (e) {
    console.error('[API GET]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================
// POST
// ============================================================
export async function POST(request, { params }) {
  const db = await getDb();
  const p = (params?.path || []);
  try {
    const body = await request.json().catch(() => ({}));

    if (p[0] === 'requests' || p[0] === 'register') return await postPublic(p, body, db);

    if (p[0] === 'user') {
      const session = await getServerSession(authOptions);
      if (!session?.user) return unauthorized();
      return await postUser(p, body, db, session);
    }

    if (p[0] === 'admin') {
      const { error } = await requireRole(['admin']);
      if (error) return error;
      return await postAdmin(p, body, db);
    }

    if (p[0] === 'agent') {
      const { error, session } = await requireRole(['agent', 'admin']);
      if (error) return error;
      const aid = await getAgentId(session, db);
      return await postAgent(p, body, db, session, aid);
    }

    return notFound();
  } catch (e) {
    console.error('[API POST]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================
// PATCH
// ============================================================
export async function PATCH(request, { params }) {
  const db = await getDb();
  const p = (params?.path || []);
  try {
    const body = await request.json().catch(() => ({}));

    if (p[0] === 'admin') {
      const { error, session } = await requireRole(['admin']);
      if (error) return error;
      return await patchAdmin(p, body, db, session);
    }

    if (p[0] === 'agent') {
      const { error, session } = await requireRole(['agent', 'admin']);
      if (error) return error;
      const aid = await getAgentId(session, db);
      return await patchAgent(p, body, db, session, aid);
    }

    if (p[0] === 'user') {
      const session = await getServerSession(authOptions);
      if (!session?.user) return unauthorized();
      return await patchUser(p, body, db, session);
    }

    return notFound();
  } catch (e) {
    console.error('[API PATCH]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ============================================================
// DELETE
// ============================================================
export async function DELETE(request, { params }) {
  const db = await getDb();
  const p = (params?.path || []);
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return unauthorized();

    if (p[0] === 'user') return await deleteUser(p, db, session);

    if (!['admin', 'agent'].includes(session.user.role)) return forbidden();

    if (p[0] === 'agent') {
      const aid = await getAgentId(session, db);
      return await deleteAgent(p, db, session, aid);
    }

    if (session.user.role !== 'admin') return forbidden();
    if (p[0] === 'admin') return await deleteAdmin(p, db);

    return notFound();
  } catch (e) {
    console.error('[API DELETE]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
