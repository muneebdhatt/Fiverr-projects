'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowRight, CheckCheck, Eye, EyeOff } from 'lucide-react';
import { PERSONAS } from '@/data/seed';
import { findAccount } from '@/lib/accounts';
import { homeFor, useApp, useReady } from '@/lib/store';
import { Field, Logo } from '@/shell/ui';

const STATS = [
  ['6 min', 'median time to fill'],
  ['12', 'workers texted per shift'],
  ['$0', 'per-shift fees'],
];

export default function LoginPage() {
  const router = useRouter();
  const ready = useReady();
  const authed = useApp((s) => s.authed);
  const persona = useApp((s) => s.persona);
  const login = useApp((s) => s.login);
  const [email, setEmail] = useState('marcus.bell@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && authed) router.replace(homeFor(persona));
  }, [ready, authed, persona, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = PERSONAS.find((x) => x.email === email.trim().toLowerCase());
    const acct = !p ? findAccount(email, password) : undefined;
    if (acct) {
      setError('');
      setBusy(true);
      setTimeout(() => { login('worker', { meId: acct.id }); router.push(homeFor('worker')); }, 650);
      return;
    }
    if (!p || password !== p.password) {
      setError('That email and password do not match. Please try again.');
      return;
    }
    setError('');
    setBusy(true);
    setTimeout(() => {
      login(p.id);
      router.push(homeFor(p.id));
    }, 650);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo size={30} />
          <div className="flex items-center gap-1 text-sm font-semibold">
            <Link href="/worker-signup" prefetch={false} className="rounded-lg px-3 py-2 text-ink-600 transition hover:bg-ink-100 hover:text-ink-900">Find shifts</Link>
            <Link href="/business-signup" prefetch={false} className="btn-primary">Start hiring</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
        <section>
          <span className="chip bg-brand-50 text-brand-700">Same-day staffing by text</span>
          <h1 className="mt-5 text-4xl leading-[1.08] text-ink-900 sm:text-5xl lg:text-[3.4rem]">
            Fill an empty shift in minutes, not hours.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink-600">Post the shift once. Shiftwire texts the nearest qualified workers and the first YES gets it. Everyone else is told it is gone.</p>

          <div className="mt-8 grid max-w-lg grid-cols-3 gap-4">
            {STATS.map(([v, l]) => (
              <div key={l}>
                <p className="font-display text-2xl font-bold text-ink-900">{v}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-500">{l}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 max-w-md rounded-2xl border border-ink-200 bg-white p-4 shadow-card">
            <div className="space-y-2.5 text-sm">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-ink-100 px-3.5 py-2.5 text-ink-800">
                <p className="mb-0.5 text-[11px] font-medium text-ink-500">Cedar &amp; Pine Events</p>
                Bartender needed tonight, 6:00 PM to 11:00 PM at $24/hr. Reply YES to claim it.
              </div>
              <div className="ml-auto w-fit rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2 font-semibold text-white">YES</div>
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm bg-ink-100 px-3.5 py-2.5 text-ink-800">
                <p className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-emerald-700"><CheckCheck size={12} />Shiftwire · 4.2 seconds later</p>
                Confirmed. You are booked. Reminder coming 2 hours before.
              </div>
            </div>
          </div>
        </section>

        <section>
          <form onSubmit={submit} className="card mx-auto w-full max-w-md p-6 shadow-lg sm:p-8">
            <h2 className="text-2xl font-bold">Welcome back</h2>
            <p className="mt-1 text-sm text-ink-500">Sign in to Shiftwire.</p>
            <div className="mt-6 space-y-4">
              <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
              <Field label="Password">
                <div className="relative">
                  <input className="input pr-10" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
              {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
              <button className="btn-primary w-full py-2.5" disabled={busy}>
                {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</> : <>Sign in<ArrowRight size={16} /></>}
              </button>
            </div>
            <div className="mt-6 grid gap-2 border-t border-ink-100 pt-6 sm:grid-cols-2">
              <Link href="/business-signup" prefetch={false} className="btn-ghost">Start hiring</Link>
              <Link href="/worker-signup" prefetch={false} className="btn-ghost">Find shifts</Link>
            </div>
          </form>
          <p className="mt-5 text-center text-xs text-ink-400">© 2026 Shiftwire, Inc. All rights reserved.</p>
        </section>
      </main>
    </div>
  );
}
