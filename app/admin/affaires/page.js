'use client';
import useSWR from 'swr';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Building2, Key, TrendingUp, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const fetcher = (u) => fetch(u).then(r => r.json());
const TABS = [
  { value: 'accepted', label: 'Acceptées' },
  { value: 'refused', label: 'Refusées' },
];

export default function AdminAffaires() {
  const [tab, setTab] = useState('accepted');
  const [agentFilter, setAgentFilter] = useState('all');
  const { data: agents } = useSWR('/api/admin/agents-list', fetcher);
  const { data: allRequests } = useSWR('/api/admin/requests?decision=accepted', fetcher);
  const { data: history } = useSWR(`/api/admin/requests?decision=${tab}`, fetcher);
  const filteredHistory = (history || []).filter(r => agentFilter === 'all' || r.agent_id === agentFilter);

  const perAgent = useMemo(() => {
    if (!agents) return [];
    return agents.map(a => {
      const deals = (allRequests || []).filter(r => r.agent_id === a.id);
      const sales = deals.filter(d => d.property_transaction === 'vente');
      const rentals = deals.filter(d => d.property_transaction === 'location');
      const total = deals.reduce((sum, d) => sum + (d.deal_price ?? d.property_price ?? 0), 0);
      return { ...a, sales: sales.length, rentals: rentals.length, total };
    });
  }, [agents, allRequests]);

  const totals = useMemo(() => {
    const sales = (allRequests || []).filter(d => d.property_transaction === 'vente').length;
    const rentals = (allRequests || []).filter(d => d.property_transaction === 'location').length;
    const total = (allRequests || []).reduce((sum, d) => sum + (d.deal_price ?? d.property_price ?? 0), 0);
    return { sales, rentals, total };
  }, [allRequests]);

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Suivi des affaires</h1>
          <p className="text-sm text-muted-foreground mt-1">Pour accepter/refuser une demande ou conclure une affaire, c'est dans Demandes.</p>
        </div>
        <Link href="/admin/demandes"><Button variant="outline">Aller aux demandes <ArrowRight className="h-4 w-4 ml-1.5" /></Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-3">
          <Building2 className="h-5 w-5 text-gold" /> <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Ventes conclues</div><div className="font-display text-2xl text-navy">{totals.sales}</div></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6 flex items-center gap-3">
          <Key className="h-5 w-5 text-gold" /> <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Locations conclues</div><div className="font-display text-2xl text-navy">{totals.rentals}</div></div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Chiffre d'affaires conclu</div>
          <div className="font-display text-2xl text-navy mt-1">{new Intl.NumberFormat('fr-FR').format(totals.total)}</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-navy font-medium mb-4"><TrendingUp className="h-4 w-4 text-gold" /> Performance par agent</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perAgent.map(a => (
            <div key={a.id} className="bg-card rounded-xl border border-border p-5">
              <div className="font-medium text-navy">{a.name}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5 text-gold" /> Ventes</span>
                <span className="font-display text-lg text-navy">{a.sales}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground"><Key className="h-3.5 w-3.5 text-gold" /> Locations</span>
                <span className="font-display text-lg text-navy">{a.rentals}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">CA conclu : <span className="text-navy font-semibold">{new Intl.NumberFormat('fr-FR').format(a.total)}</span></div>
            </div>
          ))}
          {agents && agents.length === 0 && <div className="text-sm text-muted-foreground">Aucun agent.</div>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-navy font-medium"><User className="h-4 w-4 text-gold" /> Historique et traçabilité</div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Tous les agents" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les agents</SelectItem>
                {(agents || []).map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex gap-1 border-b border-border">
              {TABS.map(t => (
                <button key={t.value} onClick={() => setTab(t.value)} className={`px-4 py-2 text-sm border-b-2 transition ${tab === t.value ? 'border-gold text-navy font-semibold' : 'border-transparent text-muted-foreground hover:text-navy'}`}>{t.label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-secondary/60 text-navy">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Bien</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="px-4 py-3 font-semibold text-right">{tab === 'accepted' ? 'Prix conclu' : 'Motif du refus'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredHistory.map(r => (
                <tr key={r.id} className="hover:bg-secondary/40">
                  <td className="px-4 py-3 text-navy/80">{new Date(r.deal_date || r.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">{r.client_id ? <Link href={`/admin/clients/${r.client_id}`} className="text-gold hover:underline">{r.name}</Link> : r.name}</td>
                  <td className="px-4 py-3 text-navy/80">{r.property_ref && <span className="font-mono text-gold mr-1">{r.property_ref}</span>}{r.property_title || '—'}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold bg-secondary rounded">{r.property_transaction || '—'}</span></td>
                  <td className="px-4 py-3 text-navy/80">{r.agent_name || '—'}</td>
                  <td className="px-4 py-3 text-right text-navy">{tab === 'accepted' ? new Intl.NumberFormat('fr-FR').format(r.deal_price ?? r.property_price ?? 0) : (r.refusal_reason || <span className="text-muted-foreground italic">Non précisé</span>)}</td>
                </tr>
              ))}
              {history && filteredHistory.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-muted-foreground">Aucune affaire {tab === 'accepted' ? 'acceptée' : 'refusée'}{agentFilter !== 'all' ? ' pour cet agent' : ''}.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
