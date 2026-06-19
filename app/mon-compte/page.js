'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Heart, MessageSquare, Clock, ArrowRight, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AccountHome() {
  const { data } = useSWR('/api/user/stats', fetcher);
  const { data: requests } = useSWR('/api/user/requests', fetcher);
  const { data: appointments } = useSWR('/api/user/appointments', fetcher);
  if (!data) return <Loading />;

  const todayISO = new Date().toISOString().slice(0, 10);
  const nextAppointment = (appointments || []).find(a => a.status === 'scheduled' && (!a.date || a.date >= todayISO));

  const tiles = [
    { label: 'Favoris', value: data.favCount, sub: 'biens sauvegardés', icon: Heart, color: 'bg-rose-500/10 text-rose-600', href: '/mon-compte/favoris' },
    { label: 'Mes demandes', value: data.reqCount, sub: 'au total', icon: MessageSquare, color: 'bg-blue-500/10 text-blue-600', href: '/mon-compte/demandes' },
    { label: 'En cours de traitement', value: data.reqOpen, sub: 'demandes ouvertes', icon: Clock, color: 'bg-amber-500/10 text-amber-600', href: '/mon-compte/demandes' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tiles.map((t, i) => (
          <Link key={i} href={t.href}>
            <Card className="p-6 hover-lift cursor-pointer border-border h-full">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{t.label}</div>
                  <div className="mt-2 font-display text-3xl text-navy">{t.value}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{t.sub}</div>
                </div>
                <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${t.color}`}><t.icon className="h-5 w-5" /></div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-navy">Mes dernières demandes</h2>
          <Link href="/mon-compte/demandes" className="text-sm text-gold hover:underline">Tout voir</Link>
        </div>
        <div className="divide-y divide-border">
          {(!requests || requests.length === 0) && <div className="py-8 text-center text-muted-foreground text-sm">Aucune demande pour le moment. <Link href="/proprietes" className="text-gold hover:underline">Explorer le catalogue</Link></div>}
          {(requests || []).slice(0, 5).map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy truncate">{r.property_title || 'Contact général'}</div>
                <div className="text-xs text-muted-foreground truncate">{new Date(r.created_at).toLocaleDateString('fr-FR')} · Préférence : {r.contact_preference}</div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-semibold ${r.status === 'new' ? 'bg-amber-100 text-amber-700' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{r.status === 'new' ? 'Nouvelle' : r.status === 'in_progress' ? 'En cours' : 'Clôturée'}</span>
            </div>
          ))}
        </div>
      </Card>

      {nextAppointment && (
        <Card className="p-6 border-gold/40 bg-gold/5">
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gold/15 flex items-center justify-center text-gold shrink-0"><CalendarDays className="h-5 w-5" /></div>
            <div className="flex-1 min-w-0">
              <div className="text-xs uppercase tracking-widest text-muted-foreground">Prochain rendez-vous</div>
              <div className="font-display text-lg text-navy">
                {nextAppointment.date ? new Date(`${nextAppointment.date}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Date à confirmer'} {nextAppointment.time ? `à ${nextAppointment.time}` : ''}
              </div>
              {nextAppointment.property_title && <div className="text-sm text-muted-foreground">{nextAppointment.property_ref && <span className="font-mono text-gold mr-1">{nextAppointment.property_ref}</span>}{nextAppointment.property_title}</div>}
            </div>
            <Link href="/mon-compte/rendez-vous"><Button variant="outline" className="border-navy/20 text-navy hover:bg-navy hover:text-white">Voir tout</Button></Link>
          </div>
        </Card>
      )}

      <Card className="p-8 bg-navy text-white border-0">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-2xl">Vous cherchez un bien spécifique ?</h3>
            <p className="mt-2 text-white/70 max-w-xl">Notre équipe se tient à votre disposition pour vous accompagner dans votre projet immobilier.</p>
          </div>
          <Link href="/contact"><Button className="bg-gold hover:bg-gold/90 text-navy font-semibold">Contactez-nous <ArrowRight className="h-4 w-4 ml-2" /></Button></Link>
        </div>
      </Card>
    </div>
  );
}
