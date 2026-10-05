'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Monitor, ShieldCheck } from 'lucide-react';
import { PASSWORD, PERSONAS } from '@/data/seed';
import { useApp, useHydrated } from '@/lib/store';
import { Frond } from '@/shell/FernArt';
import { Logo } from '@/shell/ui';

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const authed = useApp((s) => s.authed);
  const login = useApp((s) => s.login);
  const [email, setEmail] = useState(PERSONAS[0].email);
  const [password, setPassword] = useState(PASSWORD);
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hydrated && authed) router.replace('/queue');
  }, [hydrated, authed, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = PERSONAS.find((x) => x.email === email.trim().toLowerCase());
    if (!p || password !== PASSWORD) {
      setError('That email and password do not match. Please try again.');
      return;
    }
    setError('');
    setBusy(true);
    setTimeout(() => {
      login(p.id);
      router.push('/queue');
    }, 450);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0d0c0a] via-[#2a200c] to-[#5a4210] p-12 text-[#faf7ee] lg:flex lg:flex-col lg:justify-between">
        <Frond className="absolute -bottom-28 -left-24 h-[440px] rotate-[18deg]" color="#a07620" />
        <Frond className="absolute -right-6 top-10 h-[420px] -rotate-[24deg]" color="#886118" leaflets={12} />
        <Frond className="absolute -bottom-6 right-16 h-[240px] rotate-[8deg]" color="#bc9234" opacity={0.55} leaflets={10} />
        <Logo tone="light" />
        <div className="relative max-w-md">
          <p className="font-display text-5xl leading-[1.05]">Calmer waiting rooms, clearer handovers.</p>
          <p className="mt-5 text-base text-[#e8d08c]">Patients check in on a tablet in two minutes. Your team opens the queue and finds a plain-language summary and anything that needs a nurse first.</p>
          <div className="mt-8 flex flex-wrap gap-3 text-sm font-semibold text-[#f5e8c4]">
            <span className="flex items-center gap-2 rounded-full bg-[#886118]/70 px-3.5 py-2"><ShieldCheck size={16} />Every open is logged</span>
            <span className="flex items-center gap-2 rounded-full bg-[#886118]/70 px-3.5 py-2">Role-based views</span>
          </div>
        </div>
        <p className="relative text-xs text-[#d6b25a]">Alder Street Health · Front desk and care team access</p>
      </section>

      <section className="flex flex-col justify-center px-6 py-10 sm:px-14">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden"><Logo /></div>
          <p className="eyebrow">Staff sign in</p>
          <h1 className="mt-2 font-display text-5xl leading-none text-heading">Welcome back</h1>
          <p className="mt-3 text-sm text-bark-500">Sign in to see today&apos;s queue.</p>
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="label">Work email</label>
              <input id="email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input id="password" type={show ? 'text' : 'password'} className="field pr-11" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            {error && <p role="alert" className="rounded-xl bg-coral-50 px-3.5 py-2.5 text-sm font-medium text-coral-700">{error}</p>}
            <button className="btn-primary w-full py-3 text-base" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <div className="mt-8 flex items-center gap-3 text-xs text-bark-400"><span className="h-px flex-1 bg-bone-300" />At the front desk?<span className="h-px flex-1 bg-bone-300" /></div>
          <Link href="/kiosk" className="btn-ghost mt-4 w-full py-3"><Monitor size={17} />Open the patient check-in screen</Link>
        </div>
      </section>
    </div>
  );
}
