function formatDateFr(date) {
  if (!date) return '';
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return date;
  }
}

export function buildWhatsAppLink({ phone, clientName, date, time, propertyTitle, propertyRef, agencyName }) {
  if (!phone) return null;
  const cleaned = phone.replace(/[^0-9]/g, '');
  if (!cleaned) return null;
  const bienLine = propertyTitle ? ` concernant le bien ${propertyRef ? `${propertyRef} — ` : ''}"${propertyTitle}"` : '';
  const text = `Bonjour ${clientName || ''}, nous confirmons votre rendez-vous${bienLine} le ${formatDateFr(date)} à ${time || ''}. — ${agencyName || ''}`;
  return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
}
