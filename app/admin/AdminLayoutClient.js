'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { LayoutDashboard, Home, Users, UserCog, MessageSquare, Settings, LogOut, Building2, ChevronRight, TrendingUp, Menu, X, Contact, Receipt } from 'lucide-react';

const navGroups = [
  { label: null, items: [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, exact: true },
  ] },
  { label: 'Catalogue', items: [
    { href: '/admin/proprietes', label: 'Propriétés', icon: Home },
    { href: '/admin/agents', label: 'Agents', icon: UserCog },
  ] },
  { label: 'CRM', items: [
    { href: '/admin/demandes', label: 'Demandes', icon: MessageSquare },
    { href: '/admin/clients', label: 'Clients', icon: Contact },
    { href: '/admin/affaires', label: 'Suivi des affaires', icon: TrendingUp },
  ] },
  { label: 'Finance', items: [
    { href: '/admin/comptabilite', label: 'Comptabilité', icon: Receipt },
  ] },
  { label: 'Administration', items: [
    { href: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
    { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
  ] },
];

export default function AdminLayoutClient({ children }) {
  const path = usePathname();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen md:flex bg-secondary/30">
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between h-16 px-4 bg-navy text-white">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-white/10 flex items-center justify-center"><span className="font-display text-gold text-base">P</span></div>
          <div className="font-display text-sm">Prestige Admin</div>
        </Link>
        <button onClick={() => setOpen(true)} aria-label="Ouvrir le menu"><Menu className="h-6 w-6" /></button>
      </div>

      {open && <div className="md:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-navy text-white flex flex-col z-50 transform transition-transform duration-200 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 h-20 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-md bg-white/10 flex items-center justify-center"><span className="font-display text-gold text-lg">P</span></div>
            <div><div className="font-display text-white text-base">Prestige</div><div className="text-[10px] tracking-[0.25em] uppercase text-white/50">Administration</div></div>
          </Link>
          <button onClick={() => setOpen(false)} className="md:hidden text-white/70 hover:text-white" aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          {navGroups.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
              {group.label && <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/35">{group.label}</div>}
              <div className="space-y-1">
                {group.items.map(n => {
                  const active = n.exact ? path === n.href : path === n.href || path.startsWith(n.href + '/');
                  return (
                    <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${active ? 'bg-white/10 text-gold' : 'text-white/70 hover:bg-white/5 hover:text-white'}`}>
                      <n.icon className="h-4 w-4" /> {n.label}
                      {active && <ChevronRight className="h-4 w-4 ml-auto" />}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 px-2 mb-3">
            <div className="h-9 w-9 rounded-full bg-gold/20 flex items-center justify-center text-gold font-semibold">{(session?.user?.name || 'A')[0]}</div>
            <div className="min-w-0">
              <div className="text-sm text-white truncate">{session?.user?.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-gold">Administrateur</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/' })} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/70 hover:bg-white/5 hover:text-white"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
