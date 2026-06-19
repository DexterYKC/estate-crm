'use client';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { BellPlus, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/components/Providers';
import { toast } from 'sonner';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const typeLabels = { appartement: 'Appartement', maison: 'Maison', terrain: 'Terrain', commercial: 'Commercial' };

export default function SearchAlertsPage() {
  const { data, isLoading } = useSWR('/api/user/search-alerts', fetcher);
  const { format } = useCurrency();

  async function remove(id) {
    await fetch(`/api/user/search-alerts/${id}`, { method: 'DELETE' });
    mutate('/api/user/search-alerts');
    toast.success('Recherche supprimée');
  }

  function searchHref(a) {
    const sp = new URLSearchParams();
    if (a.city) sp.set('city', a.city);
    if (a.type) sp.set('type', a.type);
    if (a.transaction) sp.set('transaction', a.transaction);
    if (a.max_price) sp.set('maxPrice', a.max_price);
    return `/proprietes?${sp.toString()}`;
  }

  if (isLoading) return <Loading />;

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <BellPlus className="h-12 w-12 mx-auto text-gold/50 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucune recherche enregistrée</h2>
        <p className="mt-2 text-muted-foreground">Depuis la page Propriétés, appliquez des filtres puis cliquez sur "Enregistrer cette recherche" pour être averti des biens correspondants.</p>
        <Link href="/proprietes"><Button className="mt-6 bg-navy hover:bg-navy/90 text-white">Découvrir les propriétés</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes recherches enregistrées</h2>
        <span className="text-sm text-muted-foreground">{data.length} recherche{data.length > 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {data.map(a => (
          <div key={a.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="font-medium text-navy">{a.name || 'Ma recherche'}</div>
              <button onClick={() => remove(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              {a.city && <span className="px-2 py-0.5 rounded bg-secondary">{a.city}</span>}
              {a.type && <span className="px-2 py-0.5 rounded bg-secondary">{typeLabels[a.type] || a.type}</span>}
              {a.transaction && <span className="px-2 py-0.5 rounded bg-secondary">{a.transaction}</span>}
              {a.max_price && <span className="px-2 py-0.5 rounded bg-secondary">≤ {format(a.max_price)}</span>}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className={`text-sm font-medium ${a.match_count > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`}>{a.match_count} bien{a.match_count > 1 ? 's' : ''} correspondant{a.match_count > 1 ? 's' : ''}</span>
              <Link href={searchHref(a)}><Button size="sm" variant="outline"><Search className="h-3.5 w-3.5 mr-1.5" /> Voir</Button></Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
