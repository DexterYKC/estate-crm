'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Heart, MessageSquare, User, CalendarDays, Home, Receipt, BellPlus } from 'lucide-react';

const tabs = [
  { href: '/mon-compte', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  { href: '/mon-compte/favoris', label: 'Mes favoris', icon: Heart },
  { href: '/mon-compte/demandes', label: 'Mes demandes', icon: MessageSquare },
  { href: '/mon-compte/recherches', label: 'Mes recherches', icon: BellPlus },
  { href: '/mon-compte/rendez-vous', label: 'Mes rendez-vous', icon: CalendarDays },
  { href: '/mon-compte/biens', label: 'Mes biens', icon: Home },
  { href: '/mon-compte/locations-achats', label: 'Locations / Achats', icon: Receipt },
  { href: '/mon-compte/profil', label: 'Mon profil', icon: User },
];

export default function AccountTabs() {
  const path = usePathname();
  return (
    <div className="border-b border-border bg-white sticky top-20 z-30">
      <div className="container flex gap-1 overflow-x-auto">
        {tabs.map(t => {
          const active = t.exact ? path === t.href : path.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`flex items-center gap-2 px-4 py-4 text-sm whitespace-nowrap border-b-2 transition ${active ? 'border-gold text-navy font-semibold' : 'border-transparent text-muted-foreground hover:text-navy'}`}>
              <t.icon className="h-4 w-4" /> {t.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
