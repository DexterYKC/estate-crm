'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { SlidersHorizontal, X, BellPlus } from 'lucide-react';
import { useCurrency } from '@/components/Providers';
import { toast } from 'sonner';

export default function FiltersBar({ initial = {} }) {
  const router = useRouter();
  const { toEUR } = useCurrency();
  const { data: session } = useSession();
  const [f, setF] = useState({
    city: initial.city || '',
    type: initial.type || 'all',
    transaction: initial.transaction || 'all',
    minPrice: initial.minPrice || '',
    maxPrice: initial.maxPrice || '',
    minSurface: initial.minSurface || '',
  });

  function apply() {
    const sp = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => {
      if (!v || v === 'all') return;
      const val = (k === 'minPrice' || k === 'maxPrice') ? toEUR(parseInt(v)) : v;
      sp.set(k, val);
    });
    router.push(`/proprietes?${sp.toString()}`);
  }
  function reset() {
    setF({ city: '', type: 'all', transaction: 'all', minPrice: '', maxPrice: '', minSurface: '' });
    router.push('/proprietes');
  }
  async function saveSearch() {
    const name = [f.city, f.type !== 'all' ? f.type : null, f.transaction !== 'all' ? f.transaction : null].filter(Boolean).join(' · ') || 'Ma recherche';
    await fetch('/api/user/search-alerts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        city: f.city || null,
        type: f.type !== 'all' ? f.type : null,
        transaction: f.transaction !== 'all' ? f.transaction : null,
        max_price: f.maxPrice ? toEUR(parseInt(f.maxPrice)) : null,
      }),
    });
    toast.success('Recherche enregistrée — retrouvez-la dans "Mes recherches".');
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4 md:p-5">
      <div className="flex items-center gap-2 text-navy font-medium mb-4"><SlidersHorizontal className="h-4 w-4 text-gold" /> Filtres</div>
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Input placeholder="Ville" value={f.city} onChange={e => setF({ ...f, city: e.target.value })} />
        <Select value={f.transaction} onValueChange={v => setF({ ...f, transaction: v })}>
          <SelectTrigger><SelectValue placeholder="Transaction" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="vente">Vente</SelectItem>
            <SelectItem value="location">Location</SelectItem>
          </SelectContent>
        </Select>
        <Select value={f.type} onValueChange={v => setF({ ...f, type: v })}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous types</SelectItem>
            <SelectItem value="appartement">Appartement</SelectItem>
            <SelectItem value="maison">Maison</SelectItem>
            <SelectItem value="terrain">Terrain</SelectItem>
            <SelectItem value="commercial">Commercial</SelectItem>
          </SelectContent>
        </Select>
        <Input type="number" placeholder="Prix min" value={f.minPrice} onChange={e => setF({ ...f, minPrice: e.target.value })} />
        <Input type="number" placeholder="Prix max" value={f.maxPrice} onChange={e => setF({ ...f, maxPrice: e.target.value })} />
        <Input type="number" placeholder="Surface min (m²)" value={f.minSurface} onChange={e => setF({ ...f, minSurface: e.target.value })} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 justify-end">
        {session?.user?.role === 'user' && <Button variant="outline" onClick={saveSearch}><BellPlus className="h-4 w-4 mr-1.5" /> Enregistrer cette recherche</Button>}
        <Button variant="ghost" onClick={reset} className="text-muted-foreground"><X className="h-4 w-4 mr-1" /> Réinitialiser</Button>
        <Button onClick={apply} className="bg-navy hover:bg-navy/90 text-white">Appliquer</Button>
      </div>
    </div>
  );
}
