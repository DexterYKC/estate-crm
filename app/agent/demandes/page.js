'use client';
import useSWR from 'swr';
import { useState } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import RequestCard from '@/components/admin/RequestCard';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function AgentRequests() {
  const [status, setStatus] = useState('all');
  const [decision, setDecision] = useState('all');
  const [q, setQ] = useState('');
  const listKey = `/api/agent/requests?status=${status}&decision=${decision}`;
  const { data } = useSWR(listKey, fetcher);

  const list = (data || []).filter(r => !q || r.name?.toLowerCase().includes(q.toLowerCase()) || r.email?.toLowerCase().includes(q.toLowerCase()) || r.property_title?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">CRM</div>
          <h1 className="font-display text-3xl text-navy mt-1">Demandes reçues</h1>
          <p className="text-sm text-muted-foreground mt-1">Du premier contact à la décision : tout se passe ici, sur la même fiche.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
        </div>
      </div>

      <div className="space-y-3">
        {list.map(r => (
          <RequestCard
            key={r.id}
            request={r}
            apiBase="/api/agent/requests"
            propsApiBase="/api/agent/properties"
            invoicesApiBase="/api/agent/invoices"
            apptApiBase="/api/agent/appointments"
            remindersApiBase="/api/agent/reminders"
            clientsBasePath="/agent/clients"
            listKey={listKey}
          />
        ))}
        {data && list.length === 0 && <div className="py-16 text-center text-muted-foreground">Aucune demande ne correspond.</div>}
      </div>
    </div>
  );
}
