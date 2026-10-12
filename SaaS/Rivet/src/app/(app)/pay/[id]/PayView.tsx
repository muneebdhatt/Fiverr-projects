'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Building2, CheckCircle2, ChevronLeft, CreditCard, Lock, ShieldCheck } from 'lucide-react';
import clsx from 'clsx';
import { ACCOUNTS, client } from '@/data/static';
import { dueDay, lineAmount, shownStatus, taxLabel } from '@/data/calc';
import { invoiceTotals } from '@/data/calc';
import { nameOf, useApp, useInvoice } from '@/lib/store';
import { fullDate, money } from '@/lib/util';
import { EmptyState, Field, Logo, PageSkeleton, useLoading } from '@/shell/ui';

type Method = 'saved' | 'bank' | 'new';

export default function PayView({ id }: { id: string }) {
  const inv = useInvoice(id);
  const loading = useLoading('pay-' + id);
  const pay = useApp((s) => s.payInvoice);
  const toast = useApp((s) => s.toast);
  const [method, setMethod] = useState<Method>('saved');
  const [phase, setPhase] = useState<'form' | 'processing' | 'done'>('form');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  if (loading) return <PageSkeleton />;
  if (!inv || inv.clientId !== ACCOUNTS.client.clientId || inv.status === 'draft') {
    return <div className="card"><EmptyState icon={<Lock size={22} />} title="Invoice not found" body="This invoice does not exist or is not shared with you." action={<Link href="/invoices" className="btn-primary btn-sm">Back to invoices</Link>} /></div>;
  }
  const c = client(inv.clientId);
  const t = invoiceTotals(inv);
  const st = shownStatus(inv);

  if (st === 'paid' && phase !== 'done') {
    return <div className="card"><EmptyState icon={<CheckCircle2 size={22} />} title={`${inv.number} is paid`} body={`Thank you. We received ${money(t.total)} on ${fullDate(inv.paidDay ?? 0)}.`} action={<Link href={`/invoices/${inv.id}`} className="btn-primary btn-sm">View invoice</Link>} /></div>;
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-lg">
        <div className="card pop p-8 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600"><CheckCircle2 size={36} /></span>
          <h1 className="mt-5 text-3xl">Payment received</h1>
          <p className="mt-2 text-ink-600">Thank you, {c.contact.split(' ')[0]}. We received {money(t.total)} for {inv.number}.</p>
          <dl className="mt-6 divide-y divide-ink-100 rounded-xl border border-ink-200 text-left text-sm">
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-500">Receipt</dt><dd className="font-semibold">RCPT-{inv.number.slice(4)}</dd></div>
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-500">Paid with</dt><dd className="font-semibold">{method === 'bank' ? 'Bank account ending 0382' : 'Visa ending 4417'}</dd></div>
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-500">Date</dt><dd className="font-semibold">{fullDate(0)}</dd></div>
            <div className="flex justify-between px-4 py-3"><dt className="text-ink-500">Receipt sent to</dt><dd className="font-semibold">{c.contactEmail}</dd></div>
          </dl>
          <div className="mt-6 flex flex-wrap justify-center gap-2"><Link href={`/invoices/${inv.id}`} className="btn-primary">View invoice</Link><Link href="/invoices" className="btn-ghost">All invoices</Link></div>
        </div>
      </div>
    );
  }

  const go = () => {
    setPhase('processing');
    timer.current = setTimeout(() => {
      pay(inv.id, method === 'bank' ? 'Bank transfer' : 'Card', nameOf('client'));
      setPhase('done');
      toast('Payment received. A receipt is on its way.', 'success');
    }, 1800);
  };

  return (
    <div className="mx-auto max-w-5xl">
      <Link href={`/invoices/${inv.id}`} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-500 hover:text-ink-800"><ChevronLeft size={16} /> Back to invoice</Link>
      <div className="grid gap-8 md:grid-cols-5">
        <section className="md:col-span-3">
          <div className="mb-6"><Logo size={26} /></div>
          <h1 className="text-3xl">Pay {inv.number}</h1>
          <p className="mt-1 text-sm text-ink-500">Foxglove Studio · due {fullDate(dueDay(inv))}</p>

          <h2 className="mb-3 mt-8 font-sans text-sm font-semibold">Payment method</h2>
          <div className="space-y-2.5">
            {([
              { id: 'saved', icon: <CreditCard size={18} />, title: 'Visa ending 4417', sub: 'Expires 08/28' },
              { id: 'bank', icon: <Building2 size={18} />, title: 'Bank account ending 0382', sub: 'ACH direct debit · arrives in 1 to 2 days' },
              { id: 'new', icon: <CreditCard size={18} />, title: 'Use a different card', sub: 'Visa, Mastercard or American Express' },
            ] as const).map((m) => (
              <label key={m.id} className={clsx('flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition', method === m.id ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300')}>
                <input type="radio" name="method" className="h-4 w-4 accent-[#7538e2]" checked={method === m.id} onChange={() => setMethod(m.id)} />
                <span className="text-ink-600">{m.icon}</span>
                <span className="flex-1"><span className="block text-sm font-semibold text-ink-900">{m.title}</span><span className="text-xs text-ink-500">{m.sub}</span></span>
              </label>
            ))}
          </div>

          {method === 'new' && (
            <div className="pop mt-4 grid gap-3 rounded-xl border border-ink-200 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Field label="Name on card"><input className="input" autoComplete="off" defaultValue={c.contact} /></Field></div>
              <div className="sm:col-span-2"><Field label="Card number"><input className="input" inputMode="numeric" autoComplete="off" placeholder="1234 5678 9012 3456" /></Field></div>
              <Field label="Expiry"><input className="input" autoComplete="off" placeholder="MM / YY" /></Field>
              <Field label="Security code"><input className="input" autoComplete="off" placeholder="CVC" /></Field>
            </div>
          )}

          <button className="btn-primary mt-6 w-full py-3.5 text-base" disabled={phase === 'processing'} onClick={go}>
            {phase === 'processing' ? <><span className="spin h-4 w-4 rounded-full border-2 border-white/40 border-t-white" /> Processing payment…</> : <>Pay {money(t.total)}</>}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400"><ShieldCheck size={14} /> Payments are encrypted and processed securely.</p>
        </section>

        <aside className="md:col-span-2">
          <div className="card sticky top-24 p-5">
            <h2 className="font-sans text-sm font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3">
              {inv.lines.map((l) => <li key={l.id} className="flex justify-between gap-4 text-sm"><span className="text-ink-700">{l.description}</span><span className="tabnum shrink-0 font-medium">{money(lineAmount(l))}</span></li>)}
            </ul>
            <div className="mt-4 space-y-1.5 border-t border-ink-200 pt-4 text-sm">
              <div className="flex justify-between text-ink-600"><span>Subtotal</span><span className="tabnum">{money(t.subtotal)}</span></div>
              <div className="flex justify-between text-ink-600"><span>{taxLabel(inv.taxRate)}</span><span className="tabnum">{money(t.tax)}</span></div>
              <div className="flex justify-between pt-2 font-display text-xl font-bold"><span>Total due</span><span className="tabnum">{money(t.total)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
