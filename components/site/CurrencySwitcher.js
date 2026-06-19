'use client';
import { useCurrency } from '@/components/Providers';
import { Coins } from 'lucide-react';

export default function CurrencySwitcher({ light = false }) {
  const { currency, currencyMode, change } = useCurrency();
  if (currencyMode !== 'BOTH') return null;
  const base = light ? 'text-white/80 border-white/20 hover:border-gold' : 'text-navy/80 border-border hover:border-gold';
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border ${base} px-1 py-1`}>
      <Coins className="h-3.5 w-3.5 mx-1 text-gold" />
      {['EUR', 'TND'].map(c => (
        <button key={c} onClick={() => change(c)} className={`px-2.5 py-0.5 rounded-full text-xs font-semibold transition ${currency === c ? 'bg-navy text-white' : 'opacity-70 hover:opacity-100'}`}>
          {c === 'EUR' ? '€ EUR' : 'DT TND'}
        </button>
      ))}
    </div>
  );
}
