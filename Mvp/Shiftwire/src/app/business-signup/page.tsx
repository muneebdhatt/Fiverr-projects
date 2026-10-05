'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, Lock } from 'lucide-react';
import { PRICE } from '@/data/seed';
import { dayLabel } from '@/lib/format';
import { useApp } from '@/lib/store';
import { Field, Logo, Toaster } from '@/shell/ui';

const PERKS = [
  'Unlimited shift broadcasts',
  'Text up to 12 matched workers per shift',
  'Worker search with ratings and certificates',
  'Live reply feed and shift history',
  'Automatic opt-out handling',
];

export default function BusinessSignup() {
  const router = useRouter();
  const login = useApp((s) => s.login);
  const [step, setStep] = useState(0);
  const [biz, setBiz] = useState('Cedar & Pine Events');
  const [contact, setContact] = useState('Marcus Bell');
  const [email, setEmail] = useState('marcus.bell@example.com');
  const [phone, setPhone] = useState('(503) 555-0142');
  const [password, setPassword] = useState('Welcome2026!');
  const [terms, setTerms] = useState(false);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('08 / 29');
  const [cvc, setCvc] = useState('123');
  const [zip, setZip] = useState('97205');
  const [busy, setBusy] = useState(false);

  const go = (n: number, ms = 600) => { setBusy(true); setTimeout(() => { setBusy(false); setStep(n); }, ms); };
  const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="flex h-16 items-center gap-3 border-b border-ink-200 bg-white px-5">
        {step > 0 && step < 3 ? (
          <button onClick={() => setStep(step - 1)} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Back"><ArrowLeft size={18} /></button>
        ) : (
          <Link prefetch={false} href="/" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100" aria-label="Back to sign in"><ArrowLeft size={18} /></Link>
        )}
        <Logo size={30} />
        {step < 3 && <span className="ml-auto text-xs font-medium text-ink-500">Step {step + 1} of 3</span>}
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {step === 0 && (
          <form className="pop mx-auto max-w-lg" onSubmit={(e) => { e.preventDefault(); go(1); }}>
            <h1 className="text-2xl font-semibold tracking-tight">Create your business account</h1>
            <p className="mt-1 text-sm text-ink-500">Tell us who is posting shifts. It takes about a minute.</p>
            <div className="card mt-6 space-y-4 p-5">
              <Field label="Business name"><input className="input" value={biz} onChange={(e) => setBiz(e.target.value)} required /></Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name"><input className="input" value={contact} onChange={(e) => setContact(e.target.value)} required /></Field>
                <Field label="Mobile number"><input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} required /></Field>
              </div>
              <Field label="Work email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
              <Field label="Password"><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></Field>
              <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-700">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0a7587]" checked={terms} onChange={(e) => setTerms(e.target.checked)} />
                <span>I agree to the Terms of Service and the Messaging Policy, and confirm my workers have opted in to texts.</span>
              </label>
              <button className="btn-primary w-full py-2.5" disabled={busy || !terms}>{busy ? 'Creating account…' : 'Continue'}</button>
            </div>
          </form>
        )}

        {step === 1 && (
          <div className="pop">
            <div className="mx-auto max-w-lg text-center">
              <h1 className="text-2xl font-semibold tracking-tight">One plan. Every shift covered.</h1>
              <p className="mt-1 text-sm text-ink-500">Cancel any time. Your first charge is today.</p>
            </div>
            <div className="card mx-auto mt-8 max-w-md overflow-hidden">
              <div className="bg-[#0e1a2c] px-6 py-5 text-white">
                <p className="text-sm font-medium text-[#c9eef0]">Shiftwire for business</p>
                <p className="mt-1 flex items-end gap-1"><span className="text-4xl font-semibold">${PRICE}</span><span className="pb-1 text-sm text-[#c9eef0]">/month</span></p>
              </div>
              <ul className="space-y-3 p-6 text-sm">
                {PERKS.map((p) => <li key={p} className="flex items-start gap-2.5"><Check size={17} className="mt-0.5 shrink-0 text-brand-600" />{p}</li>)}
              </ul>
              <div className="px-6 pb-6"><button className="btn-primary w-full py-2.5" onClick={() => go(2, 300)}>Continue to payment</button></div>
            </div>
          </div>
        )}

        {step === 2 && (
          <form className="pop mx-auto grid max-w-3xl gap-6 md:grid-cols-5" onSubmit={(e) => { e.preventDefault(); go(3, 1400); }}>
            <div className="card space-y-4 p-5 md:col-span-3">
              <h1 className="text-lg font-semibold">Payment details</h1>
              <Field label="Card number"><input className="input" inputMode="numeric" autoComplete="off" value={card} onChange={(e) => setCard(fmtCard(e.target.value))} /></Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Expiry"><input className="input" autoComplete="off" value={exp} onChange={(e) => setExp(e.target.value)} /></Field>
                <Field label="CVC"><input className="input" autoComplete="off" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))} /></Field>
                <Field label="ZIP"><input className="input" autoComplete="off" value={zip} onChange={(e) => setZip(e.target.value)} /></Field>
              </div>
              <button className="btn-primary w-full py-2.5" disabled={busy}>{busy ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing payment…</> : <><Lock size={15} />Pay ${PRICE}.00</>}</button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-ink-500"><Lock size={12} />Payments are encrypted and processed securely.</p>
            </div>
            <div className="card h-fit p-5 md:col-span-2">
              <h2 className="text-sm font-semibold">Order summary</h2>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-ink-600">Shiftwire, monthly</span><span>${PRICE}.00</span></div>
                <div className="flex justify-between"><span className="text-ink-600">Tax</span><span>$0.00</span></div>
                <div className="flex justify-between border-t border-ink-100 pt-2 font-semibold"><span>Due today</span><span>${PRICE}.00</span></div>
              </div>
              <p className="mt-4 text-xs text-ink-500">Renews on {dayLabel(30)} for ${PRICE}.00 unless cancelled.</p>
              <p className="mt-3 text-xs text-ink-500">{biz}</p>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="pop mx-auto max-w-md text-center">
            <span className={clsx('mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600')}><CheckCircle2 size={34} /></span>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">Payment received</h1>
            <p className="mt-2 text-sm text-ink-500">{biz} is live on Shiftwire. Your next charge of ${PRICE}.00 is on {dayLabel(30)}. A receipt is on its way to {email}.</p>
            <button className="btn-primary mt-8 px-6 py-2.5" onClick={() => { login('business', { bizName: biz, contactName: contact, nextChargeDays: 30 }); router.push('/post-shift'); }}>Post your first shift</button>
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}
