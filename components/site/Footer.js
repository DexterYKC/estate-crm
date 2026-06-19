import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Facebook, Linkedin } from 'lucide-react';

async function fetchAgency() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  try {
    const r = await fetch(`${base}/api/agency`, { cache: 'no-store' });
    return r.ok ? r.json() : {};
  } catch {
    return {};
  }
}

export default async function Footer() {
  const agency = await fetchAgency();
  return (
    <footer className="bg-navy text-white/80 mt-24">
      <div className="container py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-9 w-9 rounded-md bg-white/10 flex items-center justify-center">
              <span className="font-display text-gold text-lg">P</span>
            </div>
            <div>
              <div className="font-display text-white text-lg">Prestige</div>
              <div className="text-[10px] tracking-[0.25em] uppercase text-white/50">Immobilier</div>
            </div>
          </div>
          <p className="text-sm text-white/60 leading-relaxed">{agency.about ? agency.about.slice(0, 140) + (agency.about.length > 140 ? '…' : '') : "L'excellence immobilière depuis plus de 20 ans. Acquisition, vente et location de biens d'exception."}</p>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Navigation</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-gold transition">Accueil</Link></li>
            <li><Link href="/proprietes" className="hover:text-gold transition">Propriétés</Link></li>
            <li><Link href="/agence" className="hover:text-gold transition">Agence</Link></li>
            <li><Link href="/contact" className="hover:text-gold transition">Contact</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Contact</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2"><MapPin className="h-4 w-4 mt-0.5 text-gold" /> {agency.address || '12 Avenue des Champs, 75008 Paris'}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gold" /> {agency.phone || '+33 1 42 00 00 00'}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gold" /> {agency.email || 'contact@prestige-immobilier.fr'}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm font-semibold mb-4 tracking-wide uppercase">Suivez-nous</h4>
          <div className="flex gap-3">
            <a className="h-10 w-10 rounded-full bg-white/10 hover:bg-gold flex items-center justify-center transition" href="#"><Instagram className="h-4 w-4" /></a>
            <a className="h-10 w-10 rounded-full bg-white/10 hover:bg-gold flex items-center justify-center transition" href="#"><Facebook className="h-4 w-4" /></a>
            <a className="h-10 w-10 rounded-full bg-white/10 hover:bg-gold flex items-center justify-center transition" href="#"><Linkedin className="h-4 w-4" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container py-6 text-xs text-white/50 flex flex-col md:flex-row items-center justify-between gap-2">
          <div>© {new Date().getFullYear()} Prestige Immobilier — Tous droits réservés.</div>
          <div>Mentions légales · Politique de confidentialité</div>
        </div>
      </div>
    </footer>
  );
}
