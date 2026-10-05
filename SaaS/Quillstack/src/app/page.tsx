'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { PERSONAS } from '@/data/seed';
import { hashPw } from '@/lib/hash';
import { useApp, useReady } from '@/lib/store';
import { AuthShell } from '@/shell/AuthShell';
import { Field } from '@/shell/ui';

export default function LoginPage() {
  const router = useRouter();
  const ready = useReady();
  const authed = useApp((s) => s.authed);
  const login = useApp((s) => s.login);
  const actAsInvitee = useApp((s) => s.actAsInvitee);
  const [email, setEmail] = useState('priya.raman@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && authed) router.replace('/dashboard');
  }, [ready, authed, router]);

  function enter(go: () => void) {
    setError('');
    setBusy(true);
    setTimeout(() => { go(); router.push('/dashboard'); }, 650);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const typed = email.trim().toLowerCase();
    const state = useApp.getState();
    const persona = PERSONAS.find((p) => p.email === typed);
    if (persona && password === persona.password) return enter(() => login(persona.id));

    // Someone who has been invited signs in as themselves, keeping the workspace as it is.
    const invited = Object.entries(state.invited).flatMap(([orgId, us]) => us.map((u) => ({ orgId, u }))).find((x) => x.u.email === typed);
    if (!persona && invited && password === 'Welcome2026!') return enter(() => actAsInvitee(invited.orgId, invited.u.id, invited.u.role));

    // The owner of an organisation created in this visit: a signed-up account uses its own password.
    const owned = state.customOrgs.find((c) => c.ownerEmail === typed);
    if (!persona && owned) {
      const chosen = state.accounts[typed];
      const ok = chosen ? hashPw(password) === chosen : password === 'Welcome2026!';
      if (ok) return enter(() => actAsInvitee(owned.id, `${owned.id}-u0`, 'Owner'));
    }
    setError('That email and password do not match. Please try again.');
  }

  return (
    <AuthShell>
      <form onSubmit={submit}>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in to your workspace.</p>
        <div className="mt-8 space-y-4">
          <Field label="Work email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
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
            {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Signing in…</> : 'Sign in'}
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-ink-500">New to Quillstack? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link></p>
      </form>
    </AuthShell>
  );
}
