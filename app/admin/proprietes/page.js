'use client';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Plus, Edit3, Trash2, Eye, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { toast } from 'sonner';
import { useCurrency } from '@/components/Providers';
import { useAgencySettings } from '@/lib/use-agency-settings';
import { usePropertyFilters } from '@/lib/use-property-filters';
import PropertyFilters from '@/components/admin/PropertyFilters';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const todayISO = () => new Date().toISOString().slice(0, 10);

function mandateInfo(p) {
  if (!p.mandate_type) return null;
  const today = todayISO();
  if (p.mandate_end && p.mandate_end < today) return { label: 'Expiré', className: 'bg-red-100 text-red-700' };
  if (p.mandate_end) {
    const days = Math.ceil((new Date(p.mandate_end) - new Date(today)) / 86400000);
    if (days <= 30) return { label: `Expire dans ${days}j`, className: 'bg-amber-100 text-amber-700' };
  }
  return { label: p.mandate_type === 'exclusif' ? 'Exclusif' : 'Simple', className: 'bg-emerald-100 text-emerald-700' };
}

export default function AdminProperties() {
  const { data, isLoading } = useSWR('/api/admin/properties', fetcher);
  const { list: filteredList, ...filters } = usePropertyFilters(data);
  const [mandateFilter, setMandateFilter] = useState('all');
  const list = filteredList.filter(p => {
    if (mandateFilter === 'all') return true;
    const m = mandateInfo(p);
    if (mandateFilter === 'expiring') return m && m.label.startsWith('Expire dans');
    if (mandateFilter === 'expired') return m && m.label === 'Expiré';
    return true;
  });
  const { format } = useCurrency();
  const { tourFeatureEnabled } = useAgencySettings();
  const colCount = tourFeatureEnabled ? 8 : 7;

  async function toggle(id, field, value) {
    await fetch(`/api/admin/properties/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
    mutate('/api/admin/properties');
    toast.success('Mis à jour');
  }
  async function remove(id) {
    if (!confirm('Supprimer ce bien définitivement ?')) return;
    const r = await fetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Bien supprimé'); mutate('/api/admin/properties'); }
    else toast.error('Erreur lors de la suppression');
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Catalogue</div>
          <h1 className="font-display text-3xl text-navy mt-1">Propriétés</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PropertyFilters {...filters} />
          <Select value={mandateFilter} onValueChange={setMandateFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous mandats</SelectItem>
              <SelectItem value="expiring">Mandat expire bientôt</SelectItem>
              <SelectItem value="expired">Mandat expiré</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/admin/proprietes/nouveau"><Button className="bg-navy hover:bg-navy/90 text-white"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></Link>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-secondary/60 text-navy">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">Bien</th>
              <th className="px-4 py-3 font-semibold">Agent</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Prix</th>
              <th className="px-4 py-3 font-semibold">Mandat</th>
              {tourFeatureEnabled && <th className="px-4 py-3 font-semibold">Visite 3D</th>}
              <th className="px-4 py-3 font-semibold">Statut</th>
              <th className="px-4 py-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={colCount}><Loading /></td></tr>}
            {list.map(p => (
              <tr key={p.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {p.main_image ? <img src={p.main_image} className="h-12 w-16 object-cover rounded" alt="" /> : <div className="h-12 w-16 bg-secondary rounded" />}
                    <div className="min-w-0">
                      <div className="font-medium text-navy truncate max-w-[280px]">{p.title}</div>
                      <div className="text-xs text-muted-foreground">{p.ref && <span className="font-mono text-gold">{p.ref}</span>} · {p.city} · {p.surface}m² · {p.rooms || 0}p</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-navy/80">{p.agent_name || <span className="text-muted-foreground">—</span>}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-secondary rounded">{p.type}</span> <span className="text-xs text-muted-foreground ml-1">{p.transaction}</span></td>
                <td className="px-4 py-3 font-medium text-navy">{format(p.price, p.transaction)}</td>
                <td className="px-4 py-3">
                  {mandateInfo(p) ? (
                    <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded w-fit ${mandateInfo(p).className}`}>
                      {mandateInfo(p).label.startsWith('Expir') && <AlertTriangle className="h-3 w-3" />} {mandateInfo(p).label}
                    </span>
                  ) : <span className="text-muted-foreground text-xs">—</span>}
                </td>
                {tourFeatureEnabled && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Switch checked={!!p.tour_enabled} onCheckedChange={(v) => toggle(p.id, 'tour_enabled', v)} />
                      {p.tour_enabled ? <Sparkles className="h-3.5 w-3.5 text-gold" /> : null}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={p.status === 'active'} onCheckedChange={(v) => toggle(p.id, 'status', v ? 'active' : 'inactive')} />
                    <span className="text-xs text-muted-foreground">{p.status === 'active' ? 'Actif' : p.status === 'vendu' ? 'Vendu' : p.status === 'loué' ? 'Loué' : 'Inactif'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/proprietes/${p.id}`} target="_blank" className="p-2 rounded hover:bg-secondary text-navy/60 hover:text-navy" title="Voir"><Eye className="h-4 w-4" /></Link>
                    <Link href={`/admin/proprietes/${p.id}/modifier`} className="p-2 rounded hover:bg-secondary text-navy/60 hover:text-navy" title="Modifier"><Edit3 className="h-4 w-4" /></Link>
                    <button onClick={() => remove(p.id)} className="p-2 rounded hover:bg-red-50 text-red-500 hover:text-red-700" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && list.length === 0 && <tr><td colSpan={colCount} className="py-10 text-center text-muted-foreground">Aucun bien.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
