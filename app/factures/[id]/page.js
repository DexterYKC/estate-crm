'use client';
import useSWR from 'swr';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.ok ? r.json() : Promise.reject(r));

export default function FacturePage() {
  const { id } = useParams();
  const { data, error, isLoading } = useSWR(`/api/factures/${id}`, fetcher);

  if (isLoading) return <Loading className="p-10" />;
  if (error || !data) return <div className="p-10 text-center text-muted-foreground">Facture introuvable ou accès refusé.</div>;

  const clientName = data.client?.name || data.request?.name || data.client_name || '—';
  const clientEmail = data.client?.email || data.request?.email || '';
  const clientPhone = data.client?.phone || data.request?.phone || '';

  return (
    <div className="min-h-screen bg-secondary/30 py-10 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-border p-10 print:border-0 print:rounded-none print:max-w-none">
        <div className="flex items-center justify-between mb-8 print:hidden">
          <span className="text-xs uppercase tracking-widest text-muted-foreground">Aperçu de la facture</span>
          <Button onClick={() => window.print()} className="bg-navy hover:bg-navy/90 text-white"><Printer className="h-4 w-4 mr-2" /> Imprimer / Enregistrer en PDF</Button>
        </div>

        <div className="flex items-start justify-between border-b border-border pb-6 mb-6">
          <div>
            <div className="font-display text-2xl text-navy">{data.agency_name || 'Agence immobilière'}</div>
            <div className="text-sm text-muted-foreground mt-1 whitespace-pre-line">{data.agency_address}</div>
            <div className="text-sm text-muted-foreground">{data.agency_phone} {data.agency_phone && data.agency_email ? '·' : ''} {data.agency_email}</div>
          </div>
          <div className="text-right">
            <div className="font-display text-xl text-navy">FACTURE</div>
            <div className="text-sm font-mono text-gold mt-1">{data.number}</div>
            <div className="text-xs text-muted-foreground mt-1">{new Date(data.issued_at).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        <div className="mb-8">
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Facturé à</div>
          <div className="text-navy font-medium">{clientName}</div>
          {clientEmail && <div className="text-sm text-muted-foreground">{clientEmail}</div>}
          {clientPhone && <div className="text-sm text-muted-foreground">{clientPhone}</div>}
        </div>

        <table className="w-full text-sm mb-8">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-widest text-muted-foreground">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-border">
              <td className="py-3 text-navy">
                {data.description ? (
                  data.description
                ) : (
                  <>
                    {data.property?.ref && <span className="font-mono text-gold mr-1.5">{data.property.ref}</span>}
                    {data.type === 'vente' ? 'Vente' : data.type === 'location' ? 'Location' : 'Prestation'} — {data.property?.title || 'Bien immobilier'}
                  </>
                )}
                {data.property?.address && <div className="text-xs text-muted-foreground mt-0.5">{data.property.address}, {data.property.city}</div>}
              </td>
              <td className="py-3 text-navy text-right whitespace-nowrap">{new Intl.NumberFormat('fr-FR').format(data.amount || 0)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td className="py-3 text-right font-semibold text-navy">Total</td>
              <td className="py-3 text-right font-display text-lg text-navy whitespace-nowrap">{new Intl.NumberFormat('fr-FR').format(data.amount || 0)}</td>
            </tr>
          </tfoot>
        </table>

        <p className="text-xs text-muted-foreground border-t border-border pt-4">Document généré automatiquement à titre de reçu — à valider avec votre comptable pour toute mention fiscale obligatoire (TVA, matricule fiscal, timbre).</p>
      </div>
    </div>
  );
}
