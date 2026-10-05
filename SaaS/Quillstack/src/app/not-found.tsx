import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/shell/ui';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 px-6 text-center">
      <Logo />
      <span className="mt-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Compass size={26} /></span>
      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-ink-900">We could not find that page</h1>
      <p className="mt-2 max-w-md text-ink-600">The link may be out of date, or the document may have been deleted. Head back to your workspace and carry on.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/dashboard" className="btn-primary">Go to dashboard</Link>
        <Link href="/documents" className="btn-ghost">Open documents</Link>
      </div>
    </div>
  );
}
