import ClientsList from '@/components/admin/ClientsList';

export default function Page() {
  return <ClientsList apiBase="/api/admin/clients" basePath="/admin/clients" />;
}
