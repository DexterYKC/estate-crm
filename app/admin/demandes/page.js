'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BellRing, Search } from 'lucide-react';
import { toast } from 'sonner';
import RequestCard, { SOURCE_LABELS } from '@/components/admin/RequestCard';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AdminRequests() {
  const [status, setStatus] = useState('all');
  const [decision, setDecision] = useState('all');
  const [source, setSource] = useState('all');
  const [q, setQ] = useState('');
  const listKey = `/api/admin/requests?status=${status}&decision=${decision}`;
  const { data } = useSWR(listKey, fetcher);
  const { data: agents } = useSWR('/api/admin/agents-list', fetcher);
  const [running, setRunning] = useState(false);

  async function remove(id) {
    await fetch(`/api/admin/requests/${id}`, { method: 'DELETE' });
    mutate(listKey);
    toast.success('Supprimé');
  }
  async function runRelances() {
    setRunning(true);
    try {
      const r = await fetch('/api/admin/relances/run', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Erreur');
      if (d.skipped === 'disabled') toast.warning('Les relances automatiques sont désactivées (Paramètres).');
      else toast.success(`${d.sent} relance(s) envoyée(s) sur ${d.total} demande(s) éligible(s).`);
      mutate(listKey);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRunning(false);
    }
  }

  const list = (data || []).filter(r => {
    if (source !== 'all' && r.source !== source) return false;
    if (!q) return true;
    return r.name?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase()) || r.property_title?.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Demandes</h1>
          <p className="text-sm text-muted-foreground mt-1">Du premier contact à la décision : tout se passe ici, sur la même fiche.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={runRelances} disabled={running} className="text-navy border-navy/20 hover:bg-navy hover:text-white"><BellRing className="h-4 w-4 mr-1.5" /> {running ? 'Envoi…' : 'Lancer les relances maintenant'}</Button>
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Rechercher…" value={q} onChange={e => setQ(e.target.value)} className="pl-9 w-56" /></div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="new">Nouvelles</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="closed">Clôturées</SelectItem>
            </SelectContent>
          </Select>
          <Select value={decision} onValueChange={setDecision}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes décisions</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="accepted">Acceptées</SelectItem>
              <SelectItem value="refused">Refusées</SelectItem>
            </SelectContent>
          </Select>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes sources</SelectItem>
              {Object.entries(SOURCE_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        {list.map(r => (
          <RequestCard
            key={r.id}
            request={r}
            apiBase="/api/admin/requests"
            propsApiBase="/api/admin/properties"
            invoicesApiBase="/api/admin/invoices"
            apptApiBase="/api/admin/appointments"
            remindersApiBase="/api/admin/reminders"
            clientsBasePath="/admin/clients"
            listKey={listKey}
            agents={agents || []}
            onDelete={remove}
          />
        ))}
        {data && list.length === 0 && <div className="py-16 text-center text-muted-foreground">Aucune demande ne correspond.</div>}
      </div>
    </div>
  );
}
