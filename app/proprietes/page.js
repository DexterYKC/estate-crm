import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import PropertyCard from '@/components/site/PropertyCard';
import FiltersBar from './FiltersBar';

export const dynamic = 'force-dynamic';

async function fetchProps(searchParams) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) if (v) sp.set(k, v);
  const res = await fetch(`${base}/api/properties?${sp.toString()}`, { cache: 'no-store' });
  return res.ok ? await res.json() : { items: [], total: 0 };
}

export default async function PropertiesPage({ searchParams }) {
  const data = await fetchProps(searchParams);
  return (
    <>
      <Navbar />
      <section className="bg-secondary/40 border-b border-border">
        <div className="container py-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Catalogue</div>
          <h1 className="font-display text-3xl md:text-5xl text-navy mt-2">Nos propriétés</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Explorez notre sélection de biens à la vente et à la location. Utilisez les filtres pour affiner votre recherche.</p>
        </div>
      </section>
      <section className="container py-10">
        <FiltersBar initial={searchParams} />
        <div className="mt-8 text-sm text-muted-foreground">{data.total} bien{data.total > 1 ? 's' : ''} trouvé{data.total > 1 ? 's' : ''}</div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(data.items || []).map(p => <PropertyCard key={p.id} p={p} />)}
        </div>
        {(!data.items || data.items.length === 0) && (
          <div className="py-24 text-center text-muted-foreground">Aucun bien ne correspond à votre recherche.</div>
        )}
      </section>
      <Footer />
    </>
  );
}
