'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Search, Building2, Briefcase, Download } from 'lucide-react';
import { exportToCSV } from '@/lib/csv-export';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function ClientsList({ apiBase, basePath }) {
  const { data, isLoading } = useSWR(apiBase, fetcher);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');

  const list = (data || []).filter(c => {
    if (q && !(c.name?.toLowerCase().includes(q.toLowerCase()) || c.email?.toLowerCase().includes(q.toLowerCase()) || c.phone?.includes(q))) return false;
    if (filter === 'owners' && !(c.owned_count > 0)) return false;
    if (filter === 'deals' && !(c.deal_count > 0)) return false;
    return true;
  });

  function handleExport() {
    exportToCSV('clients', list, [
      { key: 'name', label: 'Nom' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Téléphone' },
      { key: 'request_count', label: 'Nb demandes' },
      { key: 'deal_count', label: 'Nb affaires conclues' },
      { label: 'Propriétaire', value: (c) => (c.owned_count > 0 ? 'Oui' : 'Non') },
    ]);
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Clients</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-56" /></div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="owners">Propriétaires</SelectItem>
              <SelectItem value="deals">Avec affaire(s) conclue(s)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" /> Exporter CSV</Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border divide-y divide-border">
        {isLoading && <Loading className="p-10" />}
        {list.map(c => (
          <Link key={c.id} href={`${basePath}/${c.id}`} className="flex items-center gap-4 p-4 flex-wrap hover:bg-secondary/40 transition">
            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-semibold text-navy shrink-0">{(c.name || '?')[0]}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-navy truncate">{c.name || 'Sans nom'}</div>
              <div className="text-xs text-muted-foreground truncate">{c.email}{c.email && c.phone ? ' · ' : ''}{c.phone}</div>
            </div>
            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {c.owned_count > 0 && <span className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-blue-100 text-blue-700"><Building2 className="h-3 w-3" /> Propriétaire</span>}
              <span className="px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-secondary text-muted-foreground">{c.request_count} demande(s)</span>
              {c.deal_count > 0 && <span className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-widest font-semibold rounded bg-emerald-100 text-emerald-700"><Briefcase className="h-3 w-3" /> {c.deal_count} conclue(s)</span>}
            </div>
          </Link>
        ))}
        {!isLoading && list.length === 0 && <div className="p-10 text-center text-muted-foreground">Aucun client.</div>}
      </div>
    </div>
  );
}
