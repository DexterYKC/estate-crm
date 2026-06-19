'use client';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { MapPin, Maximize, BedDouble, Eye, Heart } from 'lucide-react';
import { useCurrency } from '@/components/Providers';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

const typeLabels = { appartement: 'Appartement', maison: 'Maison', terrain: 'Terrain', commercial: 'Commercial' };
const fetcher = (u) => fetch(u).then(r => r.json());

export default function PropertyCard({ p }) {
  const { format } = useCurrency();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const { data: favIds } = useSWR(role === 'user' ? '/api/user/favorites-ids' : null, fetcher);
  const isFav = favIds?.includes(p.id);

  async function toggleFav(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) {
      toast('Connectez-vous pour sauvegarder ce bien', { action: { label: 'Connexion', onClick: () => window.location.href = '/login' } });
      return;
    }
    if (isFav) {
      await fetch(`/api/user/favorites/${p.id}`, { method: 'DELETE' });
      toast.success('Retiré des favoris');
    } else {
      await fetch(`/api/user/favorites/${p.id}`, { method: 'POST' });
      toast.success('Ajouté aux favoris');
    }
    mutate('/api/user/favorites-ids');
    mutate('/api/user/favorites');
    mutate('/api/user/stats');
  }

  return (
    <Link href={`/proprietes/${p.id}`} className="group block hover-lift">
      <div className="bg-card rounded-xl overflow-hidden border border-border relative">
        {role === 'user' && (
          <button onClick={toggleFav} className={`absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white/95 shadow flex items-center justify-center transition ${isFav ? 'text-rose-500' : 'text-navy/40 hover:text-rose-500'}`} title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}>
            <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-500' : ''}`} />
          </button>
        )}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {p.main_image ? (
            <img src={p.main_image} alt={p.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
            <div className="h-full w-full bg-secondary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-white/90 text-navy rounded">{typeLabels[p.type] || p.type}</span>
            <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-navy text-white rounded">{p.transaction === 'location' ? 'Location' : 'Vente'}</span>
          </div>
          {p.featured === 1 && role !== 'user' && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-gold text-navy rounded">Sélection</span>
          )}
          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div className="text-white">
              <div className="font-display text-lg leading-tight drop-shadow">{format(p.price, p.transaction)}</div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <h3 className="font-display text-lg text-navy line-clamp-1 group-hover:text-gold transition-colors">{p.title}</h3>
          <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> {p.city}{p.district ? ` · ${p.district}` : ''}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            {p.surface ? <span className="flex items-center gap-1"><Maximize className="h-3.5 w-3.5" /> {p.surface} m²</span> : null}
            {p.rooms ? <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> {p.rooms} pièces</span> : null}
            <span className="flex items-center gap-1 ml-auto"><Eye className="h-3.5 w-3.5" /> {p.views}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
