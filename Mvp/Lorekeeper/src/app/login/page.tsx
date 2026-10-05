'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, ShieldCheck, Sparkles, Quote } from 'lucide-react';
import { api } from '@/lib/api';
import { Logo } from '@/shell/ui';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('maya.ellison@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const switchMode = (m: 'in' | 'up') => {
    setMode(m);
    setError('');
    setName('');
    setEmail(m === 'in' ? 'maya.ellison@example.com' : '');
    setPassword(m === 'in' ? 'Welcome2026!' : '');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (mode === 'in') await api.login(email, password);
      else await api.signup(name, email, password);
      localStorage.setItem('lk_in', '1');
      if (mode === 'up') localStorage.setItem('lk_tour_offer', '1');
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue');
      setBusy(false);
    }
  };

  const up = mode === 'up';
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-10">
        <form onSubmit={submit} noValidate className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <Logo size={40} />
            <span className="font-serif text-2xl font-semibold tracking-tight">Lorekeeper</span>
          </div>
          <h1 className="text-3xl font-semibold">{up ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mt-1 text-sm text-ink-500">
            {up ? 'Join your team’s workspace to ask questions across its documents.' : 'Sign in to ask questions across your team’s documents.'}
          </p>
          {up && (
            <label className="mt-6 block text-sm font-medium">Full name
              <input className="input mt-1.5" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Sara Lindgren" />
            </label>
          )}
          <label className={`${up ? 'mt-4' : 'mt-6'} block text-sm font-medium`}>Work email
            <input className="input mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" placeholder="you@company.com" />
          </label>
          <label className="mt-4 block text-sm font-medium">Password
            <input className="input mt-1.5" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={up ? 'new-password' : 'current-password'} placeholder={up ? 'At least 8 characters' : undefined} />
          </label>
          {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <button className="btn-primary mt-6 w-full py-2.5" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} {up ? 'Create account' : 'Sign in'}
          </button>
          <p className="mt-5 text-center text-sm text-ink-500">
            {up ? 'Already have an account?' : 'New to Lorekeeper?'}{' '}
            <button type="button" onClick={() => switchMode(up ? 'in' : 'up')} className="font-medium text-brand-700 hover:underline">
              {up ? 'Sign in' : 'Create an account'}
            </button>
          </p>
          <p className="mt-3 text-center text-xs text-ink-400">Harbor &amp; Pine Consulting · Internal workspace</p>
        </form>
      </div>
      <div className="relative hidden flex-col justify-center overflow-hidden paper-lines bg-[#7f1d2b] px-14 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#c99a2e]/20" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-[#521520]/70" />
        <div className="relative max-w-md">
          <div className="mb-5 h-1 w-14 bg-[#e0b04a]" />
          <h2 className="text-4xl font-semibold leading-tight">Every answer, with its source.</h2>
          <p className="mt-4 font-serif text-lg leading-relaxed text-[#f3dede]">Policies, guides and client notes in one place. Ask in plain language and see exactly which document and passage the answer came from.</p>
          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex gap-3"><Quote className="mt-0.5 h-5 w-5 shrink-0 text-[#e0b04a]" /> Numbered citations open the original passage</li>
            <li className="flex gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#e0b04a]" /> Says so when something isn&apos;t in your documents</li>
            <li className="flex gap-3"><Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#e0b04a]" /> Draft client updates from what you already know</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
