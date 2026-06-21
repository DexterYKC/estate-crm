'use client';
import useSWR from 'swr';
import PropertyForm from '../../PropertyForm';
import Loading from '@/components/ui/loading';

const fetcher = (u) => fetch(u).then(r => r.json());

export default function Page({ params }) {
  const { data } = useSWR(`/api/admin/properties/${params.id}`, fetcher);
  if (!data) return <Loading className="p-10" />;
  return <PropertyForm mode="edit" initial={data} />;
}
