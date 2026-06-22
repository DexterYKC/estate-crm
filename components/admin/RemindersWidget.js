'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Bell, Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());
const todayISO = () => new Date().toISOString().slice(0, 10);

export default function RemindersWidget({ apiBase, listKey }) {
  const { data } = useSWR(listKey, fetcher);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState(todayISO());

  const items = (data || []).filter(r => !r.done);

  async function add() {
    if (!text.trim()) return;
    await fetch(apiBase, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, due_date: dueDate }) });
    setText(''); setAdding(false);
    mutate(listKey);
    toast.success('Rappel ajouté');
  }
  async function toggleDone(id, done) {
    await fetch(`${apiBase}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done }) });
    mutate(listKey);
  }
  async function remove(id) {
    await fetch(`${apiBase}/${id}`, { method: 'DELETE' });
    mutate(listKey);
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-navy font-medium"><Bell className="h-4 w-4 text-gold" /> Rappels</div>
        <Button size="sm" variant="ghost" onClick={() => setAdding(a => !a)}><Plus className="h-3.5 w-3.5 mr-1" /> Ajouter</Button>
      </div>

      {adding && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder="Rappeler ce client…" className="flex-1 min-w-[160px]" />
          <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-40" />
          <Button size="sm" onClick={add} className="bg-navy hover:bg-navy/90 text-white">OK</Button>
        </div>
      )}

      <div className="space-y-2">
        {items.map(r => {
          const overdue = r.due_date && r.due_date < todayISO();
          return (
            <div key={r.id} className={`flex items-center gap-2 p-2.5 rounded-lg border ${overdue ? 'border-red-200 bg-red-50' : 'border-border'}`}>
              <button onClick={() => toggleDone(r.id, true)} className="h-5 w-5 shrink-0 rounded-full border border-navy/30 hover:bg-navy hover:border-navy flex items-center justify-center text-transparent hover:text-white transition"><Check className="h-3 w-3" /></button>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-navy truncate">{r.text}{r.client_name && <span className="text-muted-foreground"> · {r.client_name}</span>}</div>
                {r.due_date && <div className={`text-xs ${overdue ? 'text-red-600' : 'text-muted-foreground'}`}>{new Date(r.due_date).toLocaleDateString('fr-FR')}{overdue ? ' · en retard' : ''}</div>}
              </div>
              <button onClick={() => remove(r.id)} className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          );
        })}
        {items.length === 0 && <div className="text-sm text-muted-foreground py-2">Aucun rappel en attente.</div>}
      </div>
    </div>
  );
}
