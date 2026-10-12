'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Banknote, Bell, ChevronLeft, Download, Lock, Printer, Send } from 'lucide-react';
import { ACCOUNTS, client, person, project } from '@/data/static';
import { dueDay, invoiceTotals, shownStatus } from '@/data/calc';
import { useApp, useEntries, useInvoice } from '@/lib/store';
import { dueWhen, fullDate, hrs, money, monthDay } from '@/lib/util';
import { InvoiceDoc } from '@/shell/InvoiceDoc';
import { EmptyState, Field, InvoiceChip, Modal, PageSkeleton, useLoading } from '@/shell/ui';

export default function InvoiceView({ id }: { id: string }) {
  const role = useApp((s) => s.role)!;
  const inv = useInvoice(id);
  const entries = useEntries();
  const patchInvoice = useApp((s) => s.patchInvoice);
  const payInvoice = useApp((s) => s.payInvoice);
  const log = useApp((s) => s.log);
  const toast = useApp((s) => s.toast);
  const router = useRouter();
  const loading = useLoading('invoice-' + id + role);
  const [pdf, setPdf] = useState(false);
  const [pay, setPay] = useState(false);
  const [method, setMethod] = useState('Bank transfer');
  const owner = role === 'owner';
  const hidden = !inv || (role === 'client' && (inv.clientId !== ACCOUNTS.client.clientId || inv.status === 'draft'));

  useEffect(() => { if (role === 'member') router.replace('/home'); }, [role, router]);
  if (role === 'member') return null;
  if (loading) return <PageSkeleton />;
  if (hidden) return <div className="card"><EmptyState icon={<Lock size={22} />} title="Invoice not found" body="This invoice does not exist or is not shared with you." action={<Link href="/invoices" className="btn-primary btn-sm">Back to invoices</Link>} /></div>;

  const c = client(inv.clientId);
  const st = shownStatus(inv);
  const t = invoiceTotals(inv);
  const included = entries.filter((e) => inv.entryIds.includes(e.id));

  const events = [
    { label: 'Created', day: inv.issued },
    ...(inv.status !== 'draft' ? [{ label: `Sent to ${c.contact}`, day: inv.issued }] : []),
    ...(inv.remindedDay !== undefined ? [{ label: 'Reminder sent', day: inv.remindedDay }] : []),
    ...(inv.status === 'paid' && inv.paidDay !== undefined ? [{ label: `Paid by ${(inv.paidMethod ?? 'card').toLowerCase()}`, day: inv.paidDay }] : []),
  ];

  return (
    <div>
      <Link href="/invoices" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800"><ChevronLeft size={16} /> Invoices</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl">{inv.number}</h1><InvoiceChip status={st} /></div>
          <p className="mt-1 text-sm text-ink-500">{owner ? c.name : 'Foxglove Studio'} · {money(t.total)} · {st === 'paid' ? `paid ${fullDate(inv.paidDay ?? 0)}` : st === 'draft' ? 'not sent yet' : `due ${dueWhen(dueDay(inv))}`}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn-ghost" onClick={() => setPdf(true)}><Download size={16} /> Download PDF</button>
          {owner && st === 'draft' && <button className="btn-primary" onClick={() => { patchInvoice(inv.id, { status: 'sent', issued: 0 }); log({ kind: 'invoice', text: `${inv.number} (${money(t.total)}) sent to ${c.name}`, clientId: c.id, internal: true, money: true }); toast(`${inv.number} sent to ${c.contact}`, 'success'); }}><Send size={16} /> Send to client</button>}
          {owner && (st === 'sent' || st === 'overdue') && (
            <>
              <button className="btn-ghost" disabled={inv.remindedDay !== undefined} onClick={() => { patchInvoice(inv.id, { remindedDay: 0 }); log({ kind: 'invoice', text: `${inv.number} reminder sent to ${c.name}`, clientId: c.id, internal: true, money: true }); toast(`Reminder sent to ${c.contact}`, 'success'); }}><Bell size={16} /> {inv.remindedDay !== undefined ? 'Reminder sent' : 'Send reminder'}</button>
              <button className="btn-primary" onClick={() => setPay(true)}><Banknote size={16} /> Record payment</button>
            </>
          )}
          {!owner && (st === 'sent' || st === 'overdue') && <Link href={`/pay/${inv.id}`} className="btn-primary">Pay now</Link>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2"><InvoiceDoc invoice={inv} showRates={owner} /></div>
        <div className="space-y-6">
          <section className="card">
            <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Activity</h2></div>
            <ol className="space-y-4 p-4">
              {events.map((e, i) => (
                <li key={i} className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" /><div><p className="text-sm font-medium text-ink-900">{e.label}</p><p className="text-xs text-ink-500">{fullDate(e.day)}</p></div></li>
              ))}
              {st === 'overdue' && <li className="flex gap-3"><span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-ember-500" /><div><p className="text-sm font-medium text-ember-800">{-dueDay(inv)} days overdue</p><p className="text-xs text-ink-500">Was due {fullDate(dueDay(inv))}</p></div></li>}
            </ol>
          </section>
          {owner && (
            <section className="card">
              <div className="border-b border-ink-100 px-4 py-3.5"><h2 className="font-sans text-base font-semibold">Time on this invoice</h2></div>
              {included.length === 0 ? <p className="p-4 text-sm text-ink-500">This invoice covers earlier work billed before the current time log.</p> : (
                <ul className="max-h-80 divide-y divide-ink-100 overflow-y-auto">
                  {included.map((e) => <li key={e.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"><span className="min-w-0"><span className="block truncate text-ink-800">{e.note}</span><span className="text-xs text-ink-500">{person(e.user).name.split(' ')[0]} · {project(e.projectId).name} · {monthDay(e.day)}</span></span><span className="tabnum shrink-0 text-ink-700">{hrs(e.hours)}</span></li>)}
                </ul>
              )}
            </section>
          )}
        </div>
      </div>

      <Modal open={pdf} onClose={() => setPdf(false)} title={`${inv.number}.pdf`} width="max-w-3xl">
        <InvoiceDoc invoice={inv} showRates={owner} compact />
        <div className="mt-4 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setPdf(false)}>Close</button><button className="btn-primary" onClick={() => { toast(`${inv.number}.pdf saved to downloads`, 'success'); setPdf(false); }}><Printer size={16} /> Save PDF</button></div>
      </Modal>
      <Modal open={pay} onClose={() => setPay(false)} title="Record payment">
        <div className="space-y-4">
          <p className="text-sm text-ink-600">Mark {inv.number} ({money(t.total)}) as paid by {c.name}.</p>
          <Field label="Payment method"><select className="input" value={method} onChange={(e) => setMethod(e.target.value)}><option>Bank transfer</option><option>Card</option><option>Cheque</option></select></Field>
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setPay(false)}>Cancel</button><button className="btn-primary" onClick={() => { payInvoice(inv.id, method, 'Maya Okafor'); toast(`${inv.number} marked as paid`, 'success'); setPay(false); }}>Mark as paid</button></div>
        </div>
      </Modal>
    </div>
  );
}
