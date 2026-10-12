'use client';
import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Plus, Send, Trash2 } from 'lucide-react';
import { CLIENTS, client, person, project, projectsOf } from '@/data/static';
import type { ClientId, Line } from '@/data/types';
import { linesFromEntries } from '@/data/build';
import { totalsOf } from '@/data/calc';
import { useApp, useEntries } from '@/lib/store';
import { fromInputDate, hrs, money, monthDay, r2, toInputDate } from '@/lib/util';
import { InvoiceDoc } from '@/shell/InvoiceDoc';
import { EmptyState, Field, PageSkeleton, useLoading } from '@/shell/ui';

export default function NewInvoicePage() {
  return <Suspense fallback={<PageSkeleton />}><Builder /></Suspense>;
}

function Builder() {
  const params = useSearchParams();
  const router = useRouter();
  const loading = useLoading('invoice-new');
  const entries = useEntries();
  const create = useApp((s) => s.createInvoice);
  const toast = useApp((s) => s.toast);
  const initial = (CLIENTS.find((c) => c.id === params.get('client'))?.id ?? CLIENTS[0].id) as ClientId;
  const [cid, setCid] = useState<ClientId>(initial);
  const c = client(cid);
  const [terms, setTerms] = useState<number | null>(null);
  const [upTo, setUpTo] = useState(toInputDate(0));
  const [picked, setPicked] = useState<Record<string, boolean | undefined>>({});
  const [manual, setManual] = useState<Line[]>([]);
  const [note, setNote] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mHours, setMHours] = useState('');
  const [mRate, setMRate] = useState('');

  const ids = projectsOf(cid).map((p) => p.id);
  const limit = fromInputDate(upTo) ?? 0;
  const open = useMemo(() => entries.filter((e) => ids.includes(e.projectId) && e.billable && !e.invoiced && e.day <= limit).sort((a, b) => a.day - b.day), [entries, cid, limit]); // eslint-disable-line react-hooks/exhaustive-deps
  const isOn = (id: string) => picked[id] ?? true;
  const chosen = open.filter((e) => isOn(e.id));
  const lines = [...linesFromEntries(chosen), ...manual];
  const t = totalsOf(lines, c.taxRate);
  const effTerms = terms ?? c.terms;

  const preview = { number: 'Draft', clientId: cid, issued: 0, terms: effTerms, status: 'draft' as const, lines, taxRate: c.taxRate, note: note || undefined, paidDay: undefined, paidMethod: undefined };
  const submit = (send: boolean) => {
    const id = create({ clientId: cid, lines, entryIds: chosen.map((e) => e.id), terms: effTerms, taxRate: c.taxRate, note: note || undefined, send, periodFrom: chosen[0]?.day, periodTo: chosen[chosen.length - 1]?.day });
    toast(send ? `Invoice sent to ${c.contact}` : 'Draft saved', 'success');
    router.push(`/invoices/${id}`);
  };

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <Link href="/invoices" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800"><ChevronLeft size={16} /> Invoices</Link>
      <div className="mb-6"><h1 className="text-3xl">New invoice</h1><p className="mt-1 text-sm text-ink-500">Pick a client and the billable hours to include. Totals are hours times rate, plus tax.</p></div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Client"><select className="input" value={cid} onChange={(e) => { setCid(e.target.value as ClientId); setPicked({}); setManual([]); setTerms(null); }}>{CLIENTS.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>
              <Field label="Payment terms"><select className="input" value={effTerms} onChange={(e) => setTerms(Number(e.target.value))}>{[7, 15, 30, 45].map((n) => <option key={n} value={n}>Net {n}</option>)}</select></Field>
              <Field label="Include time up to"><input className="input" type="date" max={toInputDate(0)} value={upTo} onChange={(e) => setUpTo(e.target.value)} /></Field>
              <Field label="Tax rate"><input className="input bg-ink-50" readOnly value={`${(c.taxRate * 100).toFixed(2).replace(/\.?0+$/, '')}% (set on the client)`} /></Field>
            </div>
          </section>

          <section className="card">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3.5">
              <h2 className="font-sans text-base font-semibold">Billable hours</h2>
              <span className="text-xs text-ink-500">{chosen.length} of {open.length} entries · {hrs(r2(chosen.reduce((n, e) => n + e.hours, 0)))}</span>
            </div>
            {open.length === 0 ? <EmptyState icon={<Send size={22} />} title="Nothing to bill" body={`All billable time for ${c.name} up to ${monthDay(limit)} is already on an invoice.`} /> : (
              <div className="max-h-[420px] overflow-y-auto">
                {ids.map((pid) => {
                  const rows = open.filter((e) => e.projectId === pid);
                  if (!rows.length) return null;
                  const allOn = rows.every((e) => isOn(e.id));
                  return (
                    <div key={pid}>
                      <label className="sticky top-0 flex items-center gap-3 border-b border-ink-100 bg-ink-50 px-4 py-2.5 text-sm font-semibold">
                        <input type="checkbox" className="h-4 w-4 accent-[#7538e2]" checked={allOn} onChange={(e) => setPicked((p) => ({ ...p, ...Object.fromEntries(rows.map((r) => [r.id, e.target.checked])) }))} />
                        {project(pid).name}
                        <span className="ml-auto tabnum text-xs font-medium text-ink-500">{hrs(r2(rows.filter((r) => isOn(r.id)).reduce((n, r) => n + r.hours, 0)))} × {money(project(pid).rate)}</span>
                      </label>
                      {rows.map((e) => (
                        <label key={e.id} className="flex items-center gap-3 border-b border-ink-100 px-4 py-2.5 text-sm last:border-0">
                          <input type="checkbox" className="h-4 w-4 accent-[#7538e2]" checked={isOn(e.id)} onChange={(ev) => setPicked((p) => ({ ...p, [e.id]: ev.target.checked }))} />
                          <span className="min-w-0 flex-1"><span className="block truncate text-ink-800">{e.note}</span><span className="text-xs text-ink-500">{person(e.user).name.split(' ')[0]} · {e.day === 0 ? 'Today' : monthDay(e.day)}</span></span>
                          <span className="tabnum text-ink-700">{hrs(e.hours)}</span>
                        </label>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="card space-y-3 p-5">
            <h2 className="font-sans text-base font-semibold">Add a line</h2>
            <div className="grid gap-3 sm:grid-cols-[1fr_90px_110px_auto]">
              <input className="input" placeholder="Description" value={mDesc} onChange={(e) => setMDesc(e.target.value)} aria-label="Description" />
              <input className="input" placeholder="Hours" inputMode="decimal" value={mHours} onChange={(e) => setMHours(e.target.value)} aria-label="Hours" />
              <input className="input" placeholder="Rate" inputMode="decimal" value={mRate} onChange={(e) => setMRate(e.target.value)} aria-label="Rate" />
              <button className="btn-ghost" onClick={() => {
                const h = parseFloat(mHours); const r = parseFloat(mRate);
                if (!mDesc.trim() || !(h > 0) || !(r > 0)) { toast('Add a description, hours and a rate', 'warn'); return; }
                setManual((m) => [...m, { id: `m${m.length}`, description: mDesc.trim(), hours: h, rate: r }]);
                setMDesc(''); setMHours(''); setMRate('');
              }}><Plus size={16} /> Add</button>
            </div>
            {manual.map((m, i) => <div key={m.id} className="flex items-center justify-between rounded-lg bg-ink-50 px-3 py-2 text-sm"><span className="truncate">{m.description}</span><span className="flex shrink-0 items-center gap-3"><span className="tabnum text-ink-600">{hrs(m.hours)} × {money(m.rate)}</span><button aria-label="Remove line" onClick={() => setManual((x) => x.filter((_, j) => j !== i))} className="text-ink-400 hover:text-ink-700"><Trash2 size={14} /></button></span></div>)}
            <Field label="Note to the client (optional)"><textarea className="input min-h-20" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Thanks for your business." /></Field>
          </section>
        </div>

        <div className="xl:sticky xl:top-24 xl:self-start">
          <InvoiceDoc invoice={preview} showRates compact />
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-600">Total <b className="tabnum text-ink-900">{money(t.total)}</b> on {hrs(t.hours)}</p>
            <div className="flex gap-2"><button className="btn-ghost" disabled={!lines.length} onClick={() => submit(false)}>Save draft</button><button className="btn-primary" disabled={!lines.length} onClick={() => submit(true)}><Send size={16} /> Send to client</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
