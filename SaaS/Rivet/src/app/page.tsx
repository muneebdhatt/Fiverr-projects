'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Clock, Eye, EyeOff, FileText, Users } from 'lucide-react';
import { useApp, type Role } from '@/lib/store';
import { Field, Logo } from '@/shell/ui';

export default function LoginPage() {
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const [email, setEmail] = useState('maya.okafor@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = () => {
    setBusy(true);
    const e = email.toLowerCase();
    const role: Role = e.includes('priya') ? 'member' : e.includes('isabel') ? 'client' : 'owner';
    setTimeout(() => {
      signIn(role);
      router.push('/home');
    }, 600);
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <Logo size={36} dark />
        <div>
          <h1 className="font-display text-5xl font-bold leading-[1.08]">Run the agency.<br />Keep the client in the loop.</h1>
          <p className="mt-4 max-w-md text-lg text-ink-300">Projects, tracked time and invoices in one place, with a portal where clients approve work and pay without chasing anyone.</p>
          <ul className="mt-8 space-y-3 text-ink-200">
            <li className="flex items-center gap-3"><Clock size={20} className="text-brand-300" /> Track time once, bill it in a click</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-brand-300" /> Approvals that don&rsquo;t get lost in email</li>
            <li className="flex items-center gap-3"><FileText size={20} className="text-brand-300" /> Invoices clients can pay the same day</li>
            <li className="flex items-center gap-3"><Users size={20} className="text-brand-300" /> A portal that only shows each client their own work</li>
          </ul>
        </div>
        <p className="text-sm text-ink-400">Used by 1,900 small agencies to get paid faster.</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="font-display text-3xl font-bold text-ink-900">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-500">Sign in to your workspace.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); go(); }}>
            <Field label="Email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
            <Field label="Password">
              <div className="relative">
                <input className="input pr-11" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </Field>
            <button className="btn-primary w-full py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
          </form>
          <p className="mt-6 text-center text-sm text-ink-500">
            A client of Foxglove Studio?{' '}
            <button type="button" className="font-semibold text-brand-700 hover:underline" onClick={() => setEmail('isabel.moreau@example.com')}>Use the client portal</button>
          </p>
          <p className="mt-8 text-center text-xs text-ink-400">Foxglove Studio workspace · Protected by single sign-on</p>
        </div>
      </section>
    </main>
  );
}
