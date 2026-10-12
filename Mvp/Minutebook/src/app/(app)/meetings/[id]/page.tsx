import { LATEST, MEETINGS } from '@/data';
import MeetingView from './MeetingView';

export function generateStaticParams() {
  return [...MEETINGS, LATEST].map((m) => ({ id: m.id }));
}

export default async function MeetingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MeetingView key={id} id={id} />;
}
