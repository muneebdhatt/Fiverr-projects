import { PROJECTS } from '@/data/static';
import ProjectView from './ProjectView';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ id: p.id }));
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectView key={id} id={id} />;
}
