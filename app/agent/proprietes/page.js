'use client';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { Plus, Edit3, Trash2, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useCurrency } from '@/components/Providers';
import { useAgencySettings } from '@/lib/use-agency-settings';
import { usePropertyFilters } from '@/lib/use-property-filters';
import PropertyFilters from '@/components/admin/PropertyFilters';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AgentProperties() {
  const { data, isLoading } = useSWR('/api/agent/properties', fetcher);
  const { list, ...filters } = usePropertyFilters(data);
  const { format } = useCurrency();
  const { tourFeatureEnabled } = useAgencySettings();

  async function toggle(id, field, value) {
    await fetch(`/api/agent/properties/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: value }) });
    mutate('/api/agent/properties');
    toast.success('Mis à jour');
  }
  async function remove(id) {
    if (!confirm('Supprimer ce bien définitivement ?')) return;
    const r = await fetch(`/api/agent/properties/${id}`, { method: 'DELETE' });
    if (r.ok) { toast.success('Bien supprimé'); mutate('/api/agent/properties'); }
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Catalogue</div>
          <h1 className="font-display text-3xl text-navy mt-1">Mes propriétés</h1>
        </div>
        <Link href="/agent/proprietes/nouveau"><Button className="bg-navy hover:bg-navy/90 text-white"><Plus className="h-4 w-4 mr-1" /> Ajouter un bien</Button></Link>
      </div>

      <PropertyFilters {...filters} className="mb-6" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading && <div className="col-span-3"><Loading /></div>}
        {list.map(p => (
          <div key={p.id} className="bg-card rounded-xl border border-border overflow-hidden hover-lift">
            <div className="relative aspect-[4/3] bg-secondary">
              {p.main_image ? <img src={p.main_image} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-secondary" />}
              <div className="absolute top-3 left-3 flex gap-2">
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-white/90 text-navy rounded">{p.type}</span>
                <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-navy text-white rounded">{p.transaction}</span>
              </div>
              {tourFeatureEnabled && p.tour_enabled === 1 && <span className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-gold text-navy rounded"><Sparkles className="h-3 w-3" /> 3D</span>}
            </div>
            <div className="p-4">
              {p.ref && <div className="text-[10px] font-mono text-gold mb-0.5">{p.ref}</div>}
              <h3 className="font-display text-lg text-navy line-clamp-1">{p.title}</h3>
              <div className="mt-1 text-xs text-muted-foreground">{p.city} · {p.surface || '?'}m² · {p.rooms || 0}p · <Eye className="h-3 w-3 inline" /> {p.views} vues</div>
              <div className="mt-2 font-display text-xl text-navy">{format(p.price, p.transaction)}</div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={p.status === 'active'} onCheckedChange={(v) => toggle(p.id, 'status', v ? 'active' : 'inactive')} /> {p.status === 'active' ? 'Actif' : p.status === 'vendu' ? 'Vendu' : p.status === 'loué' ? 'Loué' : 'Inactif'}
                </div>
                <div className="ml-auto flex gap-1">
                  <Link href={`/proprietes/${p.id}`} target="_blank" className="p-2 rounded hover:bg-secondary text-navy/60 hover:text-navy" title="Voir"><Eye className="h-4 w-4" /></Link>
                  <Link href={`/agent/proprietes/${p.id}/modifier`} className="p-2 rounded hover:bg-secondary text-navy/60 hover:text-navy" title="Modifier"><Edit3 className="h-4 w-4" /></Link>
                  <button onClick={() => remove(p.id)} className="p-2 rounded hover:bg-red-50 text-red-500" title="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && data && data.length === 0 && (
          <div className="col-span-3 py-16 text-center">
            <div className="text-muted-foreground">Vous n'avez encore aucun bien.</div>
            <Link href="/agent/proprietes/nouveau"><Button className="mt-4 bg-navy hover:bg-navy/90 text-white"><Plus className="h-4 w-4 mr-1" /> Créer mon premier bien</Button></Link>
          </div>
        )}
        {!isLoading && data && data.length > 0 && list.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">Aucun bien ne correspond à ces filtres.</div>
        )}
      </div>
    </div>
  );
}
