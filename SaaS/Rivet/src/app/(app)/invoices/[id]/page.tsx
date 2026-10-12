import { INVOICES, NEXT_NUMBER } from '@/data/build';
import InvoiceView from './InvoiceView';

// Invoices created during a visit get ids invn<number>, so reserve a block of them.
export function generateStaticParams() {
  return [...INVOICES.map((i) => i.id), ...Array.from({ length: 40 }, (_, k) => `invn${NEXT_NUMBER + k}`)].map((id) => ({ id }));
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceView key={id} id={id} />;
}
