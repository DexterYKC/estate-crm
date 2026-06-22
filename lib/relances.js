import { sendRelanceEmail } from '@/lib/email';

// Relance automatique : une demande "Nouvelle" depuis plus de 48h sans réponse
// reçoit un email de relance, une seule fois (relance_sent_at empêche les doublons).
export async function runRelances(db) {
  const settings = await db.prepare('SELECT relances_enabled, name FROM agency_settings LIMIT 1').get();
  if (settings && (settings.relances_enabled === 0 || settings.relances_enabled === false)) {
    return { sent: 0, total: 0, skipped: 'disabled' };
  }
  const agencyName = settings?.name || 'Agence immobilière';

  const candidates = await db.prepare(`
    SELECT r.*, p.title AS property_title, p.ref AS property_ref
    FROM requests r LEFT JOIN properties p ON p.id = r.property_id
    WHERE r.status = 'new' AND r.relance_sent_at IS NULL AND r.email IS NOT NULL
      AND r.created_at <= datetime('now', '-48 hours')
  `).all();

  let sent = 0;
  for (const r of candidates) {
    const result = await sendRelanceEmail({ to: r.email, clientName: r.name, propertyTitle: r.property_title, propertyRef: r.property_ref, agencyName });
    await db.prepare("UPDATE requests SET relance_sent_at = datetime('now') WHERE id = ?").run(r.id);
    if (result.sent) sent++;
  }
  return { sent, total: candidates.length };
}
