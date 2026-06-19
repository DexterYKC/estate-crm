import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import AccountTabs from './AccountTabs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AccountLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/mon-compte');
  return (
    <>
      <Navbar />
      <section className="bg-secondary/40 border-b border-border">
        <div className="container py-12">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Mon espace</div>
          <h1 className="font-display text-3xl md:text-4xl text-navy mt-1">Bonjour {session.user.name?.split(' ')[0]}</h1>
          <p className="mt-2 text-muted-foreground text-sm">Bienvenue dans votre espace personnel.</p>
        </div>
      </section>
      <AccountTabs />
      <main className="container py-10 min-h-[50vh]">{children}</main>
      <Footer />
    </>
  );
}
