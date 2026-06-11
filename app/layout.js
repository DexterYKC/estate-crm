import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import Providers from '@/components/Providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair', display: 'swap' });

export const metadata = {
  title: 'Prestige Immobilier — Agence immobilière de prestige',
  description: "Découvrez notre sélection exclusive d'appartements, maisons, villas et biens d'exception. Achat, vente et location de prestige en France.",
};

export default async function RootLayout({ children }) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="fr" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers session={session}>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
