'use client';
import { useState } from 'react';
import Link from 'next/link';
import { mutate } from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Mail, Phone, MessageCircle, Building2, ChevronDown, ExternalLink,
  CheckCircle2, XCircle, RotateCcw, User, Eye, FileText, BellRing, Trash2, Bell,
} from 'lucide-react';
import { useAgencySettings } from '@/lib/use-agency-settings';
import AppointmentDialog from '@/components/admin/AppointmentDialog';

const PREF_ICONS = { email: Mail, whatsapp: MessageCircle, call: Phone, visit: Building2 };
const STATUS_LABELS = { new: 'Nouvelle', in_progress: 'En cours', closed: 'Clôturée' };
export const SOURCE_LABELS = { site_web: 'Site web', facebook: 'Facebook', google: 'Google', recommandation: 'Recommandation', autre: 'Autre' };
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function RequestCard({
  request: r, apiBase, propsApiBase, invoicesApiBase, apptApiBase, remindersApiBase, clientsBasePath,
  listKey, agents = null, onDelete,
}) {
  const { invoicesEnabled } = useAgencySettings();
  const [open, setOpen] = useState(false);
  const [creatingInvoice, setCreatingInvoice] = useState(false);
  const [refusing, setRefusing] = useState(false);
  const [addingReminder, setAddingReminder] = useState(false);
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState(todayISO());
  const [reason, setReason] = useState(r.refusal_reason || '');
  const [deal, setDeal] = useState({
    deal_date: r.deal_date || todayISO(),
    deal_end_date: r.deal_end_date || '',
    deal_price: r.deal_price ?? r.property_price ?? '',
  });
  const PrefIcon = PREF_ICONS[r.contact_preference] || Mail;

  async function patch(payload) {
    await fetch(`${apiBase}/${r.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    mutate(listKey);
  }

  async function patchProperty(status) {
    if (!r.property_id) return;
    await fetch(`${propsApiBase}/${r.property_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && !r.viewed_at) patch({ viewed_at: new Date().toISOString() });
  }

  async function accept() {
    await patch({ decision: 'accepted', status: 'closed', deal_date: deal.deal_date || todayISO() });
    if (r.property_transaction === 'vente') await patchProperty('vendu');
    else if (r.property_transaction === 'location') await patchProperty('loué');
    toast.success('Demande acceptée');
  }
  async function confirmRefuse() {
    await patch({ decision: 'refused', status: 'closed', refusal_reason: reason });
    setRefusing(false);
    toast.success('Demande refusée et clôturée');
  }
  async function reset() {
    const wasAccepted = r.decision === 'accepted';
    await patch({ decision: null, refusal_reason: null, deal_date: null, deal_end_date: null, deal_price: null, status: 'new' });
    if (wasAccepted) await patchProperty('active');
    toast.success('Décision réinitialisée');
  }
  async function saveDeal() {
    await patch({ deal_date: deal.deal_date || null, deal_end_date: deal.deal_end_date || null, deal_price: deal.deal_price });
    toast.success('Affaire mise à jour');
  }
  async function generateInvoice() {
    setCreatingInvoice(true);
    try {
      const res = await fetch(invoicesApiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ request_id: r.id }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erreur');
      window.open(`/factures/${d.id}`, '_blank');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreatingInvoice(false);
    }
  }
  async function remove() {
    if (!confirm('Supprimer cette demande ?')) return;
    await onDelete(r.id);
  }
  async function addReminder() {
    if (!reminderText.trim()) return;
    await fetch(remindersApiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: reminderText, due_date: reminderDate, client_id: r.client_id, request_id: r.id }) });
    setReminderText(''); setAddingReminder(false);
    toast.success('Rappel ajouté');
  }

  const decisionBadge = r.decision === 'accepted'
    ? <span className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Acceptée</span>
    : r.decision === 'refused'
    ? <span className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-red-100 text-red-700"><XCircle className="h-3 w-3" /> Refusée</span>
    : <span className={`px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded ${r.status === 'new' ? 'bg-amber-100 text-amber-700' : r.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-secondary text-muted-foreground'}`}>{STATUS_LABELS[r.status] || 'En attente'}</span>;

  return (
    <div className="bg-card rounded-xl border border-border">
      <button onClick={toggle} className="w-full text-left p-5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1 min-w-0">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-navy shrink-0">{(r.name || '?')[0]}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-navy truncate">{r.name}</div>
            <div className="text-xs text-muted-foreground truncate">
              {r.submission_type ? (
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-semibold">Propriétaire · {r.submission_type === 'vente' ? 'Vente' : 'Location'}</span>
              ) : (
                <>{r.property_ref && <span className="font-mono text-gold">{r.property_ref}</span>} {r.property_title || 'Contact général'}</>
              )} · {new Date(r.created_at).toLocaleDateString('fr-FR')}
              {r.agent_name && <> · {r.agent_name}</>}
              {r.source && <> · {SOURCE_LABELS[r.source] || r.source}</>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap ml-auto sm:ml-0">
          <PrefIcon className="h-4 w-4 text-gold" />
          {r.viewed_at && <span title={`Vue le ${new Date(r.viewed_at).toLocaleString('fr-FR')}`} className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-blue-50 text-blue-600"><Eye className="h-3 w-3" /> Vue</span>}
          {r.relance_sent_at && <span title={`Relancé le ${new Date(r.relance_sent_at).toLocaleDateString('fr-FR')}`} className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-purple-100 text-purple-700"><BellRing className="h-3 w-3" /> Relancé</span>}
          {decisionBadge}
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden"
        >
        <div className="px-5 pb-5 border-t border-border pt-5 grid md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-4 text-sm text-navy/80">
              {r.email && <a href={`mailto:${r.email}`} className="flex items-center gap-1 hover:text-gold"><Mail className="h-3.5 w-3.5 text-gold" /> {r.email}</a>}
              {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-1 hover:text-gold"><Phone className="h-3.5 w-3.5 text-gold" /> {r.phone}</a>}
              {r.phone && <a target="_blank" rel="noreferrer" href={`https://wa.me/${r.phone.replace(/[^0-9]/g, '')}`} className="flex items-center gap-1 hover:text-gold"><MessageCircle className="h-3.5 w-3.5 text-emerald-600" /> WhatsApp</a>}
            </div>
            <div className="text-sm text-navy/80 whitespace-pre-line rounded-lg bg-secondary/50 p-4">{r.message || <span className="text-muted-foreground italic">Aucun message</span>}</div>
            {r.property_id && (
              <Link href={`/proprietes/${r.property_id}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
                {r.property_ref && <span className="font-mono">{r.property_ref}</span>} Voir l'annonce <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Notes internes</Label>
              <Textarea defaultValue={r.notes || ''} onBlur={(e) => { if (e.target.value !== (r.notes || '')) patch({ notes: e.target.value }); }} placeholder="Ajouter une note…" rows={2} />
            </div>

            <div className="rounded-lg border border-border p-4 space-y-3">
              {r.decision == null && !refusing && (
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={accept} className="bg-emerald-600 hover:bg-emerald-700 text-white"><CheckCircle2 className="h-4 w-4 mr-1.5" /> Accepter</Button>
                  <Button variant="outline" onClick={() => setRefusing(true)} className="text-red-600 border-red-200 hover:bg-red-50"><XCircle className="h-4 w-4 mr-1.5" /> Refuser</Button>
                </div>
              )}

              {r.decision == null && refusing && (
                <div className="space-y-2">
                  <Label>Motif du refus</Label>
                  <Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Ex : budget insuffisant, bien déjà loué…" />
                  <div className="flex gap-2">
                    <Button onClick={confirmRefuse} disabled={!reason.trim()} className="bg-red-600 hover:bg-red-700 text-white">Confirmer le refus</Button>
                    <Button variant="ghost" onClick={() => setRefusing(false)}>Annuler</Button>
                  </div>
                </div>
              )}

              {r.decision === 'refused' && (
                <div className="space-y-2">
                  <div className="text-sm text-navy/80"><span className="font-semibold">Motif :</span> {r.refusal_reason || <span className="italic text-muted-foreground">Non précisé</span>}</div>
                  <Button variant="ghost" onClick={reset} className="text-muted-foreground"><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser</Button>
                </div>
              )}

              {r.decision === 'accepted' && (
                <div className="space-y-3">
                  {r.property_transaction === 'vente' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Date de vente</Label><Input type="date" value={deal.deal_date} onChange={e => setDeal({ ...deal, deal_date: e.target.value })} /></div>
                      <div><Label>Prix conclu</Label><Input type="number" value={deal.deal_price} onChange={e => setDeal({ ...deal, deal_price: e.target.value })} /></div>
                    </div>
                  ) : r.property_transaction === 'location' ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Début location</Label><Input type="date" value={deal.deal_date} onChange={e => setDeal({ ...deal, deal_date: e.target.value })} /></div>
                      <div><Label>Fin location</Label><Input type="date" value={deal.deal_end_date} onChange={e => setDeal({ ...deal, deal_end_date: e.target.value })} /></div>
                    </div>
                  ) : (
                    <div><Label>Date de conclusion</Label><Input type="date" value={deal.deal_date} onChange={e => setDeal({ ...deal, deal_date: e.target.value })} /></div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button onClick={saveDeal} className="bg-navy hover:bg-navy/90 text-white">Enregistrer</Button>
                    {r.client_id && clientsBasePath && <Link href={`${clientsBasePath}/${r.client_id}`} target="_blank"><Button variant="outline"><User className="h-4 w-4 mr-1.5" /> Voir la fiche client</Button></Link>}
                    {invoicesApiBase && invoicesEnabled && <Button variant="outline" onClick={generateInvoice} disabled={creatingInvoice}><FileText className="h-4 w-4 mr-1.5" /> {creatingInvoice ? 'Génération…' : 'Générer une facture'}</Button>}
                    <Button variant="ghost" onClick={reset} className="text-muted-foreground ml-auto"><RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Réinitialiser</Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Statut</Label>
              <Select value={r.status} onValueChange={(v) => patch({ status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="new">Nouvelle</SelectItem><SelectItem value="in_progress">En cours</SelectItem><SelectItem value="closed">Clôturée</SelectItem></SelectContent></Select>
            </div>
            {agents && (
              <div>
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Agent assigné</Label>
                <Select value={r.agent_id || 'none'} onValueChange={(v) => patch({ agent_id: v === 'none' ? null : v })}><SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger><SelectContent><SelectItem value="none">— Aucun —</SelectItem>{agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select>
              </div>
            )}
            {apptApiBase && <AppointmentDialog request={r} apiBase={apptApiBase} agents={agents} />}
            {remindersApiBase && !addingReminder && <Button variant="outline" className="w-full" onClick={() => setAddingReminder(true)}><Bell className="h-4 w-4 mr-1.5" /> Me rappeler</Button>}
            {remindersApiBase && addingReminder && (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <Textarea rows={2} value={reminderText} onChange={e => setReminderText(e.target.value)} placeholder="Ex : rappeler pour confirmer la visite" />
                <Input type="date" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={addReminder} className="bg-navy hover:bg-navy/90 text-white">Ajouter</Button>
                  <Button size="sm" variant="ghost" onClick={() => setAddingReminder(false)}>Annuler</Button>
                </div>
              </div>
            )}
            {onDelete && <Button variant="ghost" onClick={remove} className="text-red-500 hover:text-red-700 w-full"><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button>}
          </div>
        </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
