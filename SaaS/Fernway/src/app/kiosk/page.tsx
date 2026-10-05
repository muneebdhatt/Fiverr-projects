'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowLeft, ArrowRight, Bandage, CalendarCheck, Check, FileText, HeartPulse, Loader2, Pill, Sparkles, Thermometer, Type, UserRound, Lock } from 'lucide-react';
import { REASONS, SYMPTOMS } from '@/data/questions';
import { findReturning } from '@/data/seed';
import type { Patient, Question } from '@/data/types';
import { allergyOf, buildFlags, buildQA, buildSummary, symptomLabel, visibleQuestions, type Answers } from '@/lib/engine';
import { useApp, useHydrated, useNow } from '@/lib/store';
import { useUiPrefs } from '@/lib/theme';
import { clock } from '@/lib/time';
import { Frond } from '@/shell/FernArt';
import { Logo, Modal, Skeleton } from '@/shell/ui';

type Step = 'welcome' | 'reason' | 'symptoms' | 'q' | 'consent' | 'sending' | 'done';
interface Pos { step: Step; qid?: string; }

const REASON_ICON: Record<string, React.ReactNode> = {
  unwell: <Thermometer size={30} />,
  injury: <Bandage size={30} />,
  followup: <CalendarCheck size={30} />,
  meds: <Pill size={30} />,
  checkup: <HeartPulse size={30} />,
  forms: <FileText size={30} />,
};

const ageOn = (dob: string) => {
  const d = new Date(dob);
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  if (n.getMonth() < d.getMonth() || (n.getMonth() === d.getMonth() && n.getDate() < d.getDate())) a--;
  return a;
};

