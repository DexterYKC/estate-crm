'use client';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { Heart, MapPin, Maximize, BedDouble, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/components/Providers';
import { toast } from 'sonner';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const typeLabels = { appartement: 'Appartement', maison: 'Maison', terrain: 'Terrain', commercial: 'Commercial' };

export default function FavoritesPage() {
  const { data, isLoading } = useSWR('/api/user/favorites', fetcher);
  const { format } = useCurrency();

  async function remove(id) {
    await fetch(`/api/user/favorites/${id}`, { method: 'DELETE' });
    mutate('/api/user/favorites');
    mutate('/api/user/favorites-ids');
    mutate('/api/user/stats');
    toast.success('Retiré des favoris');
  }

  if (isLoading) return <Loading />;

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <Heart className="h-12 w-12 mx-auto text-rose-300 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucun favori pour l'instant</h2>
        <p className="mt-2 text-muted-foreground">Explorez nos biens et cliquez sur le cœur pour les sauvegarder.</p>
        <Link href="/proprietes"><Button className="mt-6 bg-navy hover:bg-navy/90 text-white">Découvrir les propriétés</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes biens favoris</h2>
        <span className="text-sm text-muted-foreground">{data.length} bien{data.length > 1 ? 's' : ''}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover-lift relative">
            <Link href={`/proprietes/${p.id}`} className="block">
              <div className="relative aspect-[4/3]">
                {p.main_image ? <img src={p.main_image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-secondary" />}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-white/90 text-navy rounded">{typeLabels[p.type]}</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-navy text-white rounded">{p.transaction}</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-display text-lg text-navy line-clamp-1">{p.title}</h3>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" /> {p.city}</div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  {p.surface && <span className="flex items-center gap-1"><Maximize className="h-3 w-3" /> {p.surface}m²</span>}
                  {p.rooms ? <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {p.rooms}p</span> : null}
                  <span className="flex items-center gap-1 ml-auto"><Eye className="h-3 w-3" /> {p.views}</span>
                </div>
                <div className="mt-3 font-display text-xl text-navy">{format(p.price, p.transaction)}</div>
              </div>
            </Link>
            <button onClick={() => remove(p.id)} className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/95 shadow flex items-center justify-center text-rose-500 hover:bg-white hover:text-rose-700 transition" title="Retirer des favoris">
              <Heart className="h-4 w-4 fill-rose-500" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
