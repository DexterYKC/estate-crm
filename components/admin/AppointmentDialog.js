'use client';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { CalendarPlus, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

const todayISO = () => new Date().toISOString().slice(0, 10);

export default function AppointmentDialog({ request, apiBase, agents = null }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState(null);
  const [form, setForm] = useState(null);

  function openDialog() {
    setWhatsappLink(null);
    setForm({
      client_name: request.name || '',
      client_phone: request.phone || '',
      client_email: request.email || '',
      agent_id: request.agent_id || '',
      date: todayISO(),
      time: '10:00',
      notes: '',
    });
    setOpen(true);
  }

  async function save() {
    setLoading(true);
    try {
      const r = await fetch(apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          request_id: request.id,
          property_id: request.property_id,
          user_id: request.user_id,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      toast.success(d.emailSent ? 'Rendez-vous créé, email de confirmation envoyé.' : 'Rendez-vous créé.');
      if (d.whatsappLink) setWhatsappLink(d.whatsappLink);
      else setOpen(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button type="button" variant="outline" onClick={openDialog} className="text-navy border-navy/20 hover:bg-navy hover:text-white"><CalendarPlus className="h-4 w-4 mr-1.5" /> Créer un rendez-vous</Button>
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setWhatsappLink(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-navy">Nouveau rendez-vous</DialogTitle></DialogHeader>
          {form && !whatsappLink && (
            <div className="space-y-3">
              <div><Label>Nom du client</Label><Input value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Téléphone</Label><Input value={form.client_phone} onChange={e => setForm({ ...form, client_phone: e.target.value })} /></div>
                <div><Label>Email</Label><Input value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })} /></div>
              </div>
              {agents && (
                <div>
                  <Label>Agent</Label>
                  <Select value={form.agent_id || 'none'} onValueChange={v => setForm({ ...form, agent_id: v === 'none' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Non assigné —</SelectItem>
                      {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
                <div><Label>Heure</Label><Input type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
              <Button onClick={save} disabled={loading} className="w-full bg-navy hover:bg-navy/90 text-white">{loading ? 'Enregistrement…' : 'Créer le rendez-vous'}</Button>
            </div>
          )}
          {whatsappLink && (
            <div className="space-y-4 text-center py-2">
              <p className="text-sm text-navy/80">Rendez-vous créé. Tu peux aussi confirmer directement par WhatsApp :</p>
              <a href={whatsappLink} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-md bg-[#25D366] hover:bg-[#1ebd5b] text-white font-medium transition">
                <MessageCircle className="h-4 w-4" /> Confirmer par WhatsApp
              </a>
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Fermer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