export default function KioskPage() {
  const hydrated = useHydrated();
  const sets = useApp((s) => s.sets);
  const patients = useApp((s) => s.patients);
  const authed = useApp((s) => s.authed);
  const addWalkIn = useApp((s) => s.addWalkIn);
  const clearWalkIns = useApp((s) => s.clearWalkIns);

  const [pos, setPos] = useState<Pos>({ step: 'welcome' });
  const [history, setHistory] = useState<Pos[]>([]);
  const [first, setFirst] = useState('Amara');
  const [last, setLast] = useState('Nwosu');
  const [dob, setDob] = useState('1990-04-18');
  const [reasonId, setReasonId] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [noneOfThese, setNone] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [agree, setAgree] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [texts, setTexts] = useState(true);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const { prefs, set: setPrefs } = useUiPrefs();
  const [result, setResult] = useState<{ ahead: number; urgent: boolean } | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(t);
  }, []);

  const returning = useMemo(() => findReturning(first, last, dob), [first, last, dob]);
  const reason = REASONS.find((r) => r.id === reasonId);
  const set = sets.find((s) => s.id === reason?.set);
  const vis = useMemo(() => (set ? visibleQuestions(set, symptoms, answers) : []), [set, symptoms, answers]);
  const qPos = pos.step === 'q' ? vis.findIndex((q) => q.id === pos.qid) : -1;

  const total = 4 + vis.length;
  const cur = pos.step === 'welcome' ? 0 : pos.step === 'reason' ? 1 : pos.step === 'symptoms' ? 2 : pos.step === 'q' ? 3 + Math.max(qPos, 0) : pos.step === 'consent' ? 3 + vis.length : total;
  const pct = pos.step === 'welcome' ? 4 : Math.round((cur / total) * 100);

  const go = (p: Pos) => {
    setHistory((h) => [...h, pos]);
    setPos(p);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0 });
  };
  const back = () => {
    setHistory((h) => {
      const prev = h[h.length - 1];
      if (prev) setPos(prev);
      return h.slice(0, -1);
    });
  };

  const nextQuestion = (fromId: string, a: Answers) => {
    if (!set) return go({ step: 'consent' });
    const list = visibleQuestions(set, symptoms, a);
    const i = list.findIndex((q) => q.id === fromId);
    const nxt = list[i + 1];
    go(nxt ? { step: 'q', qid: nxt.id } : { step: 'consent' });
  };

  const startQuestions = () => {
    if (!set) return;
    const allergyQ = set.questions.find((x) => x.id.endsWith('-allergy'));
    let a = answers;
    if (returning && allergyQ && !answers[allergyQ.id]) {
      a = { ...answers, [allergyQ.id]: returning.allergy };
      setAnswers(a);
    }
    const list = visibleQuestions(set, symptoms, a);
    go(list[0] ? { step: 'q', qid: list[0].id } : { step: 'consent' });
  };

  const submit = () => {
    if (!set || !reason) return;
    setPos({ step: 'sending' });
    const id = { age: ageOn(dob), sex: 'F' as const };
    const t = Date.now();
    const p: Patient = {
      id: `w-${t}`,
      name: `${first.trim()} ${last.trim()}`,
      dob: new Date(dob).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
      age: id.age,
      sex: id.sex,
      reasonId: reason.id,
      reason: reason.label,
      setId: set.id,
      symptoms,
      qa: buildQA(set, symptoms, answers),
      flags: buildFlags(set.id, symptoms, answers, id),
      summary: withCustom(buildSummary(set.id, reason.id, symptoms, answers, id), buildQA(set, symptoms, answers)),
      arrivedAt: t,
      apptAt: t + 15 * 60000,
      clinician: 'Dr. Elena Marsh',
      status: 'Waiting',
      notes: [],
      walkIn: true,
      allergy: allergyOf(answers),
    };
    const ahead = patients.filter((x) => x.status === 'Waiting' && !x.walkIn).length;
    setTimeout(() => {
      addWalkIn(p);
      setResult({ ahead, urgent: p.flags.some((f) => f.level === 'urgent') });
      setPos({ step: 'done' });
    }, 1400);
  };

  const restart = () => {
    setPos({ step: 'welcome' });
    setHistory([]);
    setReasonId('');
    setSymptoms([]);
    setNone(false);
    setAnswers({});
    setAgree(false);
    setPrivacy(false);
    setResult(null);
  };

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl space-y-5 p-10">
        <Skeleton className="h-12 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const q = pos.step === 'q' ? vis[qPos] : undefined;
  const answered = q ? answers[q.id] !== undefined && answers[q.id] !== '' : false;

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <Frond className="pointer-events-none absolute -right-16 bottom-0 hidden h-[460px] rotate-[-14deg] md:block" color="rgb(var(--fern-1))" />
      <Frond className="pointer-events-none absolute -left-20 top-40 hidden h-[360px] rotate-[30deg] lg:block" color="rgb(var(--fern-2))" leaflets={11} />

      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-10">
        <div className="flex items-center gap-4">
          <Logo size={36} />
          <span className="hidden border-l border-bone-300 pl-4 text-sm font-semibold text-bark-500 sm:block">Alder Street Health</span>
        </div>
        <div className="flex items-center gap-4 text-sm font-semibold text-bark-500">
          <span className="hidden tabular-nums sm:block">{clock(now)}</span>
          <button onClick={() => setPrefs({ large: !prefs.large })} aria-pressed={prefs.large} className={clsx('flex items-center gap-1.5 rounded-full border px-3.5 py-1.5', prefs.large ? 'border-pine-600 bg-pine-600 text-white' : 'border-bone-300 bg-snow text-bark-600 hover:bg-bone-200')}><Type size={14} />Larger text</button>
          <Link href={authed ? '/queue' : '/'} className="flex items-center gap-1.5 rounded-full border border-bone-300 bg-snow px-3.5 py-1.5 text-bark-600 hover:bg-bone-100"><Lock size={13} />Staff</Link>
        </div>
      </header>

      {pos.step !== 'welcome' && pos.step !== 'done' && pos.step !== 'sending' && (
        <div className="relative z-10 mx-auto w-full max-w-4xl px-5 sm:px-10">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-bark-400">
            <span>{pos.step === 'reason' ? 'Your visit' : pos.step === 'symptoms' ? 'How you feel' : pos.step === 'q' ? 'A few questions' : 'Last step'}</span>
            <span>{Math.min(cur + 1, total)} of {total}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-bone-300">
            <div className="h-full rounded-full bg-pine-600 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      )}

      <main key={`${pos.step}-${pos.qid ?? ''}`} className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 animate-rise flex-col px-5 pb-6 pt-8 sm:px-10">
        {pos.step === 'welcome' && (
          <div className="my-auto grid items-center gap-10 py-6 md:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="eyebrow">Check in</p>
              <h1 className="mt-3 font-display text-6xl leading-[1.02] text-heading sm:text-7xl">Welcome. Let&apos;s get you checked in.</h1>
              <p className="mt-5 max-w-md text-lg text-bark-500">It takes about two minutes. Your answers go straight to your care team so they are ready for you.</p>
            </div>
            <div className="card p-6 sm:p-7">
              <p className="mb-4 flex items-center gap-2 text-sm font-bold text-bark-700"><UserRound size={18} className="text-accent" />Find your appointment</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label" htmlFor="fn">First name</label><input id="fn" className="field !py-3.5 !text-base" value={first} onChange={(e) => setFirst(e.target.value)} /></div>
                <div><label className="label" htmlFor="ln">Last name</label><input id="ln" className="field !py-3.5 !text-base" value={last} onChange={(e) => setLast(e.target.value)} /></div>
              </div>
              <div className="mt-3"><label className="label" htmlFor="dob">Date of birth</label><input id="dob" type="date" className="field !py-3.5 !text-base" value={dob} onChange={(e) => setDob(e.target.value)} /></div>
              {returning && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-pine-100 p-4 animate-rise">
                  <Sparkles size={18} className="mt-0.5 shrink-0 text-accent" />
                  <p className="text-sm text-bark-700"><b className="text-heading">Welcome back, {returning.first}.</b> Your last visit was {returning.lastVisitDays < 14 ? `${returning.lastVisitDays} days` : `${Math.round(returning.lastVisitDays / 7)} weeks`} ago. We have your allergy details on file, so that is one less question.</p>
                </div>
              )}
              <button
                className="btn-primary mt-5 min-h-16 w-full text-lg"
                disabled={!first.trim() || !last.trim() || !dob}
                onClick={() => {
                  clearWalkIns();
                  go({ step: 'reason' });
                }}
              >
                Start check-in <ArrowRight size={20} />
              </button>
              <p className="mt-3 text-center text-xs text-bark-400">Your next appointment today is with Dr. Elena Marsh</p>
            </div>
          </div>
        )}

        {pos.step === 'reason' && (
          <>
            <h2 className="font-display text-5xl text-heading">Hello, {first.trim()}. What brings you in today?</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {REASONS.map((r) => {
                const on = reasonId === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      if (reasonId !== r.id) setAnswers({});
                      setReasonId(r.id);
                    }}
                    className={clsx('flex min-h-[104px] items-center gap-4 rounded-3xl border-2 p-5 text-left transition active:scale-[.99]', on ? 'border-pine-600 bg-pine-50 shadow-soft' : 'border-transparent bg-snow shadow-soft hover:border-pine-200')}
                  >
                    <span className={clsx('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', on ? 'bg-pine-600 text-white' : 'bg-pine-100 text-accent')}>{REASON_ICON[r.id]}</span>
                    <span><span className="block text-xl font-bold text-bark-900">{r.label}</span><span className="mt-0.5 block text-sm text-bark-500">{r.hint}</span></span>
                    {on && <Check className="ml-auto text-accent" size={24} />}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {pos.step === 'symptoms' && (
          <>
            <h2 className="font-display text-5xl text-heading">Are you having any of these?</h2>
            <p className="mt-2 text-lg text-bark-500">Tap everything that applies.</p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
              {SYMPTOMS.map((s) => {
                const on = symptoms.includes(s.id);
                return (
                  <button
                    key={s.id}
                    aria-pressed={on}
                    onClick={() => {
                      setNone(false);
                      setSymptoms((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]));
                    }}
                    className={clsx('flex min-h-[64px] items-center justify-between gap-2 rounded-2xl border-2 px-4 py-2.5 text-left text-base font-bold transition active:scale-[.98]', on ? 'border-pine-600 bg-pine-600 text-white' : 'border-transparent bg-snow text-bark-800 shadow-soft hover:border-pine-200')}
                  >
                    {s.label}
                    {on && <Check size={20} />}
                  </button>
                );
              })}
              <button
                aria-pressed={noneOfThese}
                onClick={() => {
                  setNone((n) => !n);
                  setSymptoms([]);
                }}
                className={clsx('col-span-2 min-h-[60px] rounded-2xl border-2 border-dashed px-4 py-3 text-base font-bold transition sm:col-span-3', noneOfThese ? 'border-pine-600 bg-pine-600 text-white' : 'border-bone-300 bg-transparent text-bark-600 hover:border-pine-300')}
              >
                None of these
              </button>
            </div>
          </>
        )}

        {pos.step === 'q' && q && <QuestionCard q={q} value={answers[q.id] ?? ''} symptoms={symptoms} onFile={!!returning && q.id.endsWith('-allergy') && answers[q.id] === returning.allergy} onChange={(v, auto) => {
          const a = { ...answers, [q.id]: v };
          setAnswers(a);
          if (auto) setTimeout(() => nextQuestion(q.id, a), 260);
        }} />}

        {pos.step === 'consent' && (
          <>
            <h2 className="font-display text-5xl text-heading">Before we finish</h2>
            <p className="mt-2 text-lg text-bark-500">Please read and confirm so we can share this with your care team.</p>
            <div className="mt-7 space-y-3">
              <Consent on={agree} set={setAgree} title="Share my answers with my care team today" body="Your answers are seen only by the clinician and front desk staff involved in your visit." required />
              <Consent on={privacy} set={setPrivacy} title="I have read the privacy notice" body={<button className="font-semibold text-accent underline underline-offset-2" onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }}>Read the privacy notice</button>} required />
              <Consent on={texts} set={setTexts} title="Text me about my visit" body="Optional. We only message you about today's appointment." />
            </div>
          </>
        )}

        {pos.step === 'sending' && (
          <div className="my-auto flex flex-col items-center py-20 text-center">
            <Loader2 size={44} className="animate-spin text-accent" />
            <p className="mt-5 font-display text-4xl text-heading">Sending to your care team…</p>
          </div>
        )}

        {pos.step === 'done' && (
          <div className="my-auto flex flex-col items-center py-10 text-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-pine-600 text-white shadow-lift"><Check size={48} strokeWidth={2.5} /></span>
            <h2 className="mt-8 font-display text-6xl leading-tight text-heading sm:text-7xl">Thank you, {first.trim()}.<br />Please take a seat.</h2>
            <DonePanel urgent={!!result?.urgent} />
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <button className="btn-ghost min-h-14 px-7 text-base" onClick={restart}>Check in another patient</button>
              <Link href={authed ? '/queue' : '/'} className="btn-primary min-h-14 px-7 text-base">Staff view <ArrowRight size={18} /></Link>
            </div>
          </div>
        )}

        {(pos.step === 'reason' || pos.step === 'symptoms' || pos.step === 'q' || pos.step === 'consent') && (
          <div className="mt-auto flex items-center justify-between gap-3 pt-10">
            <button className="btn-ghost min-h-16 px-7 text-lg" onClick={back}><ArrowLeft size={20} />Back</button>
            {pos.step === 'reason' && <button className="btn-primary min-h-16 px-9 text-lg" disabled={!reasonId} onClick={() => go({ step: 'symptoms' })}>Next <ArrowRight size={20} /></button>}
            {pos.step === 'symptoms' && <button className="btn-primary min-h-16 px-9 text-lg" disabled={!noneOfThese && symptoms.length === 0} onClick={startQuestions}>Next <ArrowRight size={20} /></button>}
            {pos.step === 'q' && q && <button className="btn-primary min-h-16 px-9 text-lg" disabled={q.type !== 'text' && !answered} onClick={() => nextQuestion(q.id, answers)}>{q.type === 'text' && !answered ? 'Skip' : 'Next'} <ArrowRight size={20} /></button>}
            {pos.step === 'consent' && <button className="btn-primary min-h-16 px-9 text-lg" disabled={!agree || !privacy} onClick={submit}>Submit check-in <Check size={20} /></button>}
          </div>
        )}
      </main>

      <Modal open={showPrivacy} onClose={() => setShowPrivacy(false)} title="Privacy notice" width="max-w-lg">
        <div className="space-y-3 text-sm leading-relaxed text-bark-600">
          <p>Alder Street Health collects the answers you give at check-in so your care team can prepare for your visit.</p>
          <p>Your answers are stored securely, are visible only to staff involved in your care, and every time a member of staff opens them it is recorded in an access log.</p>
          <p>We do not sell your information or share it outside your care. You can ask the front desk at any time to see who has viewed your record.</p>
        </div>
        <button className="btn-primary mt-5 w-full" onClick={() => { setShowPrivacy(false); setPrivacy(true); }}>I have read this</button>
      </Modal>
    </div>
  );
}

