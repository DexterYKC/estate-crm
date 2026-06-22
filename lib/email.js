import { Resend } from 'resend';

function formatDateFr(date) {
  if (!date) return '';
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return date;
  }
}

async function sendEmail({ to, subject, text, agencyName }) {
  if (!process.env.RESEND_API_KEY) {
    console.log('\n========== [EMAIL MOCKED — RESEND_API_KEY absente] ==========');
    console.log({ to, subject, text });
    console.log('===============================================================\n');
    return { sent: false, mocked: true };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: `${agencyName || 'Agence'} <onboarding@resend.dev>`,
      to,
      subject,
      text,
    });
    return { sent: true };
  } catch (e) {
    console.error('[Resend] Échec envoi email:', e.message);
    return { sent: false, error: e.message };
  }
}

export async function sendAppointmentConfirmation({ to, clientName, date, time, propertyTitle, propertyRef, agencyName }) {
  const subject = `Confirmation de votre rendez-vous — ${agencyName || 'Agence immobilière'}`;
  const bienLine = propertyTitle ? `concernant le bien ${propertyRef ? `${propertyRef} — ` : ''}"${propertyTitle}"` : '';
  const text = `Bonjour ${clientName || ''},\n\nNous confirmons votre rendez-vous ${bienLine} le ${formatDateFr(date)} à ${time || ''}.\n\nÀ très bientôt,\nL'équipe ${agencyName || ''}`;
  return sendEmail({ to, subject, text, agencyName });
}

export async function sendRelanceEmail({ to, clientName, propertyTitle, propertyRef, agencyName }) {
  const subject = `Toujours intéressé(e) ? — ${agencyName || 'Agence immobilière'}`;
  const bienLine = propertyTitle ? ` pour le bien ${propertyRef ? `${propertyRef} — ` : ''}"${propertyTitle}"` : '';
  const text = `Bonjour ${clientName || ''},\n\nNous revenons vers vous concernant votre demande${bienLine}. Êtes-vous toujours intéressé(e) ? N'hésitez pas à nous recontacter, notre équipe se tient à votre disposition.\n\nCordialement,\nL'équipe ${agencyName || ''}`;
  return sendEmail({ to, subject, text, agencyName });
}
