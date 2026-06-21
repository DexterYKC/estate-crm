'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Check, X, Pause, Trash2, Search, Contact } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AdminUsers() {
  const { data } = useSWR('/api/admin/users', fetcher);
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const list = (data || []).filter(u => {
    if (q && !(u.name?.toLowerCase().includes(q.toLowerCase()) || u.email?.toLowerCase().includes(q.toLowerCase()) || u.phone?.includes(q))) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    return true;
  });
  async function update(id, status) {
    await fetch(`/api/admin/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    mutate('/api/admin/users');
    toast.success('Statut mis à jour');
  }
  async function remove(id) {
    if (!confirm('Supprimer ce compte ?')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    mutate('/api/admin/users');
  }
  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Clients</div>
          <h1 className="font-display text-3xl text-navy mt-1">Utilisateurs inscrits</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-56" /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="accepted">Accepté</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-secondary/60"><tr className="text-left text-navy">
            <th className="px-4 py-3 font-semibold">Nom</th><th className="px-4 py-3 font-semibold">Email</th><th className="px-4 py-3 font-semibold">Téléphone</th><th className="px-4 py-3 font-semibold">Statut</th><th className="px-4 py-3 font-semibold">Inscrit le</th><th className="px-4 py-3 font-semibold text-right">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {list.map(u => (
              <tr key={u.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-navy">{u.name}</td>
                <td className="px-4 py-3 text-navy/80">{u.email}</td>
                <td className="px-4 py-3 text-navy/80">{u.phone || '—'}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded ${u.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{u.status === 'accepted' ? 'Accepté' : u.status === 'pending' ? 'En attente' : 'Suspendu'}</span></td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(u.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {u.client_id && <Link href={`/admin/clients/${u.client_id}`}><Button size="sm" variant="outline" title="Voir la fiche client"><Contact className="h-3.5 w-3.5 mr-1" /> Fiche client</Button></Link>}
                    {u.status !== 'accepted' && <Button size="sm" variant="outline" onClick={() => update(u.id, 'accepted')}><Check className="h-3.5 w-3.5 mr-1" /> Accepter</Button>}
                    {u.status === 'accepted' && <Button size="sm" variant="outline" onClick={() => update(u.id, 'suspended')}><Pause className="h-3.5 w-3.5 mr-1" /> Suspendre</Button>}
                    {u.status === 'suspended' && <Button size="sm" variant="outline" onClick={() => update(u.id, 'accepted')}>Réactiver</Button>}
                    <Button size="sm" variant="ghost" onClick={() => remove(u.id)} className="text-red-500"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Aucun utilisateur ne correspond.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
