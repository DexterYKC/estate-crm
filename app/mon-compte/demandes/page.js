'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { MessageSquare, Mail, Phone, MessageCircle, Building2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const STATUS_LABELS = { new: 'Nouvelle', in_progress: 'En cours', closed: 'Clôturée' };
const PREF_ICONS = { email: Mail, whatsapp: MessageCircle, call: Phone, visit: Building2 };
const PREF_LABELS = { email: 'Email', whatsapp: 'WhatsApp', call: 'Appel', visit: 'Visite agence' };

export default function MyRequests() {
  const { data, isLoading } = useSWR('/api/user/requests', fetcher);
  const [expanded, setExpanded] = useState(null);

  if (isLoading) return <Loading />;
  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
        <h2 className="font-display text-2xl text-navy">Aucune demande pour l'instant</h2>
        <p className="mt-2 text-muted-foreground">Vos demandes de contact apparaîtront ici.</p>
        <Link href="/proprietes"><Button className="mt-6 bg-navy hover:bg-navy/90 text-white">Voir les propriétés</Button></Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl text-navy">Mes demandes</h2>
        <span className="text-sm text-muted-foreground">{data.length} au total</span>
      </div>
      {data.map(r => {
        const PrefIcon = PREF_ICONS[r.contact_preference] || Mail;
        const isOpen = expanded === r.id;
        return (
          <div key={r.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full text-left p-5 flex items-center gap-4">
              {r.property_image ? <img src={r.property_image} className="h-14 w-20 object-cover rounded" alt="" /> : <div className="h-14 w-20 bg-secondary rounded" />}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-navy truncate">{r.property_ref && <span className="font-mono text-gold mr-1.5">{r.property_ref}</span>}{r.property_title || 'Contact général'}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Envoyée le {new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground"><PrefIcon className="h-3.5 w-3.5 text-gold" /> {PREF_LABELS[r.contact_preference]}</span>
              <span className={`px-2.5 py-1 text-[10px] uppercase tracking-widest font-semibold rounded ${r.status === 'new' ? 'bg-amber-100 text-amber-700' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>{STATUS_LABELS[r.status]}</span>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-border pt-5 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Votre message</div>
                  <div className="text-sm text-navy/80 whitespace-pre-line rounded-lg bg-secondary/50 p-4">{r.message || <span className="italic text-muted-foreground">Aucun message</span>}</div>
                </div>
                {r.property_id && <Link href={`/proprietes/${r.property_id}`} target="_blank" className="inline-flex items-center text-sm text-gold hover:underline">Voir le bien →</Link>}
                {r.status === 'closed' && (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3"><CheckCircle2 className="h-4 w-4" /> Cette demande a été traitée par notre équipe.</div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
