'use client';
import { useApp } from '@/lib/store';
import { PageSkeleton, useLoading } from '@/shell/ui';
import ClientHome from './ClientHome';
import MemberHome from './MemberHome';
import OwnerHome from './OwnerHome';

export default function HomePage() {
  const role = useApp((s) => s.role);
  const loading = useLoading(`home-${role}`);
  if (loading) return <PageSkeleton />;
  return role === 'client' ? <ClientHome /> : role === 'member' ? <MemberHome /> : <OwnerHome />;
}
