'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const callbackUrl = sp.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      toast.error('Identifiants incorrects ou compte non actif.');
    } else {
      toast.success('Connexion réussie');
      // Force a refresh to pick up the session
      const meRes = await fetch('/api/auth/session');
      const me = await meRes.json();
      const role = me?.user?.role;
      const dest = role === 'admin' ? '/admin' : role === 'agent' ? '/agent' : (callbackUrl !== '/login' ? callbackUrl : '/');
      router.push(dest);
      router.refresh();
    }
  }

  function fill(em, pw) { setEmail(em); setPassword(pw); }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative">
        <img src="https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative p-16 text-white flex flex-col justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center"><span className="font-display text-gold text-xl">P</span></div>
            <div><div className="font-display text-xl">Prestige</div><div className="text-[10px] tracking-[0.25em] uppercase text-white/60">Immobilier</div></div>
          </Link>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Espace professionnel</div>
            <h1 className="font-display text-4xl mt-3 max-w-md leading-tight">Bienvenue dans votre espace de gestion</h1>
            <p className="mt-4 text-white/70 max-w-md">Accédez à votre tableau de bord pour gérer biens, demandes et rendez-vous.</p>
          </div>
          <div className="text-xs text-white/40">© {new Date().getFullYear()} Prestige Immobilier</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Connexion</div>
          <h2 className="font-display text-3xl text-navy mt-2">Accéder à mon compte</h2>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="vous@exemple.com" />
            </div>
            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy/90 text-white h-11">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <LogIn className="h-4 w-4 mr-2" />}
              Se connecter
            </Button>
          </form>
          <div className="mt-8 p-4 rounded-lg border border-dashed border-gold/40 bg-gold/5 text-sm">
            <div className="font-semibold text-navy mb-2">Comptes de démo</div>
            <div className="space-y-1 text-xs text-navy/70">
              <button type="button" onClick={() => fill('sophie@agence.com', 'agent123')} className="block hover:text-gold">· Agent : sophie@agence.com / agent123</button>
              <button type="button" onClick={() => fill('admin@agence.com', 'admin123')} className="block hover:text-gold">· Admin : admin@agence.com / admin123</button>
              <button type="button" onClick={() => fill('client@agence.com', 'client123')} className="block hover:text-gold">· Client : client@agence.com / client123</button>
            </div>
          </div>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-gold">← Retour au site</Link>
            <span className="mx-2">·</span>
            <Link href="/inscription" className="text-gold hover:underline">Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
