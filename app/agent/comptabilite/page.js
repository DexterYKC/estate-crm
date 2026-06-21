'use client';
import useSWR from 'swr';
import Link from 'next/link';
import { Receipt, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToCSV } from '@/lib/csv-export';
import ManualInvoiceDialog from '@/components/admin/ManualInvoiceDialog';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());
const LIST_KEY = '/api/agent/invoices';

export default function AgentComptabilite() {
  const { data, isLoading } = useSWR(LIST_KEY, fetcher);
  const total = (data || []).reduce((s, i) => s + (i.amount || 0), 0);
  const totalCommission = (data || []).reduce((s, i) => s + (i.agent_commission_amount || 0), 0);

  function handleExport() {
    exportToCSV('ma-comptabilite', data || [], [
      { key: 'number', label: 'N°' },
      { label: 'Date', value: (i) => new Date(i.issued_at).toLocaleDateString('fr-FR') },
      { label: 'Client', value: (i) => i.client_name || '' },
      { label: 'Bien / Description', value: (i) => i.description || i.property_title || '' },
      { key: 'type', label: 'Type' },
      { key: 'amount', label: 'Montant' },
      { label: 'Ma commission', value: (i) => i.agent_commission_amount || 0 },
      { label: 'Commission versée', value: (i) => i.agent_commission_paid ? 'Oui' : 'Non' },
    ]);
  }

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Ma comptabilité</h1>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ManualInvoiceDialog apiBase="/api/agent/invoices" clientsApiBase="/api/agent/clients" listKey={LIST_KEY} />
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
          <div className="mt-2 font-display text-3xl text-navy">{new Intl.NumberFormat('fr-FR').format(total)}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Ma commission</div>
          <div className="mt-2 font-display text-3xl text-navy">{new Intl.NumberFormat('fr-FR').format(totalCommission)}</div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-secondary/60 text-navy">
            <tr className="text-left">
              <th className="px-4 py-3 font-semibold">N°</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Client</th>
              <th className="px-4 py-3 font-semibold">Bien / Description</th>
              <th className="px-4 py-3 font-semibold text-right">Montant</th>
              <th className="px-4 py-3 font-semibold text-right">Ma commission</th>
              <th className="px-4 py-3 font-semibold text-center">Versée ?</th>
              <th className="px-4 py-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && <tr><td colSpan={8}><Loading /></td></tr>}
            {(data || []).map(inv => (
              <tr key={inv.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-mono text-gold">{inv.number}</td>
                <td className="px-4 py-3 text-navy/80">{new Date(inv.issued_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-navy/80">{inv.client_name || '—'}</td>
                <td className="px-4 py-3 text-navy/80">{inv.property_ref && <span className="font-mono text-gold mr-1">{inv.property_ref}</span>}{inv.description || inv.property_title || '—'}</td>
                <td className="px-4 py-3 text-navy text-right font-medium">{new Intl.NumberFormat('fr-FR').format(inv.amount || 0)}</td>
                <td className="px-4 py-3 text-gold text-right">{inv.agent_commission_amount != null ? new Intl.NumberFormat('fr-FR').format(inv.agent_commission_amount) : '—'}</td>
                <td className="px-4 py-3 text-center">
                  {inv.agent_commission_amount != null ? (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${inv.agent_commission_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {inv.agent_commission_paid ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />} {inv.agent_commission_paid ? 'Versée' : 'À verser'}
                    </span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-right"><Link href={`/factures/${inv.id}`} target="_blank" className="text-gold hover:underline"><Receipt className="h-4 w-4 inline" /></Link></td>
              </tr>
            ))}
            {!isLoading && (data || []).length === 0 && <tr><td colSpan={8} className="py-10 text-center text-muted-foreground">Aucune facture.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
