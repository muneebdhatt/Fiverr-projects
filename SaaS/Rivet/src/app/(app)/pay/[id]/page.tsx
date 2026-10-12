import { INVOICES, NEXT_NUMBER } from '@/data/build';
import PayView from './PayView';

export function generateStaticParams() {
  return [...INVOICES.map((i) => i.id), ...Array.from({ length: 40 }, (_, k) => `invn${NEXT_NUMBER + k}`)].map((id) => ({ id }));
}

export default async function PayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PayView key={id} id={id} />;
}
