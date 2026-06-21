'use client';
import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import { Plus, Edit3, Trash2, CalendarDays, Clock, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

const fetcher = (u) => fetch(u).then(r => r.json());
const todayISO = () => new Date().toISOString().slice(0, 10);
const toISO = (d) => d.toISOString().slice(0, 10);

function formatDate(s) {
  if (!s) return '';
  const d = new Date(s + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AgentAppointments() {
  const { data } = useSWR('/api/agent/appointments', fetcher);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const apptDates = [...new Set((data || []).map(a => a.date).filter(Boolean))].map(d => new Date(d + 'T00:00:00'));

  function openNew() { setEditing({ client_name: '', client_phone: '', date: todayISO(), time: '10:00', notes: '', status: 'scheduled' }); setOpen(true); }
  function openEdit(a) { setEditing({ ...a }); setOpen(true); }
  async function save() {
    const isNew = !editing.id;
    const url = isNew ? '/api/agent/appointments' : `/api/agent/appointments/${editing.id}`;
    const r = await fetch(url, { method: isNew ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
    if (r.ok) { toast.success(isNew ? 'Rendez-vous créé' : 'Rendez-vous mis à jour'); setOpen(false); setEditing(null); mutate('/api/agent/appointments'); }
  }
  async function remove(id) {
    if (!confirm('Supprimer ce rendez-vous ?')) return;
    await fetch(`/api/agent/appointments/${id}`, { method: 'DELETE' });
    mutate('/api/agent/appointments');
    toast.success('Supprimé');
  }

  // Group by date
  const grouped = {};
  for (const a of (data || [])) {
    const k = a.date || 'Non défini';
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(a);
  }
  const dayFilter = selectedDay ? toISO(selectedDay) : null;
  const dates = Object.keys(grouped).filter(d => !dayFilter || d === dayFilter).sort();
  const upcoming = dates.filter(d => dayFilter ? d === dayFilter : (d === 'Non défini' || d >= todayISO()));
  const past = dayFilter ? [] : dates.filter(d => d !== 'Non défini' && d < todayISO());

  return (
    <div className="p-8 lg:p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Calendrier</div>
          <h1 className="font-display text-3xl text-navy mt-1">Mes rendez-vous</h1>
        </div>
        <Button onClick={openNew} className="bg-navy hover:bg-navy/90 text-white"><Plus className="h-4 w-4 mr-1" /> Nouveau rendez-vous</Button>
      </div>

      <div className="bg-card rounded-xl border border-border p-4 mb-8 inline-block">
        <Calendar
          mode="single"
          selected={selectedDay}
          onSelect={(d) => setSelectedDay(prev => (d && toISO(d) === (prev ? toISO(prev) : null)) ? null : d)}
          modifiers={{ hasAppt: apptDates }}
          modifiersClassNames={{ hasAppt: 'after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-gold' }}
        />
        {selectedDay && <div className="px-3 pb-1 flex justify-end"><button onClick={() => setSelectedDay(null)} className="text-xs text-gold hover:underline">Voir tout</button></div>}
      </div>

      {data && data.length === 0 && <div className="py-16 text-center text-muted-foreground">Aucun rendez-vous planifié. <button onClick={openNew} className="text-gold underline ml-2">En créer un</button></div>}

      {dayFilter && upcoming.length === 0 && <div className="py-10 text-center text-muted-foreground">Aucun rendez-vous le {selectedDay.toLocaleDateString('fr-FR')}.</div>}

      {upcoming.length > 0 && (
        <div className="space-y-8">
          <h2 className="font-display text-lg text-navy/80">{dayFilter ? 'Ce jour' : 'À venir'}</h2>
          {upcoming.map(d => (
            <DayBlock key={d} date={d} items={grouped[d]} onEdit={openEdit} onDelete={remove} onStatus={(id, status) => fetch(`/api/agent/appointments/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }).then(() => mutate('/api/agent/appointments'))} />
          ))}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-8 mt-12 opacity-70">
          <h2 className="font-display text-lg text-navy/80">Passés</h2>
          {past.slice(-5).map(d => (
            <DayBlock key={d} date={d} items={grouped[d]} onEdit={openEdit} onDelete={remove} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display text-navy">{editing?.id ? 'Modifier le rendez-vous' : 'Nouveau rendez-vous'}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Nom du client</Label><Input value={editing.client_name} onChange={e => setEditing({ ...editing, client_name: e.target.value })} /></div>
              <div><Label>Téléphone</Label><Input value={editing.client_phone || ''} onChange={e => setEditing({ ...editing, client_phone: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={editing.date || ''} onChange={e => setEditing({ ...editing, date: e.target.value })} /></div>
                <div><Label>Heure</Label><Input type="time" value={editing.time || ''} onChange={e => setEditing({ ...editing, time: e.target.value })} /></div>
              </div>
              <div><Label>Statut</Label><Select value={editing.status || 'scheduled'} onValueChange={v => setEditing({ ...editing, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="scheduled">Planifié</SelectItem><SelectItem value="done">Effectué</SelectItem><SelectItem value="cancelled">Annulé</SelectItem></SelectContent></Select></div>
              <div><Label>Notes</Label><Textarea rows={3} value={editing.notes || ''} onChange={e => setEditing({ ...editing, notes: e.target.value })} /></div>
              <Button onClick={save} className="w-full bg-navy hover:bg-navy/90 text-white">Enregistrer</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DayBlock({ date, items, onEdit, onDelete }) {
  const statusBadge = (s) => s === 'done' ? 'bg-emerald-100 text-emerald-700' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
  const statusLabel = (s) => s === 'done' ? 'Effectué' : s === 'cancelled' ? 'Annulé' : 'Planifié';
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <div className="h-10 w-10 rounded-lg bg-gold/15 flex items-center justify-center text-gold"><CalendarDays className="h-5 w-5" /></div>
        <div className="font-display text-lg text-navy capitalize">{date === 'Non défini' ? date : formatDate(date)}</div>
      </div>
      <div className="space-y-2 ml-0 sm:ml-12">
        {items.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(a => (
          <div key={a.id} className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-4 bg-card rounded-xl border border-border p-4 hover:border-gold/40 transition">
            <div className="flex items-center gap-1.5 text-navy font-semibold sm:w-20 shrink-0"><Clock className="h-3.5 w-3.5 text-gold" /> {a.time || '--:--'}</div>
            <div className="flex-1 min-w-0 basis-full sm:basis-0">
              <div className="font-medium text-navy truncate flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {a.client_name || 'Client'}</div>
              {a.client_phone && <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {a.client_phone}</div>}
              {a.notes && <div className="text-xs text-navy/60 mt-1 line-clamp-1">{a.notes}</div>}
            </div>
            <div className="flex items-center gap-2 ml-auto sm:ml-0">
              <span className={`px-2 py-0.5 text-[10px] uppercase tracking-widest font-semibold rounded ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span>
              <button onClick={() => onEdit(a)} className="p-2 rounded hover:bg-secondary text-navy/60"><Edit3 className="h-3.5 w-3.5" /></button>
              <button onClick={() => onDelete(a.id)} className="p-2 rounded hover:bg-red-50 text-red-500"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
