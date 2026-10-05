'use client';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowDown, ArrowUp, Check, GripVertical, Lock, Pencil, Plus, Trash2, Undo2, UploadCloud, X } from 'lucide-react';
import { SYMPTOMS } from '@/data/questions';
import type { Question, QuestionSet, QType } from '@/data/types';
import { conditionLabel } from '@/lib/engine';
import { useApp } from '@/lib/store';
import { ago } from '@/lib/time';
import { Chip, SelectField, Skeleton, Switch } from '@/shell/ui';

const TYPE_LABEL = { choice: 'Choose one', scale: '0 to 10 scale', yesno: 'Yes or no', text: 'Free text' } as const;

export default function QuestionsPage() {
  const sets = useApp((s) => s.sets);
  const publishSet = useApp((s) => s.publishSet);
  const toast = useApp((s) => s.toast);
  const [setId, setSetId] = useState<QuestionSet['id']>('acute');
  const [drafts, setDrafts] = useState<Record<string, QuestionSet>>({});
  const [selId, setSelId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const published = sets.find((s) => s.id === setId)!;
  const draft = drafts[setId] ?? published;
  const dirty = JSON.stringify(draft.questions) !== JSON.stringify(published.questions);
  const dirtySets = useMemo(() => sets.filter((s) => drafts[s.id] && JSON.stringify(drafts[s.id].questions) !== JSON.stringify(s.questions)).map((s) => s.id), [drafts, sets]);
  const sel = draft.questions.find((q) => q.id === selId) ?? draft.questions[0];

  const update = (qs: Question[]) => setDrafts((d) => ({ ...d, [setId]: { ...draft, questions: qs } }));
  const move = (id: string, to: number) => {
    const qs = [...draft.questions];
    const from = qs.findIndex((q) => q.id === id);
    if (from < 0 || to < 0 || to >= qs.length || from === to) return;
    const [item] = qs.splice(from, 1);
    qs.splice(to, 0, item);
    update(qs);
  };
  const commitEdit = () => {
    if (editing && editText.trim()) update(draft.questions.map((q) => (q.id === editing ? { ...q, text: editText.trim() } : q)));
    setEditing(null);
  };

  return (
    <div>
      <p className="eyebrow">Check-in screen</p>
      <h1 className="mt-1 font-display text-5xl leading-none text-heading">Question sets</h1>
      <p className="mt-2 max-w-2xl text-sm text-bark-500">Reorder questions, reword them or hide them. Published changes appear on the check-in screen straight away.</p>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {sets.map((s) => {
          const on = s.id === setId;
          return (
            <button key={s.id} onClick={() => { setSetId(s.id); setSelId(null); setEditing(null); }} className={clsx('card p-4 text-left transition', on ? 'border-pine-500 ring-2 ring-pine-200' : 'hover:border-pine-200')}>
              <div className="flex items-center justify-between gap-2">
                <p className="font-display text-2xl text-heading">{s.name}</p>
                {dirtySets.includes(s.id) && <Chip tone="coral">Unpublished</Chip>}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-bark-500">{s.blurb}</p>
              <p className="mt-3 text-xs text-bark-400">{s.questions.length} questions · {s.usedFor.join(', ')}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 border-b border-bone-200 bg-bone-100 px-5 py-3.5">
            <div>
              <p className="text-sm font-bold text-bark-800">{draft.name}</p>
              <p className="text-xs text-bark-400">Last published by {published.editedBy} · {published.editedMinsAgo === 0 ? 'just now' : ago(published.editedMinsAgo)}</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                className="btn-soft"
                onClick={() => {
                  const nq: Question = { id: `x-${Date.now()}`, text: 'New question', type: 'choice', options: ['Option 1', 'Option 2'], active: true };
                  update([...draft.questions, nq]);
                  setSelId(nq.id);
                }}
              >
                <Plus size={15} />Add question
              </button>
              <button className="btn-ghost" disabled={!dirty} onClick={() => { setDrafts((d) => { const n = { ...d }; delete n[setId]; return n; }); toast('Changes discarded', 'info'); }}><Undo2 size={15} />Discard</button>
              <button className="btn-primary" disabled={!dirty} onClick={() => { publishSet(draft); setDrafts((d) => { const n = { ...d }; delete n[setId]; return n; }); toast(`${draft.name} published to the check-in screen`); }}><UploadCloud size={15} />Publish changes</button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3 p-5">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : (
            <ol className="divide-y divide-bone-200">
              {draft.questions.map((q, i) => {
                const cond = conditionLabel(q, draft);
                const isSel = sel?.id === q.id;
                return (
                  <li
                    key={q.id}
                    draggable
                    onDragStart={() => setDragId(q.id)}
                    onDragOver={(e) => { e.preventDefault(); setOverId(q.id); }}
                    onDragEnd={() => { setDragId(null); setOverId(null); }}
                    onDrop={() => { if (dragId) move(dragId, i); setDragId(null); setOverId(null); }}
                    className={clsx('flex items-start gap-3 px-4 py-3.5 transition', isSel && 'bg-pine-50', overId === q.id && dragId !== q.id && 'shadow-[inset_0_2px_0_#a07620]', dragId === q.id && 'opacity-40', !q.active && 'bg-bone-100')}
                    onClick={() => setSelId(q.id)}
                  >
                    <span className="mt-1 cursor-grab text-bark-300 active:cursor-grabbing" aria-hidden><GripVertical size={18} /></span>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bone-200 text-xs font-bold text-bark-600">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      {editing === q.id ? (
                        <input
                          autoFocus
                          className="field !py-1.5"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditing(null); }}
                          aria-label="Question wording"
                        />
                      ) : (
                        <button className="group flex items-start gap-2 text-left" onClick={(e) => { e.stopPropagation(); setSelId(q.id); setEditing(q.id); setEditText(q.text); }} aria-label={`Edit wording: ${q.text}`}>
                          <span className={clsx('text-[15px] font-semibold', q.active ? 'text-bark-900' : 'text-bark-400 line-through')}>{q.text}</span>
                          <Pencil size={13} className="mt-1.5 shrink-0 text-bark-300 opacity-0 transition group-hover:opacity-100" />
                        </button>
                      )}
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Chip>{TYPE_LABEL[q.type]}</Chip>
                        {cond && <Chip tone="pine">{cond}</Chip>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button className="rounded-full p-1.5 text-bark-400 hover:bg-bone-200 disabled:opacity-30" disabled={i === 0} onClick={() => move(q.id, i - 1)} aria-label="Move up"><ArrowUp size={16} /></button>
                      <button className="rounded-full p-1.5 text-bark-400 hover:bg-bone-200 disabled:opacity-30" disabled={i === draft.questions.length - 1} onClick={() => move(q.id, i + 1)} aria-label="Move down"><ArrowDown size={16} /></button>
                      <span className="ml-1.5"><Switch on={q.active} label={`Show on check-in screen: ${q.text}`} onChange={(v) => update(draft.questions.map((x) => (x.id === q.id ? { ...x, active: v } : x)))} /></span>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <aside className="lg:sticky lg:top-24">
          <p className="eyebrow mb-2">How it looks on the tablet</p>
          {sel && <Preview q={sel} />}
          {sel && (
            <Editor
              key={sel.id}
              q={sel}
              before={draft.questions.slice(0, draft.questions.findIndex((x) => x.id === sel.id))}
              onChange={(patch) => update(draft.questions.map((x) => (x.id === sel.id ? { ...x, ...patch } : x)))}
              onDelete={() => {
                update(draft.questions.filter((x) => x.id !== sel.id));
                setSelId(null);
              }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function Preview({ q }: { q: Question }) {
  return (
    <div className="rounded-[28px] border-[10px] border-pine-900 bg-bone p-5 shadow-lift">
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-bone-300"><div className="h-full w-1/2 rounded-full bg-pine-600" /></div>
      {!q.active && <Chip tone="coral" className="mb-3">Hidden from patients</Chip>}
      <p className="font-display text-3xl leading-tight text-heading">{q.text}</p>
      {q.helper && <p className="mt-1.5 text-sm text-bark-500">{q.helper}</p>}
      <div className="mt-5">
        {q.type === 'choice' && <div className="space-y-2">{q.options!.map((o, i) => <div key={o} className={clsx('flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold', i === 0 ? 'bg-pine-600 text-white' : 'bg-snow text-bark-800 shadow-soft')}>{o}{i === 0 && <Check size={16} />}</div>)}</div>}
        {q.type === 'yesno' && <div className="grid grid-cols-2 gap-2.5">{['Yes', 'No'].map((o, i) => <div key={o} className={clsx('rounded-xl py-5 text-center text-xl font-bold', i === 0 ? 'bg-pine-600 text-white' : 'bg-snow text-bark-800 shadow-soft')}>{o}</div>)}</div>}
        {q.type === 'scale' && <div className="grid grid-cols-6 gap-1.5">{Array.from({ length: 11 }, (_, i) => <div key={i} className={clsx('flex aspect-square items-center justify-center rounded-lg text-sm font-bold', i === 6 ? 'bg-pine-600 text-white' : 'bg-snow text-bark-800 shadow-soft')}>{i}</div>)}</div>}
        {q.type === 'text' && <div className="h-24 rounded-xl border border-bone-300 bg-snow p-3 text-sm text-bark-300">Type here</div>}
      </div>
    </div>
  );
}

const TYPES: { value: QType; label: string }[] = [
  { value: 'choice', label: 'Choose one' },
  { value: 'yesno', label: 'Yes or no' },
  { value: 'scale', label: '0 to 10 scale' },
  { value: 'text', label: 'Free text' },
];

function Editor({ q, before, onChange, onDelete }: { q: Question; before: Question[]; onChange: (patch: Partial<Question>) => void; onDelete: () => void }) {
  const custom = q.id.startsWith('x-');
  const cond = q.showIf;
  const mode = cond?.symptom ? 'symptom' : cond?.answer ? 'answer' : 'always';
  const sources = before.filter((x) => x.type === 'choice' || x.type === 'yesno');
  const src = cond?.answer ? before.find((x) => x.id === cond.answer!.id) : undefined;
  const srcOptions = src ? (src.type === 'yesno' ? ['Yes', 'No'] : src.options ?? []) : [];

  return (
    <div className="card mt-4 space-y-4 p-4">
      <p className="eyebrow">Edit question</p>
      <div>
        <label className="label" htmlFor="qw">Wording</label>
        <textarea id="qw" className="field min-h-[64px]" value={q.text} onChange={(e) => onChange({ text: e.target.value })} />
      </div>
      <div>
        <label className="label" htmlFor="qh">Helper text</label>
        <input id="qh" className="field" value={q.helper ?? ''} placeholder="Optional line under the question" onChange={(e) => onChange({ helper: e.target.value || undefined })} />
      </div>

      {custom ? (
        <div>
          <label className="label">Answer type</label>
          <SelectField className="w-full" label="Answer type" value={q.type} onChange={(v) => onChange({ type: v as QType, options: v === 'choice' ? q.options ?? ['Option 1', 'Option 2'] : undefined })} options={TYPES} />
        </div>
      ) : (
        <p className="flex items-start gap-2 rounded-xl bg-bone-200 p-3 text-xs text-bark-600"><Lock size={14} className="mt-0.5 shrink-0" />Answer type and options on built-in questions are fixed so the AI flags keep working. Wording and order can change.</p>
      )}

      {custom && q.type === 'choice' && (
        <div>
          <label className="label">Answer options</label>
          <ul className="space-y-2">
            {(q.options ?? []).map((o, i) => (
              <li key={i} className="flex gap-2">
                <input className="field !py-2" value={o} aria-label={`Option ${i + 1}`} onChange={(e) => onChange({ options: (q.options ?? []).map((x, n) => (n === i ? e.target.value : x)) })} />
                <button className="rounded-full p-2 text-bark-400 hover:bg-bone-200 disabled:opacity-30" disabled={(q.options ?? []).length <= 2} onClick={() => onChange({ options: (q.options ?? []).filter((_, n) => n !== i) })} aria-label={`Remove option ${i + 1}`}><X size={16} /></button>
              </li>
            ))}
          </ul>
          <button className="btn-ghost mt-2 !py-1.5" disabled={(q.options ?? []).length >= 6} onClick={() => onChange({ options: [...(q.options ?? []), `Option ${(q.options ?? []).length + 1}`] })}><Plus size={14} />Add option</button>
        </div>
      )}

      {custom && (
        <div>
          <label className="label">Show this question</label>
          <SelectField
            className="w-full"
            label="When to show"
            value={mode}
            onChange={(v) => {
              if (v === 'always') onChange({ showIf: undefined });
              else if (v === 'symptom') onChange({ showIf: { symptom: ['fever'] } });
              else if (sources[0]) onChange({ showIf: { answer: { id: sources[0].id, in: [sources[0].type === 'yesno' ? 'Yes' : sources[0].options![0]] } } });
            }}
            options={[{ value: 'always', label: 'Always' }, { value: 'symptom', label: 'When a symptom is ticked' }, ...(sources.length ? [{ value: 'answer', label: 'When an earlier answer matches' }] : [])]}
          />
          {mode === 'symptom' && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {SYMPTOMS.map((sy) => {
                const on = cond!.symptom!.includes(sy.id);
                return (
                  <button
                    key={sy.id}
                    aria-pressed={on}
                    onClick={() => {
                      const next = on ? cond!.symptom!.filter((x) => x !== sy.id) : [...cond!.symptom!, sy.id];
                      onChange({ showIf: next.length ? { symptom: next } : undefined });
                    }}
                    className={on ? 'rounded-full bg-pine-600 px-2.5 py-1 text-xs font-semibold text-white' : 'rounded-full bg-bone-200 px-2.5 py-1 text-xs font-semibold text-bark-600 hover:bg-pine-100'}
                  >
                    {sy.label}
                  </button>
                );
              })}
            </div>
          )}
          {mode === 'answer' && cond?.answer && (
            <div className="mt-2.5 space-y-2">
              <SelectField className="w-full" label="Earlier question" value={cond.answer.id} onChange={(v) => { const t = before.find((x) => x.id === v)!; onChange({ showIf: { answer: { id: v, in: [t.type === 'yesno' ? 'Yes' : t.options![0]] } } }); }} options={sources.map((x) => ({ value: x.id, label: x.text }))} />
              <SelectField className="w-full" label="Answer" value={cond.answer.in?.[0] ?? ''} onChange={(v) => onChange({ showIf: { answer: { id: cond.answer!.id, in: [v] } } })} options={srcOptions.map((o) => ({ value: o, label: `Is ${o}` }))} />
            </div>
          )}
        </div>
      )}

      {custom && (
        <button className="btn-ghost w-full !text-coral-700" onClick={onDelete}><Trash2 size={15} />Delete question</button>
      )}
    </div>
  );
}
