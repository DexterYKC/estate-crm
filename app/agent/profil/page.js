'use client';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Save, Camera } from 'lucide-react';
import { toast } from 'sonner';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AgentProfile() {
  const { data } = useSWR('/api/agent/profile', fetcher);
  const [f, setF] = useState(null);
  const [pwd, setPwd] = useState('');
  useEffect(() => { if (data) setF({ name: data.name || '', phone: data.phone || '', bio: data.bio || '', photo: data.photo || '', speciality: data.speciality || '' }); }, [data]);
  if (!f) return <Loading className="p-10" />;

  async function save() {
    const payload = { ...f };
    if (pwd) payload.password = pwd;
    const r = await fetch('/api/agent/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (r.ok) { toast.success('Profil mis à jour'); setPwd(''); mutate('/api/agent/profile'); }
  }

  return (
    <div className="p-8 lg:p-10 max-w-3xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Profil</div>
        <h1 className="font-display text-3xl text-navy mt-1">Mon profil</h1>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-5">
          {f.photo ? <img src={f.photo} alt="" className="h-24 w-24 rounded-full object-cover border-4 border-gold/20" /> : <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center font-display text-navy text-3xl">{(f.name || '?')[0]}</div>}
          <div className="flex-1">
            <Label className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5" /> URL de la photo</Label>
            <Input value={f.photo} onChange={e => setF({ ...f, photo: e.target.value })} placeholder="https://…" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Nom complet</Label><Input value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={data.email} disabled className="opacity-60" /></div>
          <div><Label>Téléphone</Label><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Spécialité</Label><Input value={f.speciality} onChange={e => setF({ ...f, speciality: e.target.value })} placeholder="ex : Appartements de luxe" /></div>
          <div className="md:col-span-2"><Label>Bio</Label><Textarea rows={4} value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} placeholder="Présentez votre parcours et votre expertise…" /></div>
          <div className="md:col-span-2"><Label>Nouveau mot de passe (optionnel)</Label><Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="Laisser vide pour ne pas changer" /></div>
        </div>
        <div className="flex justify-end"><Button onClick={save} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
      </div>
    </div>
  );
}
