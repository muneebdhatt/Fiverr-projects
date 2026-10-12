'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Check, FileAudio, Mic, Pause, Play, Square, Trash2, UploadCloud, X } from 'lucide-react';
import { LATEST, PEOPLE, type PersonId } from '@/data';
import { useApp, useMinutesUsed } from '@/lib/store';
import { clock } from '@/lib/util';
import { Field, PersonAvatar, ProgressBar, Waveform } from '@/shell/ui';

const STEPS = [
  { label: 'Uploading audio', ms: 1100 },
  { label: 'Transcribing speech', ms: 1700 },
  { label: 'Writing the summary', ms: 1500 },
  { label: 'Finding decisions and action items', ms: 1300 },
];

const sizeLabel = (b: number) => (b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

export default function RecordPage() {
  const router = useRouter();
  const recordLatest = useApp((s) => s.recordLatest);
  const limit = useApp((s) => s.limit);
  const toast = useApp((s) => s.toast);
  const used = useMinutesUsed();

  const [mode, setMode] = useState<'record' | 'upload'>('record');
  const [phase, setPhase] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');
  const [secs, setSecs] = useState(0);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [drag, setDrag] = useState(false);
  const [title, setTitle] = useState(LATEST.title);
  const [who, setWho] = useState<PersonId[]>(PEOPLE.map((p) => p.id));
  const [step, setStep] = useState(-1); // -1 = not processing
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase !== 'recording') return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const ready = mode === 'record' ? phase === 'stopped' : !!file;
  const processing = step >= 0;

  useEffect(() => {
    if (step < 0) return;
    if (step >= STEPS.length) {
      recordLatest(title, who);
      toast('Your notes are ready', 'success');
      router.push('/meetings/latest-recording');
      return;
    }
    const t = setTimeout(() => setStep((s) => s + 1), STEPS[step].ms);
    return () => clearTimeout(t);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const pick = (f?: File | null) => {
    if (!f) return;
    setFile({ name: f.name, size: f.size });
    if (title === LATEST.title) setTitle(f.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 60) || LATEST.title);
  };

  if (processing) {
    const pct = Math.min(100, Math.round((step / STEPS.length) * 100) + 6);
    return (
      <div className="mx-auto max-w-xl pt-6">
        <div className="card p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl">Writing up your meeting</h1>
          <p className="mt-1 text-sm text-ink-500">{title}</p>
          <ProgressBar value={pct} max={100} className="mt-6" />
          <ul className="mt-6 space-y-3.5">
            {STEPS.map((s, i) => (
              <li key={s.label} className={clsx('flex items-center gap-3 text-sm', i > step ? 'text-ink-400' : 'text-ink-800')}>
                <span className={clsx('flex h-6 w-6 items-center justify-center rounded-full', i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-brand-100 text-brand-700' : 'bg-ink-100')}>
                  {i < step ? <Check size={14} /> : i === step ? <span className="dot" style={{ width: 8, height: 8 }} /> : null}
                </span>
                {s.label}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-ink-400">This usually takes under a minute. You can leave this page; we will keep working.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl">New recording</h1>
        <p className="mt-1 text-ink-500">Record the room or upload a file. You will get a summary, decisions and an action list.</p>
      </div>

      <div className="inline-flex rounded-xl bg-ink-100 p-1">
        {(['record', 'upload'] as const).map((m) => (
          <button key={m} onClick={() => setMode(m)} className={clsx('flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition', mode === m ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-800')}>
            {m === 'record' ? <Mic size={16} /> : <UploadCloud size={16} />} {m === 'record' ? 'Record' : 'Upload'}
          </button>
        ))}
      </div>

      {mode === 'record' ? (
        <div className="card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <button
                onClick={() => { if (phase === 'idle' || phase === 'stopped') { setSecs(0); setPhase('recording'); } }}
                disabled={phase === 'recording' || phase === 'paused'}
                className={clsx('relative flex h-24 w-24 items-center justify-center rounded-full text-white shadow-lg transition', phase === 'recording' ? 'ring-pulse bg-brand-600' : 'bg-ink-900 hover:bg-brand-600')}
                aria-label="Start recording"
              >
                <Mic size={36} />
              </button>
            </div>
            <p className="mt-5 font-display text-5xl font-semibold tabular-nums text-ink-900">{clock(secs)}</p>
            <p className="mt-1 text-sm text-ink-500">
              {phase === 'idle' && 'Press the microphone to start'}
              {phase === 'recording' && 'Recording. Everyone in the room is being captured.'}
              {phase === 'paused' && 'Paused'}
              {phase === 'stopped' && 'Recording saved and ready to process'}
            </p>
            <Waveform bars={72} height={64} seed={5} active={phase === 'recording'} progress={phase === 'stopped' ? 1 : undefined} className="mt-6 w-full max-w-lg" />
            <div className="mt-6 flex items-center gap-3">
              {(phase === 'recording' || phase === 'paused') && (
                <>
                  <button className="btn-ghost" onClick={() => setPhase(phase === 'paused' ? 'recording' : 'paused')}>{phase === 'paused' ? <><Play size={16} /> Resume</> : <><Pause size={16} /> Pause</>}</button>
                  <button className="btn-dark" onClick={() => setPhase('stopped')}><Square size={14} fill="currentColor" /> Stop and save</button>
                </>
              )}
              {phase === 'stopped' && <button className="btn-ghost" onClick={() => { setPhase('idle'); setSecs(0); }}><Trash2 size={16} /> Discard and re-record</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-6 sm:p-8">
          <input ref={inputRef} type="file" accept="audio/*,video/*,.m4a,.mp3,.wav,.mp4" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          {!file ? (
            <button
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
              className={clsx('flex w-full flex-col items-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition', drag ? 'border-brand-500 bg-brand-50' : 'border-ink-300 hover:border-brand-400 hover:bg-ink-50')}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-700"><UploadCloud size={26} /></span>
              <span className="mt-4 text-base font-semibold text-ink-900">Drop a recording here, or browse</span>
              <span className="mt-1 text-sm text-ink-500">MP3, M4A, WAV or MP4 up to 500 MB</span>
            </button>
          ) : (
            <div className="flex items-center gap-4 rounded-xl border border-ink-200 bg-ink-50 p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700"><FileAudio size={24} /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-900">{file.name}</p>
                <p className="text-xs text-ink-500">{sizeLabel(file.size)} · about 28 min · ready to process</p>
              </div>
              <button onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ''; }} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-200 hover:text-ink-700" aria-label="Remove file"><X size={18} /></button>
            </div>
          )}
        </div>
      )}

      <div className="card space-y-5 p-6 sm:p-8">
        <Field label="Meeting title"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={70} /></Field>
        <div>
          <p className="mb-2 text-sm font-medium text-ink-700">Who was in the meeting?</p>
          <div className="flex flex-wrap gap-2">
            {PEOPLE.map((p) => {
              const on = who.includes(p.id);
              return (
                <button key={p.id} onClick={() => setWho((w) => (on ? w.filter((x) => x !== p.id) : [...w, p.id]))} className={clsx('flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-sm font-medium transition', on ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-300 bg-white text-ink-600 hover:bg-ink-50')} aria-pressed={on}>
                  <PersonAvatar id={p.id} size={24} /> {p.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">{limit - used} of {limit} plan minutes left this month. <Link href="/meetings" className="font-semibold text-brand-700 hover:underline">Back to meetings</Link></p>
        <button className="btn-primary py-3" disabled={!ready || !title.trim()} onClick={() => setStep(0)}>Process recording</button>
      </div>
    </div>
  );
}
