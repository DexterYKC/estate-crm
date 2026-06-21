'use client';
import useSWR, { mutate } from 'swr';
import { useMemo } from 'react';
import Link from 'next/link';
import { Receipt, TrendingUp, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/csv-export';
import ManualInvoiceDialog from '@/components/admin/ManualInvoiceDialog';
import Loading from '@/components/ui/loading';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());
const LIST_KEY = '/api/admin/invoices';

export default function AdminComptabilite() {
  const { data, isLoading } = useSWR(LIST_KEY, fetcher);

  async function toggleCommissionPaid(id, paid) {
    await fetch(`/api/admin/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agent_commission_paid: paid }) });
    mutate(LIST_KEY);
    toast.success(paid ? 'Commission marquée comme versée' : 'Commission marquée comme non versée');
  }

  const perAgent = useMemo(() => {
    const map = new Map();
    for (const inv of data || []) {
      const key = inv.agent_name || 'Non assigné';
      if (!map.has(key)) map.set(key, { count: 0, total: 0, commission: 0 });
      const e = map.get(key);
      e.count += 1;
      e.total += inv.amount || 0;
      e.commission += inv.agent_commission_amount || 0;
    }
    return Array.from(map.entries()).map(([name, v]) => ({ name, ...v }));
  }, [data]);

  const grandTotal = (data || []).reduce((s, i) => s + (i.amount || 0), 0);
  const grandCommission = (data || []).reduce((s, i) => s + (i.agent_commission_amount || 0), 0);

  function handleExport() {
    exportToCSV('comptabilite', data || [], [
      { key: 'number', label: 'N°' },
      { label: 'Date', value: (i) => new Date(i.issued_at).toLocaleDateString('fr-FR') },
      { label: 'Agent', value: (i) => i.agent_name || '' },
      { label: 'Client', value: (i) => i.client_name || '' },
      { label: 'Bien / Description', value: (i) => i.description || i.property_title || '' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Montant' },
      { label: 'Commission agent', value: (i) => i.agent_commission_amount || 0 },
      { label: 'Commission versée', value: (i) => i.agent_commission_paid ? 'Oui' : 'Non' },
    ]);
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Comptabilité</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ManualInvoiceDialog apiBase="/api/admin/invoices" clientsApiBase="/api/admin/clients" agentsApiBase="/api/admin/agents-list" listKey={LIST_KEY} />
          <Button variant="outline" onClick={handleExport}><Download className="h-4 w-4 mr-1.5" /> Exporter CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Factures émises</div>
          <div className="mt-2 font-display text-3xl text-navy">{(data || []).length}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Montant total facturé</div>
          <div className="mt-2 font-display text-3xl text-navy">{new Intl.NumberFormat('fr-FR').format(grandTotal)}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Commissions agents</div>
          <div className="mt-2 font-display text-3xl text-navy">{new Intl.NumberFormat('fr-FR').format(grandCommission)}</div>
          <div className="text-xs text-muted-foreground mt-1">dont {new Intl.NumberFormat('fr-FR').format((data || []).reduce((s, i) => s + (i.agent_commission_paid ? (i.agent_commission_amount || 0) : 0), 0))} versées</div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 text-navy font-medium mb-4"><TrendingUp className="h-4 w-4 text-gold" /> Par agent</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {perAgent.map(a => (
            <div key={a.name} className="bg-card rounded-xl border border-border p-5">
              <div className="font-medium text-navy">{a.name}</div>
              <div className="mt-2 text-sm text-muted-foreground">{a.count} facture(s)</div>
              <div className="mt-1 font-display text-lg text-navy">{new Intl.NumberFormat('fr-FR').format(a.total)}</div>
              <div className="text-xs text-gold mt-0.5">dont {new Intl.NumberFormat('fr-FR').format(a.commission)} de commission</div>
            </div>
          ))}
          {perAgent.length === 0 && <div className="text-sm text-muted-foreground">Aucune facture émise.</div>}
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-secondary/60 text-navy">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">N°</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Agent</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Bien / Description</th>
              <th className="px-4 py-3 font-semibold text-right">Montant</th>
              <th className="px-4 py-3 font-semibold text-right">Commission agent</th>
              <th className="px-4 py-3 font-semibold text-center">Versée ?</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={9}><Loading /></td></tr>}
            {(data || []).map(inv => (
              <tr key={inv.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-gold">{inv.number}</td>
                <td className="px-4 py-3 text-navy/80">{new Date(inv.issued_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-navy/80">{inv.agent_name || '—'}</td>
                <td className="px-4 py-3 text-navy/80">{inv.client_name || '—'}</td>
                <td className="px-4 py-3 text-navy/80">{inv.property_ref && <span className="font-mono text-gold mr-1">{inv.property_ref}</span>}{inv.description || inv.property_title || '—'}</td>
                <td className="px-4 py-3 text-navy text-right font-medium">{new Intl.NumberFormat('fr-FR').format(inv.amount || 0)}</td>
                <td className="px-4 py-3 text-gold text-right">{inv.agent_commission_amount != null ? new Intl.NumberFormat('fr-FR').format(inv.agent_commission_amount) : '—'}</td>
                <td className="px-4 py-3 text-center">
                  {inv.agent_commission_amount != null && inv.agent_id ? (
                    <button onClick={() => toggleCommissionPaid(inv.id, !inv.agent_commission_paid)} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${inv.agent_commission_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {inv.agent_commission_paid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {inv.agent_commission_paid ? 'Versée' : 'À verser'}
                    </button>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right"><Link href={`/factures/${inv.id}`} target="_blank" className="text-gold hover:underline"><Receipt className="h-4 w-4 inline" /></Link></td>
              </tr>
            ))}
            {!isLoading && (data || []).length === 0 && <tr><td colSpan={9} className="py-10 text-center text-muted-foreground">Aucune facture.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
