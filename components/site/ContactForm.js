'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, MessageCircle, Mail, Phone, Building2 } from 'lucide-react';

export default function ContactForm({ propertyId = null, propertyTitle = null, whatsapp = null }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: propertyTitle ? `Bonjour, je suis intéressé(e) par le bien "${propertyTitle}". Pouvez-vous me recontacter ?` : '', contact_preference: 'email', source: '' });

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, property_id: propertyId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      toast.success('Votre demande a été envoyée. Notre équipe vous recontactera très rapidement.');
      setForm({ name: '', email: '', phone: '', message: '', contact_preference: 'email', source: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const waLink = whatsapp ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(propertyTitle ? `Bonjour, je suis intéressé(e) par : ${propertyTitle}` : 'Bonjour, j\'aimerais des informations.')}` : null;

  return (
    <div className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h3 className="font-display text-xl text-navy">Contactez-nous</h3>
      <p className="text-sm text-muted-foreground mt-1">Réponse sous 24h ouvrées par notre équipe.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Nom complet *</Label>
          <Input id="name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Jean Dupont" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jean@exemple.fr" />
          </div>
          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+33 6 12 34 56 78" />
          </div>
        </div>
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Votre message..." />
        </div>
        <div>
          <Label>Méthode de contact préférée</Label>
          <RadioGroup value={form.contact_preference} onValueChange={v => setForm({ ...form, contact_preference: v })} className="mt-2 grid grid-cols-2 gap-2">
            {[
              { v: 'email', l: 'Email', i: Mail },
              { v: 'whatsapp', l: 'WhatsApp', i: MessageCircle },
              { v: 'call', l: 'Appel', i: Phone },
              { v: 'visit', l: 'Visite agence', i: Building2 },
            ].map(opt => (
              <label key={opt.v} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${form.contact_preference === opt.v ? 'border-gold bg-gold/10 text-navy' : 'border-border hover:border-gold/50'}`}>
                <RadioGroupItem value={opt.v} className="sr-only" />
                <opt.i className="h-4 w-4" /> {opt.l}
              </label>
            ))}
          </RadioGroup>
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
        {waLink && (
          <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-11 rounded-md bg-[#25D366] hover:bg-[#1ebd5b] text-white font-medium transition">
            <MessageCircle className="h-4 w-4" /> Contacter via WhatsApp
          </a>
        )}
      </form>
    </div>
  );
}
