'use client';
import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AdminSettings() {
  const { data: session } = useSession();
  const isSuperAdmin = !!session?.user?.isSuperAdmin;
  const { data } = useSWR('/api/admin/settings', fetcher);
  const [f, setF] = useState(null);
  useEffect(() => { if (data) setF(data); }, [data]);
  if (!f) return <Loading className="p-10" />;
  async function save() {
    const r = await fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) });
    if (r.ok) { toast.success('Paramètres enregistrés'); mutate('/api/admin/settings'); }
  }
  return (
    <div className="p-8 lg:p-10 max-w-3xl">
      <div className="mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Configuration</div>
        <h1 className="font-display text-3xl text-navy mt-1">Paramètres de l'agence</h1>
      </div>
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>Nom de l'agence</Label><Input value={f.name || ''} onChange={e => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email || ''} onChange={e => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Téléphone</Label><Input value={f.phone || ''} onChange={e => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={f.whatsapp || ''} onChange={e => setF({ ...f, whatsapp: e.target.value })} placeholder="+216… ou +33…" /></div>
          <div className="md:col-span-2"><Label>Adresse</Label><Input value={f.address || ''} onChange={e => setF({ ...f, address: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>À propos</Label><Textarea rows={4} value={f.about || ''} onChange={e => setF({ ...f, about: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>URL d'intégration Google Maps</Label><Input value={f.maps_embed || ''} onChange={e => setF({ ...f, maps_embed: e.target.value })} /></div>
        </div>
        <div className="flex justify-end"><Button onClick={save} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
      </div>

      {isSuperAdmin && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 mt-6">
          <h2 className="font-display text-lg text-navy">Devise</h2>
          <div className="max-w-sm">
            <Label>Mode d'affichage des prix</Label>
            <Select value={f.currency_mode || 'BOTH'} onValueChange={v => setF({ ...f, currency_mode: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR uniquement</SelectItem>
                <SelectItem value="TND">TND uniquement</SelectItem>
                <SelectItem value="BOTH">EUR + TND (le visiteur choisit)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end"><Button onClick={save} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 mt-6">
          <h2 className="font-display text-lg text-navy">Fonctionnalités</h2>
          <div className="flex items-center gap-3">
            <Switch checked={f.tour_feature_enabled !== false && f.tour_feature_enabled !== 0} onCheckedChange={v => setF({ ...f, tour_feature_enabled: v })} />
            <div>
              <Label className="!mt-0">Activer la fonctionnalité Visite virtuelle 3D</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Désactive la visite 3D partout sur le site (formulaires, badges, fiche bien) — indépendamment des biens déjà configurés.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={f.relances_enabled !== false && f.relances_enabled !== 0} onCheckedChange={v => setF({ ...f, relances_enabled: v })} />
            <div>
              <Label className="!mt-0">Activer les relances automatiques (48h sans réponse)</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Envoie un email de relance au client si sa demande reste "Nouvelle" plus de 48h, une seule fois par demande.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={f.invoices_enabled !== false && f.invoices_enabled !== 0} onCheckedChange={v => setF({ ...f, invoices_enabled: v })} />
            <div>
              <Label className="!mt-0">Activer la génération de factures</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Désactive le bouton "Générer une facture" dans Suivi des affaires, pour tous les agents.</p>
            </div>
          </div>
          <div className="flex justify-end"><Button onClick={save} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
        </div>
      )}

      {isSuperAdmin && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4 mt-6">
          <h2 className="font-display text-lg text-navy">Commission</h2>
          <div className="max-w-sm">
            <Label>Commission agent par défaut (%)</Label>
            <Input type="number" step="0.1" value={f.default_commission_pct ?? 50} onChange={e => setF({ ...f, default_commission_pct: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Part du montant facturé qui revient à l'agent, sauf override individuel (section Agents).</p>
          </div>
          <div className="flex justify-end"><Button onClick={save} className="bg-navy hover:bg-navy/90 text-white"><Save className="h-4 w-4 mr-2" /> Enregistrer</Button></div>
        </div>
      )}
    </div>
  );
}
