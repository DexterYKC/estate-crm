'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { CalendarDays, Clock, MapPin } from 'lucide-react';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const STATUS_LABELS = { scheduled: 'Planifié', done: 'Effectué', cancelled: 'Annulé' };
const STATUS_CLASSES = { scheduled: 'bg-blue-100 text-blue-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-700' };

function formatDate(s) {
  if (!s) return 'Date à confirmer';
  const d = new Date(`${s}T00:00:00`);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function MyAppointments() {
  const { data, isLoading } = useSWR('/api/user/appointments', fetcher);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucun rendez-vous pour l'instant</h2>
        <p className="mt-2 text-muted-foreground">Les rendez-vous planifiés par nos équipes apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes rendez-vous</h2>
        <span className="text-sm text-muted-foreground">{data.length} au total</span>
      </div>
      {data.map(a => (
        <div key={a.id} className="bg-card rounded-xl border border-border p-5 flex flex-wrap items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-gold/15 flex items-center justify-center text-gold shrink-0"><CalendarDays className="h-5 w-5" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-navy capitalize">{formatDate(a.date)}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {a.time || '--:--'}</div>
            {a.property_title && (
              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                {a.property_ref && <span className="font-mono text-gold">{a.property_ref}</span>} {a.property_title}
                {a.property_id && <Link href={`/proprietes/${a.property_id}`} target="_blank" className="text-gold hover:underline ml-1">Voir l'annonce →</Link>}
              </div>
            )}
          </div>
          <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold rounded ${STATUS_CLASSES[a.status] || STATUS_CLASSES.scheduled}`}>{STATUS_LABELS[a.status] || 'Planifié'}</span>
        </div>
      ))}
    </div>
  );
}
