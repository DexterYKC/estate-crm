'use client';
import { SessionProvider } from 'next-auth/react';
import { createContext, useContext, useEffect, useState } from 'react';

// ===== Currency context =====
const CurrencyContext = createContext(null);
const RATE_EUR_TO_TND = 3.35; // Default rate — can be adjusted via admin settings later

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('EUR');
  // null = mode pas encore connu (réglages agence en cours de chargement) — évite d'afficher
  // le sélecteur EUR/TND par défaut puis de le masquer une fois le vrai mode reçu (flash visuel).
  const [currencyMode, setCurrencyMode] = useState(null);

  useEffect(() => {
    fetch('/api/agency').then(r => r.ok ? r.json() : {}).then(agency => {
      const mode = agency?.currency_mode || 'BOTH';
      setCurrencyMode(mode);
      if (mode === 'EUR' || mode === 'TND') {
        setCurrency(mode);
      } else {
        const c = typeof window !== 'undefined' ? localStorage.getItem('currency') : null;
        if (c === 'TND' || c === 'EUR') setCurrency(c);
      }
    }).catch(() => {});
  }, []);

  function change(c) {
    if (currencyMode !== 'BOTH') return;
    setCurrency(c);
    if (typeof window !== 'undefined') localStorage.setItem('currency', c);
  }
  // La conversion de taux ne s'applique qu'en mode BOTH (un visiteur peut basculer EUR/TND sur une base de prix saisis en EUR).
  // En mode EUR ou TND fixe, l'agence saisit ses prix directement dans cette devise unique — aucune conversion, affichage brut.
  function format(priceEUR, transaction) {
    if (priceEUR == null) return '';
    const convert = currencyMode === 'BOTH' && currency === 'TND';
    const val = convert ? Math.round(priceEUR * RATE_EUR_TO_TND) : priceEUR;
    const sym = currency === 'TND' ? 'DT' : '€';
    const formatted = new Intl.NumberFormat('fr-FR').format(val);
    return transaction === 'location' ? `${formatted} ${sym} /mois` : `${formatted} ${sym}`;
  }
  // Convertit une saisie utilisateur (devise affichée) vers l'unité stockée en base, pour les filtres de recherche.
  function toEUR(amount) {
    if (amount == null || amount === '') return amount;
    const convert = currencyMode === 'BOTH' && currency === 'TND';
    return convert ? Math.round(amount / RATE_EUR_TO_TND) : amount;
  }
  const symbol = currency === 'TND' ? 'DT' : '€';
  return <CurrencyContext.Provider value={{ currency, currencyMode, change, format, toEUR, symbol }}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) return { currency: 'EUR', currencyMode: 'BOTH', change: () => {}, format: (p, t) => `${new Intl.NumberFormat('fr-FR').format(p || 0)} €${t === 'location' ? ' /mois' : ''}`, toEUR: (a) => a, symbol: '€' };
  return ctx;
}

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <CurrencyProvider>{children}</CurrencyProvider>
    </SessionProvider>
  );
}
