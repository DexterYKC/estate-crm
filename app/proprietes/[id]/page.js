import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import ContactForm from '@/components/site/ContactForm';
import Price from '@/components/site/Price';
import Gallery from './Gallery';
import { MapPin, Maximize, BedDouble, Building2, Layers, Eye, CheckCircle2, Tag, Phone, Mail } from 'lucide-react';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

async function fetchProperty(id) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const res = await fetch(`${base}/api/properties/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}
async function fetchAgency() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const r = await fetch(`${base}/api/agency`, { cache: 'no-store' });
  return r.ok ? r.json() : {};
}

const typeLabels = { appartement: 'Appartement', maison: 'Maison', terrain: 'Terrain', commercial: 'Commercial' };

export default async function PropertyDetail({ params }) {
  const [p, agency] = await Promise.all([fetchProperty(params.id), fetchAgency()]);
  if (!p) notFound();
  return (
    <>
      <Navbar />
      <section className="container py-8">
        <Gallery images={p.images || []} title={p.title} />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 mt-10">
          {/* LEFT */}
          <div className="lg:col-span-3 space-y-10">
            <div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-secondary text-navy rounded">{typeLabels[p.type]}</span>
                <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-navy text-white rounded">{p.transaction === 'location' ? 'Location' : 'Vente'}</span>
                {agency.tour_feature_enabled !== 0 && p.tour_enabled === 1 && <span className="px-2.5 py-1 text-[11px] uppercase tracking-wider font-semibold bg-gold text-navy rounded">Visite 3D</span>}
              </div>
              {p.ref && <div className="text-xs font-mono text-muted-foreground mb-1">Référence {p.ref}</div>}
              <h1 className="font-display text-3xl md:text-5xl text-navy leading-tight">{p.title}</h1>
              <div className="mt-3 flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4 text-gold" /> {p.address}{p.district ? `, ${p.district}` : ''}, {p.city}</div>
              <div className="mt-6 font-display text-3xl text-navy"><Price amount={p.price} transaction={p.transaction} /></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {p.surface ? <Stat icon={Maximize} label="Surface" value={`${p.surface} m²`} /> : null}
              {p.rooms ? <Stat icon={BedDouble} label="Pièces" value={p.rooms} /> : null}
              {p.floor != null ? <Stat icon={Layers} label="Étage" value={p.floor === 0 ? 'RDC' : p.floor} /> : null}
              <Stat icon={Eye} label="Vues" value={p.views} />
            </div>

            <div>
              <h2 className="font-display text-2xl text-navy">Description</h2>
              <p className="mt-4 text-navy/80 leading-relaxed whitespace-pre-line">{p.description}</p>
            </div>

            {p.amenities && p.amenities.length > 0 && (
              <div>
                <h2 className="font-display text-2xl text-navy">Équipements & prestations</h2>
                <div className="mt-5 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {p.amenities.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-navy/80">
                      <CheckCircle2 className="h-4 w-4 text-gold" /> {a}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3D TOUR — only if enabled by admin (both globally and on this property) */}
            {agency.tour_feature_enabled !== 0 && p.tour_enabled === 1 && p.tour_url && (
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="font-display text-2xl text-navy">Visite virtuelle 3D</h2>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-widest bg-gold/20 text-navy rounded font-semibold">Exclusivité</span>
                </div>
                <div className="rounded-2xl overflow-hidden border border-border bg-secondary aspect-video">
                  <iframe src={p.tour_url} className="w-full h-full" allow="xr-spatial-tracking; gyroscope; accelerometer; fullscreen" allowFullScreen />
                </div>
                <p className="text-xs text-muted-foreground mt-2">Immergez-vous dans le bien depuis chez vous, à 360°.</p>
              </div>
            )}

            {p.agent && (
              <div className="rounded-2xl border border-border bg-secondary/40 p-6 flex items-center gap-5">
                <img src={p.agent.photo} alt={p.agent.name} className="h-20 w-20 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-widest text-gold font-semibold">Votre conseiller</div>
                  <div className="font-display text-xl text-navy">{p.agent.name}</div>
                  <div className="text-sm text-muted-foreground">{p.agent.speciality}</div>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-navy/80">
                    <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gold" /> {p.agent.phone}</span>
                    <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gold" /> {p.agent.email}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT — contact */}
          <aside className="lg:col-span-2 lg:sticky lg:top-28 self-start">
            <ContactForm propertyId={p.id} propertyTitle={p.title} whatsapp={agency.whatsapp} />
          </aside>
        </div>
      </section>
      <Footer />
    </>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border p-4 bg-white">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground"><Icon className="h-4 w-4 text-gold" /> {label}</div>
      <div className="mt-2 font-display text-2xl text-navy">{value}</div>
    </div>
  );
}
