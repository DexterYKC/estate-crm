'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import Link from 'next/link';
import { UserPlus, Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (f.password.length < 6) return toast.error('Le mot de passe doit faire au moins 6 caractères.');
    if (f.password !== f.confirm) return toast.error('Les mots de passe ne correspondent pas.');
    setLoading(true);
    try {
      const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: f.name, email: f.email, phone: f.phone, password: f.password }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      toast.success(d.message || 'Compte créé');
      // Auto sign-in
      const res = await signIn('credentials', { email: f.email, password: f.password, redirect: false });
      if (!res?.error) { router.push('/mon-compte'); router.refresh(); }
      else router.push('/login');
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 relative">
        <img src="https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?crop=entropy&cs=srgb&fm=jpg&w=1600&q=85" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-navy/80" />
        <div className="relative p-16 text-white flex flex-col justify-between w-full">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-md bg-white/10 flex items-center justify-center"><span className="font-display text-gold text-xl">P</span></div>
            <div><div className="font-display text-xl">Prestige</div><div className="text-[10px] tracking-[0.25em] uppercase text-white/60">Immobilier</div></div>
          </Link>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold">Rejoignez-nous</div>
            <h1 className="font-display text-4xl mt-3 max-w-md leading-tight">Votre prochain bien d'exception vous attend</h1>
            <p className="mt-4 text-white/70 max-w-md">Créez un compte pour sauvegarder vos favoris, suivre vos demandes et bénéficier d'un accompagnement personnalisé.</p>
            <ul className="mt-6 space-y-2 text-white/80 text-sm">
              <li>• Sauvegardez vos biens préférés</li>
              <li>• Suivez l'état de vos demandes</li>
              <li>• Alertes sur les nouveaux biens correspondants</li>
            </ul>
          </div>
          <div className="text-xs text-white/40">© {new Date().getFullYear()} Prestige Immobilier</div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Inscription</div>
          <h2 className="font-display text-3xl text-navy mt-2">Créer un compte</h2>
          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            <div><Label>Nom complet</Label><Input required value={f.name} onChange={e => setF({ ...f, name: e.target.value })} placeholder="Jean Dupont" /></div>
            <div><Label>Email</Label><Input type="email" required value={f.email} onChange={e => setF({ ...f, email: e.target.value })} placeholder="vous@exemple.com" /></div>
            <div><Label>Téléphone (optionnel)</Label><Input value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} placeholder="+33 6 12 34 56 78" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Mot de passe</Label><Input type="password" required value={f.password} onChange={e => setF({ ...f, password: e.target.value })} placeholder="6 caractères min." /></div>
              <div><Label>Confirmer</Label><Input type="password" required value={f.confirm} onChange={e => setF({ ...f, confirm: e.target.value })} /></div>
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-navy hover:bg-navy/90 text-white h-11">
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserPlus className="h-4 w-4 mr-2" />}
              Créer mon compte
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Déjà inscrit ? <Link href="/login" className="text-gold hover:underline">Se connecter</Link>
          </div>
          <div className="mt-4 text-center text-sm"><Link href="/" className="text-muted-foreground hover:text-gold">← Retour au site</Link></div>
        </div>
      </div>
    </div>
  );
}
