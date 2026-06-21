import AgentLayoutClient from './AgentLayoutClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AgentLayout({ children }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login?callbackUrl=/agent');
  if (!['agent', 'admin'].includes(session.user?.role)) redirect('/');
  return <AgentLayoutClient>{children}</AgentLayoutClient>;
}
