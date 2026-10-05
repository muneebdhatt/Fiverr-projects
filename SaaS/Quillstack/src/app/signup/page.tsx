'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Check, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
import { INDUSTRIES, PERSONAS, USERS } from '@/data/seed';
import { passwordStrength } from '@/lib/hash';
import { useApp, useReady } from '@/lib/store';
import { AuthShell } from '@/shell/AuthShell';
import { Field, Modal } from '@/shell/ui';

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const BARS = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'];

export default function SignUpPage() {
  const router = useRouter();
  const ready = useReady();
  const authed = useApp((s) => s.authed);
  const signUp = useApp((s) => s.signUp);
  const toast = useApp((s) => s.toast);
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '', industry: INDUSTRIES[0] });
  const [terms, setTerms] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<'terms' | 'privacy' | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form | 'terms', string>>>({});

  useEffect(() => {
    if (ready && authed && !busy) router.replace('/dashboard');
  }, [ready, authed, busy, router]);

  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };
  const strength = form.password ? passwordStrength(form.password) : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const state = useApp.getState();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const orgName = form.orgName.trim();
    const next: typeof errors = {};

    const takenEmails = new Set<string>([
      ...PERSONAS.map((p) => p.email),
      ...Object.values(USERS).flat().map((u) => u.email),
      ...Object.values(state.invited).flat().map((u) => u.email),
      ...state.customOrgs.map((c) => c.ownerEmail),
    ]);
    if (name.length < 2) next.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid work email address.';
    else if (takenEmails.has(email)) next.email = 'An account with this email already exists. Try signing in instead.';
    if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (!orgName) next.orgName = 'Enter your organisation name.';
    else if (state.customOrgs.some((c) => c.name.toLowerCase() === orgName.toLowerCase()) || ['northwind studio', 'bluepeak legal'].includes(orgName.toLowerCase())) next.orgName = 'That organisation name is already taken.';
    if (!terms) next.terms = 'Please accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    setTimeout(() => {
      signUp({ name, email, password: form.password, orgName, industry: form.industry });
      toast(`Welcome to Quillstack, ${name.split(' ')[0]}`);
      router.push('/dashboard');
    }, 900);
  }

  return (
    <AuthShell>
      <form onSubmit={submit} noValidate>
        <h1 className="text-2xl font-semibold tracking-tight">Create your workspace</h1>
        <p className="mt-1 text-sm text-ink-500">Free to start on the Starter plan. Upgrade whenever your team grows.</p>
        <div className="mt-7 space-y-4">
          <Field label="Full name">
            <input className={clsx('input', errors.name && 'border-red-400')} value={form.name} onChange={(e) => set('name', e.target.value)} autoComplete="name" placeholder="Alex Morgan" />
            {errors.name && <span className="mt-1 block text-xs text-red-600">{errors.name}</span>}
          </Field>
          <Field label="Work email">
            <input className={clsx('input', errors.email && 'border-red-400')} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} autoComplete="email" placeholder="alex@yourcompany.com" />
            {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email}</span>}
          </Field>
          <Field label="Password">
            <div className="relative">
              <input className={clsx('input pr-10', errors.password && 'border-red-400')} type={show ? 'text' : 'password'} value={form.password} onChange={(e) => set('password', e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" aria-label={show ? 'Hide password' : 'Show password'}>
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {form.password && (
              <span className="mt-2 flex items-center gap-2" aria-live="polite">
                <span className="flex flex-1 gap-1">{[0, 1, 2, 3].map((i) => <span key={i} className={clsx('h-1.5 flex-1 rounded-full', i < strength ? BARS[strength] : 'bg-ink-100')} />)}</span>
                <span className="text-xs text-ink-500">{LABELS[strength]}</span>
              </span>
            )}
            {errors.password && <span className="mt-1 block text-xs text-red-600">{errors.password}</span>}
          </Field>
          <Field label="Organisation name">
            <input className={clsx('input', errors.orgName && 'border-red-400')} value={form.orgName} onChange={(e) => set('orgName', e.target.value)} autoComplete="organization" placeholder="Juniper Accounting" />
            {errors.orgName && <span className="mt-1 block text-xs text-red-600">{errors.orgName}</span>}
          </Field>
          <Field label="What does your team do?">
            <select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)}>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select>
          </Field>
          <div>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-ink-600">
              <input type="checkbox" checked={terms} onChange={(e) => { setTerms(e.target.checked); setErrors((x) => ({ ...x, terms: undefined })); }} className="mt-0.5 h-4 w-4 rounded border-ink-300 accent-brand-600" />
              <span>I agree to the <button type="button" className="font-medium text-brand-600 hover:underline" onClick={(e) => { e.preventDefault(); setLegal('terms'); }}>Terms of Service</button> and <button type="button" className="font-medium text-brand-600 hover:underline" onClick={(e) => { e.preventDefault(); setLegal('privacy'); }}>Privacy Policy</button>.</span>
            </label>
            {errors.terms && <span className="mt-1 block text-xs text-red-600">{errors.terms}</span>}
          </div>
          <button className="btn-primary w-full py-2.5" disabled={busy}>
            {busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Creating your workspace…</> : 'Create account'}
          </button>
        </div>
        <ul className="mt-5 space-y-1.5 text-xs text-ink-500">
          {['No card needed to start', '300 AI credits every month', 'Invite teammates whenever you are ready'].map((t) => (
            <li key={t} className="flex items-center gap-2"><Check size={13} className="text-emerald-500" />{t}</li>
          ))}
        </ul>
        <p className="mt-6 text-center text-sm text-ink-500">Already have an account? <Link href="/" className="font-medium text-brand-600 hover:underline">Sign in</Link></p>
      </form>
      <Modal open={legal !== null} onClose={() => setLegal(null)} title={legal === 'privacy' ? 'Privacy Policy' : 'Terms of Service'} width="max-w-lg">
        <div className="space-y-3 text-sm leading-6 text-ink-600">
          {legal === 'privacy' ? (
            <>
              <p>We collect only what we need to run your workspace: your name, work email and the documents you choose to add.</p>
              <p>Your documents are used to give you summaries, rewrites and translations. We do not sell your data or use it to advertise to you.</p>
              <p>You can ask us to export or delete your organisation&apos;s data at any time from the Organisation page or by contacting support.</p>
            </>
          ) : (
            <>
              <p>By creating an account you agree to use Quillstack for lawful business purposes and to keep your sign-in details to yourself.</p>
              <p>You are responsible for the documents and teammates you add. Plans renew monthly and can be changed or cancelled from the Billing page.</p>
              <p>We may suspend a workspace that is used to harm others or that breaks these terms.</p>
            </>
          )}
        </div>
        <div className="mt-5 flex justify-end"><button className="btn-primary" onClick={() => setLegal(null)}>Got it</button></div>
      </Modal>
    </AuthShell>
  );
}
