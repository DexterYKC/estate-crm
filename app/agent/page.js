'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Home, MessageSquare, CalendarDays, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Loading from '@/components/ui/loading';
import RemindersWidget from '@/components/admin/RemindersWidget';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AgentHome() {
  const { data } = useSWR('/api/agent/stats', fetcher);
  if (!data) return <Loading className="p-10" />;

  const tiles = [
    { label: 'Mes biens', value: data.propsCount, icon: Home, color: 'bg-blue-500/10 text-blue-600' },
    { label: 'Demandes nouvelles', value: data.reqNew, sub: `${data.reqAll} au total`, icon: MessageSquare, color: 'bg-amber-500/10 text-amber-600' },
    { label: 'Rendez-vous à venir', value: data.apptUpcoming, icon: CalendarDays, color: 'bg-purple-500/10 text-purple-600' },
    { label: 'Vues totales', value: data.totalViews, icon: Eye, color: 'bg-emerald-500/10 text-emerald-600' },
  ];

  return (
    <div className="p-8 lg:p-10 space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Espace agent</div>
        <h1 className="font-display text-3xl md:text-4xl text-navy mt-1">Bonjour, bienvenue 👋</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {tiles.map((t, i) => (
          <Card key={i} className="p-6 hover-lift border-border">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</div>
                <div className="mt-2 font-display text-3xl text-navy">{t.value}</div>
                {t.sub && <div className="mt-1 text-xs text-muted-foreground">{t.sub}</div>}
              </div>
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${t.color}`}><t.icon className="h-5 w-5" /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl text-navy">Dernières demandes</h2>
            <Link href="/agent/demandes" className="text-sm text-gold hover:underline">Voir tout</Link>
          </div>
          <div className="divide-y divide-border">
            {data.recentReqs.length === 0 && <div className="py-8 text-center text-muted-foreground text-sm">Aucune demande pour le moment.</div>}
            {data.recentReqs.map(r => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-navy truncate">{r.name} <span className="text-muted-foreground font-normal">· {r.email || r.phone}</span></div>
                  <div className="text-xs text-muted-foreground truncate">{r.property_title || 'Contact général'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-semibold ${r.status === 'new' ? 'bg-amber-100 text-amber-700' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.status === 'new' ? 'Nouvelle' : r.status === 'in_progress' ? 'En cours' : 'Clôturée'}</span>
              </div>
            ))}
          </div>
        </Card>
        <RemindersWidget apiBase="/api/agent/reminders" listKey="/api/agent/reminders" />
      </div>
    </div>
  );
}
