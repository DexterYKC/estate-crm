'use client';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function MyProfile() {
  const { data } = useSWR('/api/user/me', fetcher);
  const [f, setF] = useState(null);
  const [pwd, setPwd] = useState({ current: '', new: '', confirm: '' });
  useEffect(() => { if (data) setF({ name: data.name || '', phone: data.phone || '' }); }, [data]);
  if (!f) return <Loading />;

  async function saveInfo() {
    const r = await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name, phone: f.phone }) });
    if (r.ok) { toast.success('Profil mis à jour'); mutate('/api/user/me'); }
  }
  async function changePassword() {
    if (pwd.new.length < 6) return toast.error('6 caractères minimum');
    if (pwd.new !== pwd.confirm) return toast.error('Les mots de passe ne correspondent pas');
    const r = await fetch('/api/user/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd.new }) });
    if (r.ok) { toast.success('Mot de passe modifié'); setPwd({ current: '', new: '', confirm: '' }); }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-16 w-16 rounded-full bg-gold/15 flex items-center justify-center text-gold font-display text-2xl">{(data.name || '?')[0]}</div>
          <div>
            <div className="font-display text-xl text-navy">{data.name}</div>
            <div className="text-sm text-muted-foreground">{data.email}</div>
            <div className="text-xs uppercase tracking-widest text-gold mt-1">Client</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Nom complet</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={data.email} disabled className="opacity-60" /></div>
            <div className="md:col-span-2"><Label>Téléphone</Label><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+33 6 12 34 56 78" /></div>
          </div>
          <div className="flex justify-end"><Button onClick={saveInfo} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-xl text-navy mb-4">Changer mon mot de passe</h3>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Nouveau mot de passe</Label><Input type="password" value={pwd.new} onChange={e => setPwd({ ...pwd, new: e.target.value })} placeholder="6 caractères min." /></div>
            <div><Label>Confirmer</Label><Input type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={changePassword} variant="outline" className="border-navy text-navy hover:bg-navy hover:text-white">Mettre à jour</Button></div>
        </div>
      </Card>
    </div>
  );
}