function QuestionCard({ q, value, symptoms, onFile, onChange }: { q: Question; value: string; symptoms: string[]; onFile?: boolean; onChange: (v: string, auto: boolean) => void }) {
  const why = q.showIf?.symptom ? q.showIf.symptom.filter((s) => symptoms.includes(s)).map((s) => symptomLabel(s).toLowerCase()) : null;
  return (
    <div>
      {(why && why.length > 0) || q.showIf?.answer ? (
        <span className="mb-4 inline-flex rounded-full bg-pine-100 px-3.5 py-1.5 text-sm font-bold text-accent">
          {why && why.length > 0 ? `Because you mentioned ${why[0]}` : 'Based on your last answer'}
        </span>
      ) : null}
      <h2 className="font-display text-5xl leading-[1.08] text-heading">{q.text}</h2>
      {q.helper && <p className="mt-2 text-lg text-bark-500">{q.helper}</p>}
      {onFile && <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-accent"><Sparkles size={18} />From your last visit. Tap Next to confirm, or choose a different answer.</p>}
      <div className="mt-8">
        {q.type === 'choice' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {q.options!.map((o) => (
              <button key={o} onClick={() => onChange(o, true)} className={clsx('flex min-h-[72px] items-center justify-between rounded-2xl border-2 px-5 py-3 text-left text-lg font-bold transition active:scale-[.99]', value === o ? 'border-pine-600 bg-pine-600 text-white' : 'border-transparent bg-snow text-bark-800 shadow-soft hover:border-pine-200')}>
                {o}{value === o && <Check size={22} />}
              </button>
            ))}
          </div>
        )}
        {q.type === 'yesno' && (
          <div className="grid max-w-xl grid-cols-2 gap-4">
            {['Yes', 'No'].map((o) => (
              <button key={o} onClick={() => onChange(o, true)} className={clsx('min-h-24 rounded-3xl border-2 text-3xl font-bold transition active:scale-[.98]', value === o ? 'border-pine-600 bg-pine-600 text-white' : 'border-transparent bg-snow text-bark-800 shadow-soft hover:border-pine-200')}>{o}</button>
            ))}
          </div>
        )}
        {q.type === 'scale' && (
          <div>
            <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-11">
              {Array.from({ length: 11 }, (_, i) => String(i)).map((n) => (
                <button key={n} onClick={() => onChange(n, false)} aria-label={`${n} out of 10`} className={clsx('aspect-square min-h-[60px] rounded-2xl border-2 text-2xl font-bold transition active:scale-95', value === n ? 'border-pine-600 bg-pine-600 text-white' : 'border-transparent bg-snow text-bark-800 shadow-soft hover:border-pine-200')}>{n}</button>
              ))}
            </div>
            <div className="mt-3 flex justify-between text-sm font-semibold text-bark-400"><span>No trouble</span><span>Worst imaginable</span></div>
          </div>
        )}
        {q.type === 'text' && (
          <textarea value={value} onChange={(e) => onChange(e.target.value, false)} rows={4} placeholder="Type here" className="field !rounded-2xl !p-5 !text-lg" />
        )}
      </div>
    </div>
  );
}

