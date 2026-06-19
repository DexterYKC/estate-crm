'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search, MapPin, Building2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useCurrency } from '@/components/Providers';

export default function SearchBar() {
  const router = useRouter();
  const { symbol, toEUR } = useCurrency();
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [transaction, setTransaction] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  function submit(e) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (city) p.set('city', city);
    if (type) p.set('type', type);
    if (transaction) p.set('transaction', transaction);
    if (maxPrice) p.set('maxPrice', toEUR(parseInt(maxPrice)));
    router.push(`/proprietes?${p.toString()}`);
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl p-3 md:p-4 grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 fade-in-up">
      <div className="md:col-span-1 flex items-center gap-2 px-3 pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-border">
        <MapPin className="h-4 w-4 text-gold shrink-0" />
        <input value={city} onChange={e => setCity(e.target.value)} placeholder="Ville ou quartier" className="w-full bg-transparent outline-none text-sm py-3 text-navy placeholder:text-muted-foreground" />
      </div>
      <Select value={transaction} onValueChange={setTransaction}>
        <SelectTrigger className="border-0 border-b md:border-b-0 md:border-r rounded-none border-border h-auto py-3 bg-transparent text-sm focus:ring-0"><div className="flex items-center gap-2"><Tag className="h-4 w-4 text-gold shrink-0" /><SelectValue placeholder="Transaction" /></div></SelectTrigger>
        <SelectContent>
          <SelectItem value="vente">Vente</SelectItem>
          <SelectItem value="location">Location</SelectItem>
        </SelectContent>
      </Select>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="border-0 border-b md:border-b-0 md:border-r rounded-none border-border h-auto py-3 bg-transparent text-sm focus:ring-0"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gold shrink-0" /><SelectValue placeholder="Type de bien" /></div></SelectTrigger>
        <SelectContent>
          <SelectItem value="appartement">Appartement</SelectItem>
          <SelectItem value="maison">Maison</SelectItem>
          <SelectItem value="terrain">Terrain</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2 px-3 pb-2 md:pb-0 border-b md:border-b-0 border-border">
        <input type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} placeholder={`Budget max (${symbol})`} className="w-full bg-transparent outline-none text-sm py-3 text-navy placeholder:text-muted-foreground" />
      </div>
      <Button type="submit" className="bg-navy hover:bg-gold hover:text-navy text-white h-12 md:h-auto transition-colors">
        <Search className="h-4 w-4 mr-2" /> Rechercher
      </Button>
    </form>
  );
}
