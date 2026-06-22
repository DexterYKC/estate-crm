'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Mail, Phone, Building2, CalendarDays, FileText, ExternalLink, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { useAgencySettings } from '@/lib/use-agency-settings';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function ClientDetail({ apiBase, invoicesApiBase, backHref, id }) {
  const { invoicesEnabled } = useAgencySettings();
  const key = `${apiBase}/${id}`;
  const { data, isLoading } = useSWR(key, fetcher);
  const [notes, setNotes] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(null);

  if (isLoading || !data) return <Loading className="p-10" />;

  async function saveNotes() {
    await fetch(key, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes: notes ?? data.notes }) });
    toast.success('Notes enregistrées');
    mutate(key);
  }

  async function generateInvoice(requestId) {
    setCreatingInvoice(requestId);
    try {
      const r = await fetch(invoicesApiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: requestId }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      window.open(`/factures/${d.id}`, '_blank');
      mutate(key);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingInvoice(null);
    }
  }

  const invoicedRequestIds = new Set((data.invoices || []).map(i => i.request_id));

  return (
    <div className="p-8 lg:p-10 max-w-4xl">
      <Link href={backHref} className="text-sm text-muted-foreground hover:text-gold inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Retour</Link>
      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center font-semibold text-navy text-xl shrink-0">{(data.name || '?')[0]}</div>
        <div>
          <h1 className="font-display text-3xl text-navy">{data.name || 'Sans nom'}</h1>
          <div className="text-sm text-muted-foreground flex items-center gap-3 mt-1 flex-wrap">
            {data.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {data.email}</span>}
            {data.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {data.phone}</span>}
          </div>
        </div>
      </div>

      {data.account && (
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-sm text-navy">
            <UserCog className="h-4 w-4 text-gold" /> Compte de connexion :
            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded ${data.account.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : data.account.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
              {data.account.status === 'accepted' ? 'Accepté' : data.account.status === 'pending' ? 'En attente' : 'Suspendu'}
            </span>
          </div>
          <Link href={`/admin/utilisateurs?q=${encodeURIComponent(data.email || data.phone || '')}`} className="text-sm text-gold hover:underline">Gérer le compte →</Link>
        </div>
      )}

      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <Label>Notes internes</Label>
        <Textarea rows={3} defaultValue={data.notes || ''} onChange={e => setNotes(e.target.value)} placeholder="Notes sur ce client…" />
        <div className="flex justify-end mt-2"><Button onClick={saveNotes} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
      </div>

      {data.properties && data.properties.length > 0 && (
        <Section title="Biens possédés" icon={Building2}>
          {data.properties.map(p => (
            <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0 gap-3">
              <span className="text-sm text-navy truncate">{p.ref && <span className="font-mono text-gold mr-1.5">{p.ref}</span>}{p.title}</span>
              <Link href={`/proprietes/${p.id}`} target="_blank" className="text-gold hover:underline text-sm flex items-center gap-1 shrink-0">Voir <ExternalLink className="h-3 w-3" /></Link>
            </div>
          ))}
        </Section>
      )}

      <Section title="Demandes" icon={FileText}>
        {data.requests.length === 0 && <div className="text-sm text-muted-foreground py-4">Aucune demande.</div>}
        {data.requests.map(r => (
          <div key={r.id} className="py-3 border-b border-border last:border-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-sm font-medium text-navy truncate">{r.property_ref ? `${r.property_ref} — ` : ''}{r.property_title || 'Contact général'}</div>
                <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded ${r.decision === 'accepted' ? 'bg-emerald-100 text-emerald-700' : r.decision === 'refused' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.decision === 'accepted' ? 'Acceptée' : r.decision === 'refused' ? 'Refusée' : 'En attente'}</span>
                {r.decision === 'accepted' && !invoicedRequestIds.has(r.id) && invoicesEnabled && (
                  <Button size="sm" variant="outline" disabled={creatingInvoice === r.id} onClick={() => generateInvoice(r.id)}>{creatingInvoice === r.id ? '…' : 'Générer facture'}</Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Rendez-vous" icon={CalendarDays}>
        {(!data.appointments || data.appointments.length === 0) && <div className="text-sm text-muted-foreground py-4">Aucun rendez-vous.</div>}
        {(data.appointments || []).map(a => (
          <div key={a.id} className="py-2 text-sm text-navy/80 border-b border-border last:border-0">{a.date} {a.time} — {a.notes || 'Sans motif précisé'}</div>
        ))}
      </Section>

      <Section title="Factures" icon={FileText}>
        {(!data.invoices || data.invoices.length === 0) && <div className="text-sm text-muted-foreground py-4">Aucune facture émise.</div>}
        {(data.invoices || []).map(inv => (
          <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
            <span className="font-mono text-sm text-navy">{inv.number}</span>
            <Link href={`/factures/${inv.id}`} target="_blank" className="text-gold hover:underline text-sm">Voir →</Link>
          </div>
        ))}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 mb-6">
      <h2 className="font-display text-lg text-navy flex items-center gap-2 mb-3"><Icon className="h-4 w-4 text-gold" /> {title}</h2>
      {children}
    </div>
  );
}
