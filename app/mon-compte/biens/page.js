'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Home, MapPin } from 'lucide-react';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const STATUS_LABELS = { active: 'Actif', inactive: 'Inactif', vendu: 'Vendu', loué: 'Loué' };
const STATUS_CLASSES = { active: 'bg-emerald-100 text-emerald-700', inactive: 'bg-secondary text-muted-foreground', vendu: 'bg-blue-100 text-blue-700', loué: 'bg-amber-100 text-amber-700' };

export default function MyProperties() {
  const { data, isLoading } = useSWR('/api/user/my-properties', fetcher);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <Home className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucun bien pour l'instant</h2>
        <p className="mt-2 text-muted-foreground">Les biens que vous confiez à l'agence apparaîtront ici une fois leur annonce créée.</p>
        <Link href="/vendre-louer"><span className="mt-6 inline-block text-gold hover:underline">Vendre ou louer un bien →</span></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes biens</h2>
        <span className="text-sm text-muted-foreground">{data.length} au total</span>
      </div>
      {data.map(p => (
        <Link key={p.id} href={`/proprietes/${p.id}`} target="_blank" className="bg-card rounded-xl border border-border overflow-hidden flex items-center gap-4 p-4 hover:border-gold/40 transition">
          {p.main_image ? <img src={p.main_image} className="h-16 w-24 object-cover rounded" alt="" /> : <div className="h-16 w-24 bg-secondary rounded" />}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-navy truncate">{p.ref && <span className="font-mono text-gold mr-1.5">{p.ref}</span>}{p.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}{p.district ? ` · ${p.district}` : ''}</div>
          </div>
          <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold rounded ${STATUS_CLASSES[p.status] || STATUS_CLASSES.active}`}>{STATUS_LABELS[p.status] || p.status}</span>
        </Link>
      ))}
    </div>
  );
}
