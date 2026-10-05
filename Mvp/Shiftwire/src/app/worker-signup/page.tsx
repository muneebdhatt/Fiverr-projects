'use client';
import clsx from 'clsx';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ArrowLeft, Check, CheckCircle2, FileText, ShieldCheck, UploadCloud, X } from 'lucide-react';
import { ROLES } from '@/data/seed';
import type { Role } from '@/data/types';
import { DAYS } from '@/lib/format';
import { useApp } from '@/lib/store';
import { addAccount, emailTaken } from '@/lib/accounts';
import { PERSONAS } from '@/data/seed';
import { PhoneFrame } from '@/shell/PhoneFrame';
import { Avatar, Field, Logo, Toaster } from '@/shell/ui';

const TOTAL = 4;

export default function WorkerSignup() {
  const router = useRouter();
  const login = useApp((s) => s.login);
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState('(503) 555-0199');
  const [code, setCode] = useState('');
  const [name, setName] = useState('Alex Morgan');
  const [email, setEmail] = useState('alex.morgan@example.com');
  const [password, setPassword] = useState('Welcome2026!');
  const [accountId, setAccountId] = useState('');
  const [skills, setSkills] = useState<Role[]>(['Server', 'Bartender']);
  const [licence, setLicence] = useState('Alcohol Server Permit');
  const [days, setDays] = useState<string[]>(['Thu', 'Fri', 'Sat', 'Sun']);
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const mail = email.trim().toLowerCase();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
  const emailBusy = emailOk && (PERSONAS.some((p) => p.email === mail) || emailTaken(mail));
  const next = (ms = 500) => { setBusy(true); setTimeout(() => { setBusy(false); setStep((s) => s + 1); }, ms); };

  return (
    <div className="min-h-screen bg-ink-100 py-0 sm:py-10">
      <PhoneFrame>
        <div className="flex items-center gap-2 px-5 pb-3 pt-4">
          {step > 0 && step < 4 ? (
            <button onClick={() => setStep(step - 1)} className="rounded-md p-1 text-ink-500 hover:bg-ink-100" aria-label="Back"><ArrowLeft size={18} /></button>
          ) : (
            <Link prefetch={false} href="/" className="rounded-md p-1 text-ink-500 hover:bg-ink-100" aria-label="Back to sign in"><ArrowLeft size={18} /></Link>
          )}
          <Logo size={24} />
          {step < 4 && <span className="ml-auto text-xs font-medium text-ink-500">Step {step + 1} of {TOTAL}</span>}
        </div>
        {step < 4 && (
          <div className="mx-5 h-1.5 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${((step + 1) / TOTAL) * 100}%` }} /></div>
        )}

        <div className="flex flex-1 flex-col px-5 pb-6 pt-5">
          {step === 0 && (
            <div className="pop flex flex-1 flex-col">
              <h1 className="text-2xl font-semibold tracking-tight">Get shift offers by text</h1>
              <p className="mt-2 text-sm text-ink-500">Nearby venues text you when they need cover. Reply YES to claim it. No apps to check.</p>
              <div className="mt-8"><Field label="Mobile number"><input className="input text-base" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field></div>
              <p className="mt-3 text-xs text-ink-500">We will send a 6-digit code. Message and data rates may apply.</p>
              <button className="btn-primary mt-auto w-full py-3" disabled={busy || phone.replace(/\D/g, '').length < 10} onClick={() => next()}>
                {busy ? 'Sending code…' : 'Send code'}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="pop flex flex-1 flex-col">
              <h1 className="text-2xl font-semibold tracking-tight">Enter your code</h1>
              <p className="mt-2 text-sm text-ink-500">We texted a 6-digit code to {phone}.</p>
              <input
                className="input mt-8 text-center text-2xl tracking-[0.5em]"
                inputMode="numeric"
                maxLength={6}
                placeholder="······"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoFocus
              />
              <button className="mt-3 self-center text-sm font-medium text-brand-700 hover:underline" onClick={() => useApp.getState().toast('A new code is on its way', 'info')}>Resend code</button>
              <button className="btn-primary mt-auto w-full py-3" disabled={busy || code.length !== 6} onClick={() => next()}>
                {busy ? 'Verifying…' : 'Verify'}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="pop flex flex-1 flex-col">
              <h1 className="text-2xl font-semibold tracking-tight">Your worker profile</h1>
              <div className="mt-5 rounded-2xl border border-ink-100 bg-ink-50 p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={name || 'New Worker'} size={48} />
                  <div className="min-w-0 flex-1">
                    <input className="w-full bg-transparent text-base font-semibold outline-none" value={name} onChange={(e) => setName(e.target.value)} aria-label="Full name" />
                    <p className="text-xs text-ink-500">{phone} · Portland area</p>
                  </div>
                </div>
                <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((r) => (
                    <button key={r} onClick={() => setSkills(toggle(skills, r))} className={clsx('rounded-full border px-3 py-1 text-xs font-medium transition', skills.includes(r) ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-100')}>{r}</button>
                  ))}
                </div>
                <div className="mt-4 space-y-3"><Field label="Email" hint={emailBusy ? 'That email is already in use. Try another.' : undefined}><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" /></Field><Field label="Password" hint={password.length < 8 ? 'At least 8 characters.' : undefined}><input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" /></Field></div>
                <div className="mt-4"><Field label="Licence or certificate"><input className="input" value={licence} onChange={(e) => setLicence(e.target.value)} /></Field></div>
                <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Usually available</p>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map((d) => (
                    <button key={d} onClick={() => setDays(toggle(days, d))} className={clsx('rounded-lg py-2 text-xs font-medium transition', days.includes(d) ? 'bg-brand-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-100')}>{d.slice(0, 2)}</button>
                  ))}
                </div>
              </div>
              <button className="btn-primary mt-auto w-full py-3" disabled={busy || !name.trim() || skills.length === 0 || !emailOk || emailBusy || password.length < 8} onClick={() => next(400)}>Continue</button>
            </div>
          )}

          {step === 3 && (
            <div className="pop flex flex-1 flex-col">
              <h1 className="text-2xl font-semibold tracking-tight">Upload your certificate</h1>
              <p className="mt-2 text-sm text-ink-500">Businesses see a Verified badge once your document is checked.</p>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFile({ name: f.name, size: f.size > 1048576 ? `${(f.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB` });
              }} />
              {!file ? (
                <button onClick={() => fileRef.current?.click()} className="mt-6 flex flex-col items-center rounded-2xl border-2 border-dashed border-ink-200 px-4 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50">
                  <UploadCloud className="text-brand-600" size={28} />
                  <span className="mt-2 text-sm font-medium">Tap to choose a file</span>
                  <span className="text-xs text-ink-500">PDF, JPG or PNG up to 10 MB</span>
                </button>
              ) : (
                <div className="mt-6 flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3 shadow-card">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700"><FileText size={20} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{file.name}</span><span className="text-xs text-ink-500">{file.size} · Ready to submit</span></span>
                  <button onClick={() => setFile(null)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100" aria-label="Remove file"><X size={16} /></button>
                </div>
              )}
              <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-ink-700">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-[#0a7587]" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree to receive shift offers by text message from Shiftwire and the businesses I match with. I can reply STOP at any time.</span>
              </label>
              <button className="btn-primary mt-auto w-full py-3" disabled={busy || !consent || !file} onClick={() => { const id = `wa-${Date.now()}`; addAccount({ id, name: name.trim(), email: mail, password, phone, skills, licence, days, fileName: file!.name }); setAccountId(id); next(700); }}>{busy ? 'Submitting…' : 'Finish sign-up'}</button>
            </div>
          )}

          {step === 4 && (
            <div className="pop flex flex-1 flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><CheckCircle2 size={34} /></span>
              <h1 className="mt-5 text-2xl font-semibold tracking-tight">You are on the list</h1>
              <p className="mt-2 text-sm text-ink-500">Welcome, {name.split(' ')[0]}. Your certificate is being checked. Offers can start arriving right away.</p>
              <div className="mt-6 w-full space-y-2 text-left text-sm">
                {['Number verified', 'Account created', 'Certificate received', 'Text consent saved'].map((t) => (
                  <p key={t} className="flex items-center gap-2 text-ink-700"><Check size={16} className="text-emerald-600" />{t}</p>
                ))}
              </div>
              <p className="mt-4 w-full rounded-xl bg-ink-50 p-3 text-left text-xs text-ink-600">Sign in any time with <span className="font-semibold text-ink-800">{mail}</span> and the password you chose.</p>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-500"><ShieldCheck size={14} />Reply STOP to any text to opt out.</p>
              <button className="btn-primary mt-auto w-full py-3" onClick={() => { login('worker', { meId: accountId }); router.push('/offers'); }}>Open my offers</button>
            </div>
          )}
        </div>
      </PhoneFrame>
      <Toaster />
    </div>
  );
}
