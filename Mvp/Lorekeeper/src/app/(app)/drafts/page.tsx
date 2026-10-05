'use client';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Check, Copy, Mail, PenLine, Users, Wand2 } from 'lucide-react';
import { api, DraftResult, Template } from '@/lib/api';
import { useViewer } from '@/shell/viewer';
import { toast } from '@/shell/Toast';
import { Thinking, useTypewriter } from '@/shell/Typewriter';
import { PageHeader, Skeleton } from '@/shell/ui';

const ICONS: Record<string, typeof Mail> = { t1: Mail, t2: Users };

export default function DraftsPage() {
  const [templates, setTemplates] = useState<Template[] | null>(null);
  const [sel, setSel] = useState<string>('t1');
  const [values, setValues] = useState<Record<string, Record<string, string>>>({});
  const [draft, setDraft] = useState<string | null>(null);
  const [run, setRun] = useState(false);
  const [busy, setBusy] = useState(false);
  const [edited, setEdited] = useState('');
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<DraftResult | null>(null);
  const openDoc = useViewer((s) => s.open);
  const { shown, typing } = useTypewriter(draft || '', run, 14);

  useEffect(() => {
    api.templates().then((t) => {
      setTemplates(t);
      setValues(Object.fromEntries(t.map((x) => [x.id, Object.fromEntries(x.fields.map((f) => [f.key, f.default]))])));
    }).catch(() => {});
  }, []);

  useEffect(() => { if (draft !== null && !typing) { setEdited(draft); setRun(false); } }, [typing, draft]);

  const tpl = templates?.find((t) => t.id === sel);

  const generate = async () => {
    setBusy(true);
    setRun(false);
    setDraft(null);
    setEdited('');
    setResult(null);
    try {
      const [res] = await Promise.all([api.draft(sel, values[sel] || {}), new Promise((r) => setTimeout(r, 1200))]);
      setDraft(res.text);
      setResult(res);
      setRun(true);
    } catch {
      toast('Could not write the draft. Please try again.', 'err');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(edited || draft || ''); } catch {}
    setCopied(true);
    toast('Draft copied to clipboard');
    setTimeout(() => setCopied(false), 1800);
  };

  const done = draft !== null && !run;

  return (
    <div>
      <PageHeader title="Draft a reply" subtitle="Pick a template and Lorekeeper writes a first draft from what your documents say. Edit it before you send." />
      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div data-tour="drafts-templates" className="grid grid-cols-2 gap-3">
            {!templates && [0, 1].map((i) => <Skeleton key={i} className="h-24" />)}
            {templates?.map((t) => {
              const Icon = ICONS[t.id] || PenLine;
              return (
                <button key={t.id} onClick={() => { setSel(t.id); setDraft(null); setRun(false); setResult(null); }} className={clsx('card p-3 text-left transition hover:border-brand-300', sel === t.id && 'border-brand-500 ring-2 ring-brand-100')}>
                  <Icon className="mb-2 h-5 w-5 text-brand-600" />
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">{t.description}</div>
                </button>
              );
            })}
          </div>
          {tpl && (
            <div className="card space-y-3 p-4">
              {tpl.fields.map((f) => (
                <label key={f.key} className="block text-sm font-medium">{f.label}
                  <input className="input mt-1.5" value={values[tpl.id]?.[f.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [tpl.id]: { ...v[tpl.id], [f.key]: e.target.value } }))} />
                </label>
              ))}
              <button className="btn-primary w-full" onClick={generate} disabled={busy || run}><Wand2 className="h-4 w-4" /> Write draft</button>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <div className="card flex min-h-[26rem] flex-col">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <div className="text-sm font-semibold">{tpl ? tpl.name : 'Draft'}</div>
              <button className="btn-ghost" onClick={copy} disabled={!done}>{copied ? <Check className="h-4 w-4 text-brand-600" /> : <Copy className="h-4 w-4" />} {copied ? 'Copied' : 'Copy'}</button>
            </div>
            <div className="flex flex-1 flex-col p-4">
              {busy && <Thinking label="Reading your documents and writing" />}
              {!busy && draft === null && (
                <div className="m-auto max-w-xs text-center text-sm text-ink-500">
                  <PenLine className="mx-auto mb-2 h-6 w-6 text-brand-500" />
                  Choose a template, check the details on the left, then press <span className="font-medium text-ink-700">Write draft</span>.
                </div>
              )}
              {run && <pre className="caret whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-ink-800">{shown}</pre>}
              {done && result && !result.found && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  I could not find notes for &ldquo;{result.subject}&rdquo; in your documents, so this draft has no details from them. Check the name or add the notes first.
                </div>
              )}
              {done && (
                <textarea className="input min-h-[26rem] flex-1 resize-none text-[15px] leading-relaxed" value={edited} onChange={(e) => setEdited(e.target.value)} aria-label="Draft text" />
              )}
              {done && result && result.sources.length > 0 && (
                <div className="pop mt-3 border-t border-ink-100 pt-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">Written from</div>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(new Map(result.sources.map((x) => [x.doc_id, x])).values()).map((x) => (
                      <button key={x.doc_id} onClick={() => openDoc({ id: x.doc_id, quote: x.quote })} className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-sm font-medium hover:border-brand-300 hover:bg-brand-50/40">
                        {x.doc_title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