function Consent({ on, set, title, body, required }: { on: boolean; set: (v: boolean) => void; title: string; body: React.ReactNode; required?: boolean }) {
  return (
    <div role="checkbox" aria-checked={on} tabIndex={0} onClick={() => set(!on)} onKeyDown={(e) => (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), set(!on))} className={clsx('flex min-h-24 cursor-pointer items-start gap-4 rounded-3xl border-2 p-5 transition', on ? 'border-pine-600 bg-pine-50' : 'border-transparent bg-snow shadow-soft hover:border-pine-200')}>
      <span className={clsx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2', on ? 'border-pine-600 bg-pine-600 text-white' : 'border-bark-300 bg-snow')}>{on && <Check size={22} strokeWidth={3} />}</span>
      <span>
        <span className="block text-lg font-bold text-bark-900">{title}{required && <span className="ml-2 text-xs font-bold uppercase tracking-wider text-coral-600">Required</span>}</span>
        <span className="mt-1 block text-base text-bark-500">{body}</span>
      </span>
    </div>
  );
}

function withCustom(summary: string, qa: { id: string; q: string; a: string }[]) {
  const extra = qa.filter((x) => x.id.startsWith('x-'));
  if (!extra.length) return summary;
  return `${summary} Also answered: ${extra.map((x) => `${x.q.replace(/[?.]$/, '')}: ${x.a}`).join('; ')}.`;
}

