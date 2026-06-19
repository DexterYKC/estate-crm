import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import SellRentForm from '@/components/site/SellRentForm';
import { ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function SellRentPage() {
  return (
    <>
      <Navbar />
      <section className="bg-secondary/40 border-b border-border">
        <div className="container py-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Propriétaires</div>
          <h1 className="font-display text-3xl md:text-5xl text-navy mt-2">Vendre ou louer votre bien</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Confiez votre projet à nos conseillers : estimation, mise en avant et accompagnement jusqu'à la signature.</p>
        </div>
      </section>
      <section className="container py-16 grid lg:grid-cols-3 gap-10">
        <div className="space-y-6 lg:col-span-1">
          <Argument icon={TrendingUp} title="Estimation gratuite" text="Une évaluation juste de votre bien, basée sur le marché local." />
          <Argument icon={Users} title="Réseau d'acheteurs et locataires" text="Votre annonce mise en avant auprès de notre portefeuille de clients qualifiés." />
          <Argument icon={ShieldCheck} title="Accompagnement de A à Z" text="De l'estimation à la signature, un conseiller dédié vous accompagne à chaque étape." />
        </div>
        <div className="lg:col-span-2">
          <SellRentForm />
        </div>
      </section>
      <Footer />
    </>
  );
}

function Argument({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="h-11 w-11 rounded-full bg-navy text-gold flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="font-medium text-navy">{title}</div>
        <div className="mt-1 text-sm text-muted-foreground">{text}</div>
      </div>
    </div>
  );
}
