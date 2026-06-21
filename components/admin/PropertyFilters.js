'use client';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search } from 'lucide-react';

export default function PropertyFilters({ q, setQ, type, setType, transaction, setTransaction, status, setStatus, className = '' }) {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-56" /></div>
      <Select value={type} onValueChange={setType}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous types</SelectItem>
          <SelectItem value="appartement">Appartement</SelectItem>
          <SelectItem value="maison">Maison</SelectItem>
          <SelectItem value="terrain">Terrain</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
        </SelectContent>
      </Select>
      <Select value={transaction} onValueChange={setTransaction}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toutes transactions</SelectItem>
          <SelectItem value="vente">Vente</SelectItem>
          <SelectItem value="location">Location</SelectItem>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous statuts</SelectItem>
          <SelectItem value="active">Actif</SelectItem>
          <SelectItem value="inactive">Inactif</SelectItem>
          <SelectItem value="vendu">Vendu</SelectItem>
          <SelectItem value="loué">Loué</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
