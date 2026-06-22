// Netlify Scheduled Function — ping périodique de l'endpoint protégé /api/cron/relances
// de l'app Next.js. Doit rester une fonction Netlify séparée : le plugin Next.js de Netlify
// ne permet pas d'attacher un `schedule` directement à une route Next.js.
export default async () => {
  const base = process.env.URL || process.env.DEPLOY_URL;
  if (!base || !process.env.CRON_SECRET) {
    console.error('[relances-cron] URL ou CRON_SECRET manquant, abandon.');
    return new Response('config manquante', { status: 500 });
  }
  const res = await fetch(`${base}/api/cron/relances`, {
    headers: { 'x-cron-secret': process.env.CRON_SECRET },
  });
  const body = await res.text();
  console.log('[relances-cron]', res.status, body);
  return new Response(body, { status: res.status });
};

export const config = {
  schedule: '0 */6 * * *',
};
