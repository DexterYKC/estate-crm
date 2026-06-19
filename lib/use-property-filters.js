import { useState } from 'react';

export function usePropertyFilters(data) {
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [transaction, setTransaction] = useState('all');
  const [status, setStatus] = useState('all');

  const list = (data || []).filter(p => {
    if (q && !(p.title.toLowerCase().includes(q.toLowerCase()) || p.city?.toLowerCase().includes(q.toLowerCase()))) return false;
    if (type !== 'all' && p.type !== type) return false;
    if (transaction !== 'all' && p.transaction !== transaction) return false;
    if (status !== 'all' && p.status !== status) return false;
    return true;
  });

  return { q, setQ, type, setType, transaction, setTransaction, status, setStatus, list };
}
