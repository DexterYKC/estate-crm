import ClientsList from '@/components/admin/ClientsList';

export default function Page() {
  return <ClientsList apiBase="/api/agent/clients" basePath="/agent/clients" />;
}
