import AdminLayoutClient from './AdminLayoutClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'admin') redirect('/login?callbackUrl=/admin');
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
