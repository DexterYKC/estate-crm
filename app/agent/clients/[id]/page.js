'use client';
import { useParams } from 'next/navigation';
import ClientDetail from '@/components/admin/ClientDetail';

export default function Page() {
  const { id } = useParams();
  return <ClientDetail apiBase="/api/agent/clients" invoicesApiBase="/api/agent/invoices" backHref="/agent/clients" id={id} />;
}
