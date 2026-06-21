'use client';
import { useParams } from 'next/navigation';
import ClientDetail from '@/components/admin/ClientDetail';

export default function Page() {
  const { id } = useParams();
  return <ClientDetail apiBase="/api/admin/clients" invoicesApiBase="/api/admin/invoices" backHref="/admin/clients" id={id} />;
}
