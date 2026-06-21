'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Plus, Edit3, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AdminAgents() {
  const { data } = useSWR('/api/admin/agents', fetcher);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);

  function openNew() { setEditing({ name: '', email: '', password: '', phone: '', bio: '', photo: '', speciality: '', commission_pct: '' }); setOpen(true); }
  function openEdit(a) { setEditing({ ...a, password: '', commission_pct: a.commission_pct ?? '' }); setOpen(true); }
  async function save() {
    const payload = { ...editing };
    if (!payload.password) delete payload.password;
    const isNew = !editing.id;
    const url = isNew ? '/api/admin/agents' : `/api/admin/agents/${editing.id}`;
    const r = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) return toast.error(d.error);
    toast.success(isNew ? 'Agent créé' : 'Agent mis à jour');
    setOpen(false); setEditing(null); mutate('/api/admin/agents');
  }
  async function remove(id) {
    if (!confirm('Supprimer cet agent ? Les biens associés seront non-assignés.')) return;
    const r = await fetch(`/api/admin/agents/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Supprimé'); mutate('/api/admin/agents'); }
  }
  async function toggleStatus(a) {
    const next = a.status === 'accepted' ? 'suspended' : 'accepted';
    await fetch(`/api/admin/agents/${a.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: next }) });
    mutate('/api/admin/agents');
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Équipe</div>
          <h1 className="font-display text-3xl text-navy mt-1">Agents</h1>
        </div>
        <Button onClick={openNew} className="bg-navy hover:bg-navy/90 text-white"><Plus className="h-4 w-4 mr-1" /> Nouvel agent</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {(data || []).map(a => (
          <div key={a.id} className="bg-card rounded-xl border border-border p-5 hover-lift">
            <div className="flex items-center gap-4">
              {a.photo ? <img src={a.photo} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center font-display text-navy text-xl">{(a.name || '?')[0]}</div>}
              <div className="flex-1 min-w-0">
                <div className="font-display text-lg text-navy truncate">{a.name}</div>
                <div className="text-xs text-muted-foreground truncate">{a.speciality || '—'}</div>
                <span className={`mt-1 inline-block px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded ${a.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{a.status === 'accepted' ? 'Actif' : 'Suspendu'}</span>
              </div>
            </div>
            <div className="mt-4 text-sm text-navy/70 space-y-0.5">
              <div className="truncate">{a.email}</div>
              <div>{a.phone || '—'}</div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span><b className="text-navy">{a.prop_count}</b> biens</span>
                <span><b className="text-navy">{a.req_count}</b> demandes</span>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Edit3 className="h-3.5 w-3.5 mr-1" /> Modifier</Button>
              <Button size="sm" variant="outline" onClick={() => toggleStatus(a)}>{a.status === 'accepted' ? 'Suspendre' : 'Réactiver'}</Button>
              <Button size="sm" variant="ghost" onClick={() => remove(a.id)} className="text-red-500 ml-auto"><Trash2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-display text-navy">{editing?.id ? "Modifier l'agent" : 'Nouvel agent'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nom complet</Label><Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><Label>Email</Label><Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></div>
              <div><Label>{editing.id ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe'}</Label><Input type="password" value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={editing.phone || ''} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></div>
              <div><Label>Spécialité</Label><Input value={editing.speciality || ''} onChange={e => setEditing({ ...editing, speciality: e.target.value })} /></div>
              <div><Label>Commission (%) — laisser vide pour le défaut agence</Label><Input type="number" step="0.1" value={editing.commission_pct} onChange={e => setEditing({ ...editing, commission_pct: e.target.value })} /></div>
              <div><Label>Photo (URL)</Label><Input value={editing.photo || ''} onChange={e => setEditing({ ...editing, photo: e.target.value })} /></div>
              <div><Label>Bio</Label><Textarea rows={3} value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-navy hover:bg-navy/90 text-white">Enregistrer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
