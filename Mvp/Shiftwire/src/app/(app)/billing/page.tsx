'use client';
import { useState } from 'react';
import { CalendarClock, CreditCard, Download, ReceiptText } from 'lucide-react';
import { INVOICES, PRICE } from '@/data/seed';
import { dateFromOffset, money } from '@/lib/format';
import { useApp, useMyShifts } from '@/lib/store';
import { Chip, Field, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

const longDay = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export default function BillingPage() {
  const nextChargeDays = useApp((s) => s.nextChargeDays);
  const bizName = useApp((s) => s.bizName);
  const toast = useApp((s) => s.toast);
  const shifts = useMyShifts();
  const loading = useLoading('billing');
  const [cardOpen, setCardOpen] = useState(false);
  const [card, setCard] = useState('4242 4242 4242 4242');
  const [exp, setExp] = useState('08 / 29');
  const [last4, setLast4] = useState('4242');
  const [busy, setBusy] = useState(false);
  const sentThisMonth = shifts.reduce((a, s) => a + s.sent, 0);
  const monthStart = new Date().getDate();
  const thisMonth = shifts.filter((s) => s.dayOffset > -monthStart).length;
  const fresh = nextChargeDays >= 28;
  const invoices = fresh ? [{ id: 'INV-2108', monthsAgo: 0, amount: PRICE }] : INVOICES;

  if (loading) return <div className="space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  return (
    <div>
      <PageHeader title="Billing" subtitle={`Plan and invoices for ${bizName}.`} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div data-tour="billing-plan" className="card p-5 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2"><h2 className="text-lg font-semibold">Shiftwire for business</h2><Chip tone="green">Active</Chip></div>
              <p className="mt-1 text-sm text-ink-500">Unlimited broadcasts, 12 workers per shift.</p>
            </div>
            <p className="text-right"><span className="text-3xl font-semibold">{money(PRICE)}</span><span className="text-sm text-ink-500">/month</span></p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-50 p-3.5"><p className="flex items-center gap-1.5 text-xs text-ink-500"><CalendarClock size={14} />Next charge</p><p className="mt-1 text-sm font-semibold">{longDay(nextChargeDays)}</p><p className="text-xs text-ink-500">{money(PRICE)}.00</p></div>
            <div className="rounded-xl bg-ink-50 p-3.5"><p className="text-xs text-ink-500">Shifts this month</p><p className="mt-1 text-sm font-semibold">{thisMonth}</p><p className="text-xs text-ink-500">No overage fees</p></div>
            <div className="rounded-xl bg-ink-50 p-3.5"><p className="text-xs text-ink-500">Texts sent this month</p><p className="mt-1 text-sm font-semibold">{sentThisMonth}</p><p className="text-xs text-ink-500">Included in plan</p></div>
          </div>
        </div>
        <div className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><CreditCard size={16} />Payment method</h2>
          <div className="mt-4 rounded-xl bg-gradient-to-br from-[#0e1a2c] to-[#0a5e6e] p-4 text-white">
            <p className="text-xs text-[#c9eef0]">Visa</p>
            <p className="mt-4 text-lg tracking-widest">•••• •••• •••• {last4}</p>
            <p className="mt-2 text-xs text-[#c9eef0]">Expires {exp}</p>
          </div>
          <button className="btn-ghost mt-4 w-full" onClick={() => setCardOpen(true)}>Update card</button>
        </div>
      </div>

      <div className="card mt-6">
        <div className="flex items-center gap-2 border-b border-ink-100 px-5 py-4"><ReceiptText size={16} /><h2 className="text-sm font-semibold">Invoices</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px]">
            <thead className="bg-ink-50"><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Amount</th><th className="th">Status</th><th className="th" /></tr></thead>
            <tbody className="divide-y divide-ink-100">
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td className="td font-medium text-ink-900">{inv.id}</td>
                  <td className="td">{longDay(nextChargeDays - 30 * (inv.monthsAgo + 1))}</td>
                  <td className="td">{money(inv.amount)}.00</td>
                  <td className="td"><Chip tone="green">Paid</Chip></td>
                  <td className="td text-right"><button className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:underline" onClick={() => toast(`${inv.id} receipt downloaded`)}><Download size={14} />Receipt</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={cardOpen} onClose={() => setCardOpen(false)} title="Update payment method">
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setBusy(true); setTimeout(() => { setBusy(false); setLast4(card.replace(/\D/g, '').slice(-4) || last4); setCardOpen(false); toast('Payment method updated'); }, 900); }}>
          <Field label="Card number"><input className="input" autoComplete="off" inputMode="numeric" value={card} onChange={(e) => setCard(e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim())} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry"><input className="input" autoComplete="off" value={exp} onChange={(e) => setExp(e.target.value)} /></Field>
            <Field label="CVC"><input className="input" autoComplete="off" defaultValue="123" /></Field>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save card'}</button>
        </form>
      </Modal>
    </div>
  );
}
