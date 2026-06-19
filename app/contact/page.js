import Navbar from '@/components/site/Navbar';
import Footer from '@/components/site/Footer';
import ContactForm from '@/components/site/ContactForm';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';

async function fetchAgency() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const r = await fetch(`${base}/api/agency`, { cache: 'no-store' });
  return r.ok ? r.json() : {};
}

export default async function ContactPage() {
  const a = await fetchAgency();
  const wa = a.whatsapp ? `https://wa.me/${(a.whatsapp || '').replace(/[^0-9]/g, '')}` : '#';
  return (
    <>
      <Navbar />
      <section className="bg-secondary/40 border-b border-border">
        <div className="container py-14">
          <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Nous contacter</div>
          <h1 className="font-display text-3xl md:text-5xl text-navy mt-2">À votre écoute</h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">Notre équipe se tient à votre disposition pour étudier votre projet en toute confidentialité.</p>
        </div>
      </section>
      <section className="container py-16 grid lg:grid-cols-3 gap-10">
        <div className="space-y-6 lg:col-span-1">
          <Info icon={MapPin} title="Adresse" value={a.address} />
          <Info icon={Phone} title="Téléphone" value={a.phone} />
          <Info icon={Mail} title="Email" value={a.email} />
          <Info icon={Clock} title="Horaires" value={'Lun-Ven 9h-19h\nSam 10h-17h'} />
          <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full h-12 rounded-md bg-[#25D366] hover:bg-[#1ebd5b] text-white font-medium transition"><MessageCircle className="h-4 w-4" /> Discuter sur WhatsApp</a>
        </div>
        <div className="lg:col-span-2">
          <ContactForm whatsapp={a.whatsapp} />
        </div>
      </section>
      <Footer />
    </>
  );
}

function Info({ icon: Icon, title, value }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-xl border border-border bg-card">
      <div className="h-11 w-11 rounded-full bg-navy text-gold flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
      <div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{title}</div>
        <div className="mt-1 text-navy whitespace-pre-line">{value}</div>
      </div>
    </div>
  );
}
