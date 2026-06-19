import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import PropertyCard from '@/components/site/PropertyCard';
import SearchBar from '@/components/site/SearchBar';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Award, HeartHandshake, Quote, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const [pRes, sRes] = await Promise.all([
    fetch(`${base}/api/properties?featured=1&limit=6`, { cache: 'no-store' }),
    fetch(`${base}/api/stats`, { cache: 'no-store' }),
  ]);
  const properties = pRes.ok ? await pRes.json() : { items: [] };
  const stats = sRes.ok ? await sRes.json() : {};
  return { properties: properties.items || [], stats };
}

export default async function Home() {
  const { properties, stats } = await getData();
  return (
    <>
      <Navbar />
      {/* HERO */}
      <section className="relative py-28 md:h-[88vh] md:py-0 min-h-[480px] md:min-h-[640px] flex items-center">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1613977257365-aaae5a9817ff?crop=entropy&cs=srgb&fm=jpg&w=2400&q=85" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-navy/85 via-navy/55 to-navy/90" />
        </div>
        <div className="relative container text-white">
          <div className="max-w-3xl fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs tracking-widest uppercase mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" /> L'immobilier de prestige depuis 2005
            </div>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[1.05]">Trouvez la résidence<br /><span className="text-gold italic">qui vous ressemble</span></h1>
            <p className="mt-6 text-lg text-white/80 max-w-2xl">Une sélection rigoureuse de biens d'exception, accompagnée par des experts dévoués à votre projet.</p>
          </div>
          <div className="mt-10 max-w-5xl">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container mt-6 md:-mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl border border-border p-5 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            { v: stats.properties || 0, l: 'Biens disponibles' },
            { v: stats.agents || 0, l: "Conseillers experts" },
            { v: stats.cities || 0, l: 'Villes couvertes' },
            { v: `${stats.years || 20}+`, l: "Années d'expérience" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="font-display text-3xl md:text-4xl text-navy">{s.v}</div>
              <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED PROPERTIES */}
      <section className="container py-24">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Notre sélection</div>
            <h2 className="font-display text-3xl md:text-4xl text-navy mt-2">Biens d'exception</h2>
          </div>
          <Link href="/proprietes" className="hidden md:inline-flex items-center gap-2 text-sm text-navy hover:text-gold transition">
            Voir tout le catalogue <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map(p => <PropertyCard key={p.id} p={p} />)}
        </div>
        <div className="mt-10 text-center md:hidden">
          <Link href="/proprietes"><Button variant="outline" className="border-navy text-navy">Voir tout</Button></Link>
        </div>
      </section>

      {/* PROMISE */}
      <section className="bg-secondary/50 py-24">
        <div className="container grid md:grid-cols-3 gap-10">
          {[
            { i: ShieldCheck, t: 'Confidentialité absolue', d: 'Vos données et négociations sont traitées avec la plus grande discrétion.' },
            { i: Award, t: 'Sélection exclusive', d: 'Chaque bien est rigoureusement évalué pour son caractère et sa qualité.' },
            { i: HeartHandshake, t: "Accompagnement sur-mesure", d: "Un conseiller dédié vous guide à chaque étape, jusqu'à la signature." },
          ].map((p, i) => (
            <div key={i} className="text-center px-6">
              <div className="mx-auto h-14 w-14 rounded-full bg-navy text-gold flex items-center justify-center"><p.i className="h-6 w-6" /></div>
              <h3 className="font-display text-xl text-navy mt-5">{p.t}</h3>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">{p.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container py-24">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Ils nous font confiance</div>
          <h2 className="font-display text-3xl md:text-4xl text-navy mt-2">Témoignages clients</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { n: 'Camille R.', r: "Une équipe à l'écoute, professionnelle et disponible. Nous avons trouvé la maison parfaite en moins de 3 semaines.", v: 'Vente villa Cannes' },
            { n: 'Jean-Paul M.', r: 'Discrétion irréprochable et conseils d\'experts. Je recommande Prestige sans réserve.', v: 'Achat appartement Paris 8' },
            { n: 'Sophie L.', r: "Du début à la fin, un accompagnement de très haut niveau. Merci à toute l'équipe.", v: 'Location penthouse Nice' },
          ].map((t, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-8 hover-lift">
              <Quote className="h-8 w-8 text-gold/30" />
              <p className="mt-4 text-navy/80 leading-relaxed">« {t.r} »</p>
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="font-medium text-navy">{t.n}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{t.v}</div>
                </div>
                <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className="h-3.5 w-3.5 text-gold fill-gold" />)}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-navy text-white px-8 md:px-16 py-16 md:py-20">
          <div className="absolute -right-10 -top-10 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -left-10 -bottom-10 h-60 w-60 rounded-full bg-gold/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-3xl md:text-4xl leading-tight">Prêt à découvrir votre prochain chez-vous ?</h2>
            <p className="mt-4 text-white/70">Prenez rendez-vous avec l'un de nos conseillers. Une analyse personnalisée de votre projet, en toute confidentialité.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/contact"><Button className="bg-gold hover:bg-gold/90 text-navy font-semibold h-12 px-8">Prendre un rendez-vous</Button></Link>
              <Link href="/proprietes"><Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white hover:text-navy h-12 px-8">Explorer le catalogue</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
