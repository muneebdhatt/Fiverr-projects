'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ListChecks, MessageSquareQuote, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/store';
import { Field, Logo, Waveform } from '@/shell/ui';

export default function LoginPage() {
  const router = useRouter();
  const signIn = useApp((s) => s.signIn);
  const [email, setEmail] = useState('elena.marsh@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const go = () => {
    setBusy(true);
    setTimeout(() => {
      signIn(email.toLowerCase().includes('tomas') ? 'admin' : 'member');
      router.push('/home');
    }, 600);
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-ink-900 p-12 text-white lg:flex">
        <Logo size={36} dark />
        <div>
          <h1 className="font-display text-5xl font-medium leading-[1.1]">Every meeting,<br />written up before you&rsquo;re back at your desk.</h1>
          <p className="mt-4 max-w-md text-lg text-ink-300">Summaries, decisions and action items with owners and due dates. Ask any meeting a question and get the answer with the moment it was said.</p>
          <ul className="mt-8 space-y-3 text-ink-200">
            <li className="flex items-center gap-3"><Sparkles size={20} className="text-brand-400" /> A clear summary in under a minute</li>
            <li className="flex items-center gap-3"><ListChecks size={20} className="text-brand-400" /> Action items your team can track</li>
            <li className="flex items-center gap-3"><MessageSquareQuote size={20} className="text-brand-400" /> Answers that cite the exact moment</li>
          </ul>
          <div className="mt-10 max-w-md"><Waveform bars={64} height={56} seed={3} progress={0.58} /></div>
        </div>
        <p className="text-sm text-ink-400">Trusted by 4,200 teams to stop re-asking &ldquo;what did we decide?&rdquo;</p>
      </section>

      <section className="flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <h2 className="font-display text-3xl font-semibold text-ink-900">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-500">Sign in to see your latest meeting notes.</p>

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
          <p className="mt-8 text-center text-xs text-ink-400">Ashgrove Studio workspace · Protected by single sign-on</p>
        </div>
      </section>
    </main>
  );
}