/** Live place in line, following the queue as staff work through it. */
function DonePanel({ urgent }: { urgent: boolean }) {
  const patients = useApp((s) => s.patients);
  const alerts = useApp((s) => s.alerts);
  useNow(15000);
  const me = patients.find((p) => p.walkIn);
  const waiting = patients.filter((p) => p.status === 'Waiting').sort((a, b) => a.arrivedAt - b.arrivedAt);
  const pos = me ? waiting.findIndex((p) => p.id === me.id) + 1 : 0;

  let line = '';
  if (urgent) line = 'A member of our team will come and find you shortly.';
  else if (me && alerts[me.id]?.desk) line = 'Please come to the front desk, we are ready for you.';
  else if (me && me.status !== 'Waiting') line = 'Your care team is ready for you. Please follow the front desk.';
  else if (pos > 0) line = pos === 1 ? 'You are next in line.' : `You are number ${pos} in line, about ${Math.max(5, pos * 5)} minutes.`;
  else line = 'Your care team has your answers.';

  return (
    <div className="mt-5 max-w-lg">
      <p className="text-xl text-bark-500" aria-live="polite">{line}</p>
      {!urgent && pos > 0 && me?.status === 'Waiting' && (
        <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-4 rounded-3xl bg-snow px-6 py-4 shadow-soft">
          <span className="font-display text-6xl leading-none text-heading">{pos}</span>
          <span className="text-left text-sm font-semibold leading-tight text-bark-500">place in<br />the queue</span>
        </div>
      )}
    </div>
  );
}
