'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Phone, LayoutDashboard, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import CurrencySwitcher from './CurrencySwitcher';

const nav = [
  { href: '/', label: 'Accueil' },
  { href: '/proprietes', label: 'Propriétés' },
  { href: '/vendre-louer', label: 'Vendre / Louer' },
  { href: '/agence', label: 'Agence' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();
  const role = session?.user?.role;

  let dashHref = null;
  if (role === 'admin') dashHref = '/admin';
  else if (role === 'agent') dashHref = '/agent';
  else if (role === 'user') dashHref = '/mon-compte';

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur bg-white/85 border-b border-border">
      <div className="container flex h-20 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="h-9 w-9 rounded-md bg-navy flex items-center justify-center">
            <span className="font-display text-gold text-lg">P</span>
          </div>
          <div className="leading-tight">
            <div className="font-display text-navy text-lg">Prestige</div>
            <div className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground">Immobilier</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className="text-sm font-medium text-navy/80 hover:text-gold transition-colors">{n.label}</Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <CurrencySwitcher />
          {session ? (
            <>
              {dashHref && <Link href={dashHref}><Button variant="outline" className="border-navy/20 text-navy hover:bg-navy hover:text-white"><LayoutDashboard className="h-4 w-4 mr-1.5" /> Tableau de bord</Button></Link>}
              <Button variant="ghost" onClick={() => signOut({ callbackUrl: '/' })} className="text-navy/70" title="Déconnexion"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Link href="/login"><Button variant="outline" className="border-navy/20 text-navy hover:bg-navy hover:text-white">Connexion</Button></Link>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-white">
          <div className="container py-4 flex flex-col gap-3">
            {nav.map(n => (
              <Link key={n.href} href={n.href} className="py-2 text-navy" onClick={() => setOpen(false)}>{n.label}</Link>
            ))}
            <div className="py-2"><CurrencySwitcher /></div>
            {session ? (
              <>
                {dashHref && <Link href={dashHref} className="py-2 text-navy font-medium" onClick={() => setOpen(false)}>Tableau de bord</Link>}
                <button onClick={() => signOut({ callbackUrl: '/' })} className="py-2 text-navy text-left">Déconnexion</button>
              </>
            ) : (
              <Link href="/login" className="py-2 text-gold font-medium" onClick={() => setOpen(false)}>Connexion</Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
