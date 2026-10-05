import { DOCS } from '@/data/seed';
import { DocumentView } from './DocumentView';

export function generateStaticParams() {
  return [...DOCS.map((d) => ({ id: d.id })), { id: 'draft' }];
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DocumentView id={id} />;
}
