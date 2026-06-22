'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function ManualInvoiceDialog({ apiBase, clientsApiBase, agentsApiBase, listKey }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ description: '', amount: '', type: 'autre', client_id: '', agent_id: '', issued_at: todayISO() });
  const { data: clients } = useSWR(open ? clientsApiBase : null, fetcher);
  const { data: agents } = useSWR(open && agentsApiBase ? agentsApiBase : null, fetcher);

  async function submit() {
    setLoading(true);
    try {
      const r = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, amount: parseInt(form.amount), client_id: form.client_id || null, agent_id: form.agent_id || null }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      toast.success(`Entrée ${d.number} ajoutée`);
      setOpen(false);
      setForm({ description: '', amount: '', type: 'autre', client_id: '', agent_id: '', issued_at: todayISO() });
      mutate(listKey);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> Ajouter une entrée manuelle</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-navy">Nouvelle entrée comptable</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Description *</Label><Textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ex : commission perçue hors plateforme…" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Montant *</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="vente">Vente</SelectItem><SelectItem value="location">Location</SelectItem><SelectItem value="autre">Autre</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Client (optionnel)</Label>
              <Select value={form.client_id || 'none'} onValueChange={v => setForm({ ...form, client_id: v === 'none' ? '' : v })}>
                <SelectTrigger><SelectValue placeholder="— Aucun —" /></SelectTrigger>
                <SelectContent><SelectItem value="none">— Aucun —</SelectItem>{(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            {agentsApiBase && (
              <div>
                <Label>Agent (optionnel)</Label>
                <Select value={form.agent_id || 'none'} onValueChange={v => setForm({ ...form, agent_id: v === 'none' ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="— Aucun —" /></SelectTrigger>
                  <SelectContent><SelectItem value="none">— Aucun —</SelectItem>{(agents || []).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
            <div><Label>Date</Label><Input type="date" value={form.issued_at} onChange={e => setForm({ ...form, issued_at: e.target.value })} /></div>
            <Button onClick={submit} disabled={loading || !form.description || !form.amount} className="w-full bg-navy hover:bg-navy/90 text-white">{loading ? 'Ajout…' : 'Ajouter'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
