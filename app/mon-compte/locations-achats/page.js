'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Receipt, MapPin, FileText } from 'lucide-react';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function MyDeals() {
  const { data, isLoading } = useSWR('/api/user/my-deals', fetcher);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <Receipt className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucun achat ou location pour l'instant</h2>
        <p className="mt-2 text-muted-foreground">Vos achats et locations conclus via l'agence apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes locations / achats</h2>
        <span className="text-sm text-muted-foreground">{data.length} au total</span>
      </div>
      {data.map(d => (
        <div key={d.id} className="bg-card rounded-xl border border-border p-5 flex flex-wrap items-center gap-4">
          <div className="h-11 w-11 rounded-lg bg-gold/15 flex items-center justify-center text-gold shrink-0"><Receipt className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-navy truncate">{d.property_ref && <span className="font-mono text-gold mr-1.5">{d.property_ref}</span>}{d.property_title || 'Bien'}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {d.deal_date ? new Date(d.deal_date).toLocaleDateString('fr-FR') : '—'}{d.deal_end_date ? ` → ${new Date(d.deal_end_date).toLocaleDateString('fr-FR')}` : ''}</div>
          </div>
          <span className="px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-emerald-100 text-emerald-700">{d.property_transaction === 'location' ? 'Location' : 'Achat'}</span>
          {d.invoice_id && <Link href={`/factures/${d.invoice_id}`} target="_blank" className="flex items-center gap-1.5 text-sm text-gold hover:underline"><FileText className="h-3.5 w-3.5" /> Facture</Link>}
        </div>
      ))}
    </div>
  );
}
