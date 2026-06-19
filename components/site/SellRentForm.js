'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send } from 'lucide-react';

export default function SellRentForm() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', submission_type: 'vente', type: 'appartement', city: '', surface: '', message: '', source: '',
  });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const message = `Type de bien : ${form.type}\nVille : ${form.city}\nSurface approximative : ${form.surface || 'non précisée'} m²\n\n${form.message}`;
      const res = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone, message, contact_preference: 'call', submission_type: form.submission_type, source: form.source || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success('Votre demande a été envoyée. Un conseiller vous recontactera pour l\'estimation.');
      setForm({ name: '', email: '', phone: '', submission_type: 'vente', type: 'appartement', city: '', surface: '', message: '', source: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h3 className="font-display text-xl text-navy">Estimez votre bien</h3>
      <p className="text-sm text-muted-foreground mt-1">Un conseiller vous recontacte pour étudier votre projet, sans engagement.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label>Je souhaite</Label>
          <Select value={form.submission_type} onValueChange={v => setForm({ ...form, submission_type: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="vente">Vendre mon bien</SelectItem>
              <SelectItem value="location">Mettre mon bien en location</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Type de bien</Label>
            <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="appartement">Appartement</SelectItem>
                <SelectItem value="maison">Maison</SelectItem>
                <SelectItem value="terrain">Terrain</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Ville</Label><Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="Tunis, Paris…" /></div>
        </div>
        <div><Label>Surface approximative (m²)</Label><Input type="number" value={form.surface} onChange={e => setForm({ ...form, surface: e.target.value })} /></div>
        <div>
          <Label>Nom complet *</Label>
          <Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Téléphone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+216… ou +33…" /></div>
        </div>
        <div>
          <Label>Message</Label>
          <Textarea rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Décrivez votre bien, vos attentes…" />
        </div>
        <div>
          <Label>Comment nous avez-vous connu ? (optionnel)</Label>
          <Select value={form.source || 'none'} onValueChange={v => setForm({ ...form, source: v === 'none' ? '' : v })}>
            <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Préférez ne pas dire —</SelectItem>
              <SelectItem value="site_web">Site web</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="recommandation">Recommandation</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy/90 text-white h-11">
          <Send className="h-4 w-4 mr-2" /> {loading ? 'Envoi…' : 'Envoyer ma demande'}
        </Button>
      </form>
    </div>
  );
}
