'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import PropertyImagesField from '@/components/admin/PropertyImagesField';
import { useAgencySettings } from '@/lib/use-agency-settings';
import { useCurrency } from '@/components/Providers';

const fetcher = (u) => fetch(u).then(r => r.json());
const AMENITIES = ['Parking', 'Garage', 'Ascenseur', 'Piscine', 'Jardin', 'Balcon', 'Terrasse', 'Cave', 'Cuisine équipée', 'Climatisation', 'Chauffage', 'Meublé', 'Vue mer', 'Vue dégagée', 'Concierge', 'Sécurité', 'Cheminée', 'Domotique'];

export default function PropertyForm({ initial = null, mode = 'create', apiBase = '/api/admin/properties', showAdminOnly = true }) {
  const router = useRouter();
  const { data: agents } = useSWR('/api/admin/agents-list', fetcher);
  const { data: clients } = useSWR('/api/users-list', fetcher);
  const { tourFeatureEnabled } = useAgencySettings();
  const { symbol } = useCurrency();
  const [f, setF] = useState({
    title: '', description: '', type: 'appartement', transaction: 'vente', price: '', surface: '', rooms: '', floor: '',
    city: '', district: '', address: '', agent_id: '', status: 'active', tour_enabled: false, tour_url: '', featured: false,
    images: [], amenities: [], owner_id: '',
    mandate_type: '', mandate_commission_pct: '', mandate_start: '', mandate_end: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initial) {
      setF({
        title: initial.title || '', description: initial.description || '', type: initial.type, transaction: initial.transaction,
        price: initial.price || '', surface: initial.surface || '', rooms: initial.rooms || '', floor: initial.floor || '',
        city: initial.city || '', district: initial.district || '', address: initial.address || '',
        agent_id: initial.agent_id || '', status: initial.status || 'active',
        tour_enabled: !!initial.tour_enabled, tour_url: initial.tour_url || '',
        featured: !!initial.featured,
        images: (initial.images || []).map(i => i.url),
        amenities: initial.amenities || [],
        owner_id: initial.owner_id || '',
        mandate_type: initial.mandate_type || '',
        mandate_commission_pct: initial.mandate_commission_pct ?? '',
        mandate_start: initial.mandate_start || '',
        mandate_end: initial.mandate_end || '',
      });
    }
  }, [initial]);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    const payload = { ...f, images: f.images.filter(Boolean), agent_id: f.agent_id || null, owner_id: f.owner_id || null };
    try {
      const url = mode === 'create' ? apiBase : `${apiBase}/${initial.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';
      const r = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success(mode === 'create' ? 'Bien créé' : 'Bien mis à jour');
      router.back();
      router.refresh();
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="p-8 lg:p-10 max-w-5xl">
      <Link href="/admin/proprietes" className="text-sm text-muted-foreground hover:text-gold inline-flex items-center gap-1 mb-4"><ArrowLeft className="h-4 w-4" /> Retour</Link>
      <h1 className="font-display text-3xl text-navy">{mode === 'create' ? 'Nouveau bien' : 'Modifier le bien'}</h1>

      <form onSubmit={submit} className="mt-8 space-y-8">
        <Section title="Informations générales">
          <div className="md:col-span-2"><Label>Titre *</Label><Input required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Description</Label><Textarea rows={5} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Type *</Label><Select value={f.type} onValueChange={v => setF({ ...f, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="appartement">Appartement</SelectItem><SelectItem value="maison">Maison</SelectItem><SelectItem value="terrain">Terrain</SelectItem><SelectItem value="commercial">Commercial</SelectItem></SelectContent></Select></div>
          <div><Label>Transaction *</Label><Select value={f.transaction} onValueChange={v => setF({ ...f, transaction: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="vente">Vente</SelectItem><SelectItem value="location">Location</SelectItem></SelectContent></Select></div>
          <div><Label>Prix ({symbol}) *</Label><Input type="number" required value={f.price} onChange={e => setF({ ...f, price: e.target.value })} /></div>
          <div><Label>Surface (m²)</Label><Input type="number" value={f.surface} onChange={e => setF({ ...f, surface: e.target.value })} /></div>
          <div><Label>Pièces</Label><Input type="number" value={f.rooms} onChange={e => setF({ ...f, rooms: e.target.value })} /></div>
          <div><Label>Étage</Label><Input type="number" value={f.floor} onChange={e => setF({ ...f, floor: e.target.value })} /></div>
        </Section>

        <Section title="Localisation">
          <div><Label>Ville</Label><Input value={f.city} onChange={e => setF({ ...f, city: e.target.value })} /></div>
          <div><Label>Quartier</Label><Input value={f.district} onChange={e => setF({ ...f, district: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Adresse</Label><Input value={f.address} onChange={e => setF({ ...f, address: e.target.value })} /></div>
        </Section>

        <Section title="Affectation">
          {showAdminOnly && <div><Label>Agent</Label><Select value={f.agent_id || 'none'} onValueChange={v => setF({ ...f, agent_id: v === 'none' ? '' : v })}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent><SelectItem value="none">— Non assigné —</SelectItem>{(agents || []).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent></Select></div>}
          <div><Label>Statut</Label><Select value={f.status} onValueChange={v => setF({ ...f, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Actif</SelectItem><SelectItem value="inactive">Inactif</SelectItem><SelectItem value="vendu">Vendu</SelectItem><SelectItem value="loué">Loué</SelectItem></SelectContent></Select></div>
          <div><Label>Propriétaire (compte client)</Label><Select value={f.owner_id || 'none'} onValueChange={v => setF({ ...f, owner_id: v === 'none' ? '' : v })}><SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger><SelectContent><SelectItem value="none">— Non lié —</SelectItem>{(clients || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>)}</SelectContent></Select></div>
          {showAdminOnly && <div className="flex items-center gap-3 mt-7"><Switch checked={f.featured} onCheckedChange={v => setF({ ...f, featured: v })} /><Label className="!mt-0">Mettre en avant (Sélection)</Label></div>}
        </Section>

        <Section title="Mandat">
          <div><Label>Type de mandat</Label><Select value={f.mandate_type || 'none'} onValueChange={v => setF({ ...f, mandate_type: v === 'none' ? '' : v })}><SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger><SelectContent><SelectItem value="none">— Aucun —</SelectItem><SelectItem value="exclusif">Exclusif</SelectItem><SelectItem value="simple">Simple</SelectItem></SelectContent></Select></div>
          <div><Label>Commission mandat (%)</Label><Input type="number" step="0.1" value={f.mandate_commission_pct} onChange={e => setF({ ...f, mandate_commission_pct: e.target.value })} /></div>
          <div><Label>Date de début</Label><Input type="date" value={f.mandate_start} onChange={e => setF({ ...f, mandate_start: e.target.value })} /></div>
          <div><Label>Date de fin</Label><Input type="date" value={f.mandate_end} onChange={e => setF({ ...f, mandate_end: e.target.value })} /></div>
        </Section>

        {tourFeatureEnabled && (
          <Section title="Visite virtuelle 3D">
            <div className="flex items-center gap-3 mt-2"><Switch checked={f.tour_enabled} onCheckedChange={v => setF({ ...f, tour_enabled: v })} /><Label className="!mt-0">Activer la visite 3D sur le site</Label></div>
            <div className="md:col-span-2"><Label>URL d'intégration (Matterport / Kuula)</Label><Input value={f.tour_url} onChange={e => setF({ ...f, tour_url: e.target.value })} placeholder="https://my.matterport.com/show/?m=…" /></div>
          </Section>
        )}

        <Section title="Photos" full>
          <div className="md:col-span-2">
            <PropertyImagesField images={f.images} onChange={imgs => setF({ ...f, images: imgs })} />
          </div>
        </Section>

        <Section title="Équipements" full>
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {AMENITIES.map(a => {
              const on = f.amenities.includes(a);
              return <button type="button" key={a} onClick={() => setF({ ...f, amenities: on ? f.amenities.filter(x => x !== a) : [...f.amenities, a] })} className={`px-3 py-2 rounded-lg border text-sm text-left transition ${on ? 'border-gold bg-gold/10 text-navy' : 'border-border hover:border-gold/50'}`}>{a}</button>;
            })}
          </div>
        </Section>

        <div className="flex justify-end gap-3">
          <Link href="/admin/proprietes"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" disabled={loading} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> {loading ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children, full }) {
  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="font-display text-lg text-navy mb-5">{title}</h3>
      <div className={full ? '' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}>{children}</div>
    </div>
  );
}
