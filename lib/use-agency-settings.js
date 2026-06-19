'use client';
import useSWR from 'swr';

const fetcher = (u) => fetch(u).then(r => r.json());

export function useAgencySettings() {
  const { data } = useSWR('/api/agency', fetcher);
  return {
    agency: data,
    tourFeatureEnabled: data ? data.tour_feature_enabled !== 0 && data.tour_feature_enabled !== false : true,
    invoicesEnabled: data ? data.invoices_enabled !== 0 && data.invoices_enabled !== false : true,
  };
}
