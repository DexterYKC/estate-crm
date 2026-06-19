'use client';
import { useCurrency } from '@/components/Providers';

export default function Price({ amount, transaction, className = '', big = false }) {
  const { format } = useCurrency();
  return <span className={className}>{format(amount, transaction)}</span>;
}
