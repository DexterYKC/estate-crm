import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import { Award, Users, MapPin } from 'lucide-react';

async function fetchData() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const [a, ag] = await Promise.all([
    fetch(`${base}/api/agency`, { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    fetch(`${base}/api/agents`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
  ]);
  return { agency: a, agents: ag };
}

export default async function AgencyPage() {
  const { agency, agents } = await fetchData();
  return (
    <>
      <Navbar />
      <section className="relative h-[55vh] min-h-[420px] flex items-center">
        <div className="absolute inset-0"><img src="https://images.unsplash.com/photo-1505843513577-22bb7d21e455?crop=entropy&cs=srgb&fm=jpg&w=2400&q=85" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-navy/70" /></div>
        <div className="relative container text-white max-w-3xl">
          <div className="text-xs uppercase tracking-[0.3em] text-gold">L'agence</div>
          <h1 className="font-display text-4xl md:text-6xl mt-3">{agency.name || 'Prestige Immobilier'}</h1>
          <p className="mt-4 text-white/80 max-w-2xl">{agency.about}</p>
        </div>
      </section>

      <section className="container py-20">
        <div className="text-center mb-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Notre équipe</div>
          <h2 className="font-display text-3xl md:text-4xl text-navy mt-2">Des conseillers passionnés</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {agents.map(a => (
            <div key={a.id} className="rounded-2xl border border-border bg-card overflow-hidden hover-lift">
              <img src={a.photo} alt={a.name} className="w-full h-72 object-cover" />
              <div className="p-6">
                <div className="text-xs uppercase tracking-widest text-gold">{a.speciality}</div>
                <h3 className="font-display text-xl text-navy mt-1">{a.name}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{a.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Nous trouver</div>
            <h2 className="font-display text-3xl md:text-4xl text-navy mt-2">Notre bureau</h2>
            <div className="mt-6 space-y-3 text-navy/80">
              <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-gold" /> {agency.address}</div>
              <div className="flex items-center gap-3"><Users className="h-4 w-4 text-gold" /> {agents.length} conseillers experts</div>
              <div className="flex items-center gap-3"><Award className="h-4 w-4 text-gold" /> 20+ années d'expérience</div>
            </div>
          </div>
          <div className="rounded-2xl overflow-hidden border border-border aspect-video bg-white">
            {agency.maps_embed ? <iframe src={agency.maps_embed} className="w-full h-full" loading="lazy" /> : null}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
