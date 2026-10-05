import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-display text-6xl text-heading">This page has wandered off</p>
      <p className="mt-3 text-bark-500">Let&apos;s get you back to the queue.</p>
      <Link href="/queue" className="btn-primary mt-6">Go to the queue</Link>
    </div>
  );
}
