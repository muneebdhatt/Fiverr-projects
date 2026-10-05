'use client';
import { useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, CreditCard, Download, Lock, Receipt, Zap } from 'lucide-react';
import { PLANS } from '@/data/seed';
import type { Plan, PlanId } from '@/data/types';
import { currentUserId, useApp, useOrg } from '@/lib/store';
import { Chip, Field, Logo, Modal, PageHeader, ProgressBar, Skeleton, useLoading } from '@/shell/ui';
import clsx from 'clsx';

const ORDER: PlanId[] = ['starter', 'team', 'business'];
const PACKS = [
  { credits: 100, price: 9, note: 'A few extra summaries' },
  { credits: 500, price: 39, note: 'Most popular' },
  { credits: 1000, price: 69, note: 'Best value' },
];
interface Invoice { id: string; label: string; date: string; amount: number }
const day = (offset: number) => new Date(Date.now() + offset * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function BillingPage() {
  const { org, plan, bonus, used, seatsUsed } = useOrg();
  const loading = useLoading(org.id);
  const persona = useApp((s) => s.persona);
  const { upgradePlan, topUp, addPurchase, log, toast } = useApp();
  const allPurchases = useApp((s) => s.purchases);
  const [packOpen, setPackOpen] = useState(false);
  const [pack, setPack] = useState(1);
  const [packStep, setPackStep] = useState<'review' | 'processing' | 'done'>('review');
  const [receipt, setReceipt] = useState<Invoice | null>(null);
  const [target, setTarget] = useState<Plan | null>(null);
  const [step, setStep] = useState<'review' | 'processing' | 'done'>('review');
  const [email, setEmail] = useState('billing@northwind-studio.example.com');

  const mine = allPurchases.filter((x) => x.orgId === org.id);
  const invoices: Invoice[] = [
    ...mine.map((x, i) => ({ id: `INV-${2050 + mine.length - i}`, label: x.label, date: new Date(x.at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), amount: x.amount })),
    { id: 'INV-2041', label: `${plan.name} plan, monthly`, date: day(-18), amount: plan.price },
    { id: 'INV-1987', label: `${plan.name} plan, monthly`, date: day(-48), amount: plan.price },
    { id: 'INV-1930', label: `${plan.name} plan, monthly`, date: day(-78), amount: plan.price },
  ];

  function buy(e: React.FormEvent) {
    e.preventDefault();
    const chosen = PACKS[pack];
    setPackStep('processing');
    setTimeout(() => {
      topUp(org.id, chosen.credits);
      addPurchase(org.id, `${chosen.credits.toLocaleString()} extra AI credits`, chosen.price);
      log(org.id, currentUserId(persona), 'Bought credits', `${chosen.credits} AI credits`);
      setPackStep('done');
      toast(`${chosen.credits.toLocaleString()} credits added to ${org.name}`);
    }, 1300);
  }

  function open(p: Plan) { setTarget(p); setStep('review'); setEmail(`billing@${org.id}.example.com`); }
  function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!target) return;
    setStep('processing');
    setTimeout(() => {
      upgradePlan(org.id, target.id);
      addPurchase(org.id, `Plan change: ${plan.name} to ${target.name}`, Math.max(target.price - plan.price * 0.4, 0));
      log(org.id, currentUserId(persona), 'Changed plan', `${plan.name} to ${target.name}`);
      setStep('done');
      toast(`${org.name} is now on the ${target.name} plan`);
    }, 1500);
  }

  if (loading) return <div className="space-y-4"><Skeleton className="h-9 w-48" /><Skeleton className="h-40" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div></div>;

  return (
    <div>
      <PageHeader title="Billing" subtitle={`Plan and invoices for ${org.name}`}
        actions={<button className="btn-ghost" onClick={() => { setPackStep('review'); setPackOpen(true); }}><Zap size={16} />Buy credits</button>} />
      <div className="card mb-6 grid gap-6 p-5 md:grid-cols-3">
        <div><p className="text-sm text-ink-500">Current plan</p><p className="mt-1 flex items-center gap-2 text-2xl font-semibold">{plan.name}<Chip tone="green">Active</Chip></p><p className="mt-1 text-sm text-ink-500">${plan.price} per month · renews {day(12)}</p></div>
        <div><p className="flex items-center gap-2 text-sm text-ink-500">AI credits{bonus > 0 && <Chip tone="teal">+{bonus.toLocaleString()} extra</Chip>}</p><p className="mt-1 text-2xl font-semibold">{used.toLocaleString()} <span className="text-base font-normal text-ink-400">/ {plan.credits.toLocaleString()}</span></p><div className="mt-2"><ProgressBar value={used} max={plan.credits} /></div></div>
        <div><p className="text-sm text-ink-500">Seats</p><p className="mt-1 text-2xl font-semibold">{seatsUsed} <span className="text-base font-normal text-ink-400">/ {plan.seats}</span></p><div className="mt-2"><ProgressBar value={seatsUsed} max={plan.seats} tone="brand" /></div></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {ORDER.map((id) => {
          const p = PLANS[id];
          const current = p.id === plan.id;
          const tooSmall = seatsUsed > p.seats;
          const higher = ORDER.indexOf(p.id) > ORDER.indexOf(plan.id);
          return (
            <div key={p.id} className={clsx('card relative flex flex-col p-6', current && 'border-brand-500 ring-2 ring-brand-100')}>
              {current && <span className="absolute -top-3 left-6"><Chip tone="brand">Current plan</Chip></span>}
              {p.id === 'team' && !current && <span className="absolute -top-3 left-6"><Chip tone="teal">Most popular</Chip></span>}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{p.tagline}</p>
              <p className="mt-5"><span className="text-4xl font-semibold tracking-tight">${p.price}</span><span className="text-sm text-ink-500"> / month</span></p>
              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-ink-700">
                {p.features.map((f) => <li key={f} className="flex gap-2.5"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{f}</li>)}
              </ul>
              <button className={clsx('mt-6', current ? 'btn-ghost' : higher ? 'btn-primary' : 'btn-ghost')} disabled={current || tooSmall} onClick={() => open(p)}>
                {current ? 'Your current plan' : tooSmall ? `Has ${seatsUsed} seats, needs ${p.seats} or fewer` : higher ? <>Upgrade to {p.name}<ArrowUpRight size={16} /></> : `Switch to ${p.name}`}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card mt-6">
        <div className="border-b border-ink-100 px-5 py-4"><h2 className="font-semibold">Invoices</h2></div>
        <table className="w-full"><thead className="bg-ink-50/60"><tr><th className="th">Invoice</th><th className="th">Date</th><th className="th">Amount</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {invoices.map((i) => (
              <tr key={i.id} className="hover:bg-ink-50/60"><td className="td font-medium"><button className="text-brand-600 hover:underline" onClick={() => setReceipt(i)}>{i.id}</button></td><td className="td">{i.date}</td><td className="td">${i.amount.toFixed(2)}</td><td className="td"><Chip tone="green">Paid</Chip></td>
                <td className="td text-right"><button className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:underline" onClick={() => setReceipt(i)}><Receipt size={14} />View</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!target} onClose={() => step !== 'processing' && setTarget(null)} title={step === 'done' ? 'Plan updated' : `Change to ${target?.name}`}>
        {target && step === 'done' && (
          <div className="py-4 text-center">
            <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
            <h3 className="mt-3 text-lg font-semibold">You are on the {target.name} plan</h3>
            <p className="mt-1 text-sm text-ink-500">{target.seats} seats and {target.credits.toLocaleString()} AI credits a month are available now.</p>
            <button className="btn-primary mt-6 w-full" onClick={() => setTarget(null)}>Back to billing</button>
          </div>
        )}
        {target && step !== 'done' && (
          <form onSubmit={pay} className="space-y-5">
            <div className="rounded-xl bg-ink-50 p-4 text-sm">
              <div className="flex justify-between"><span className="text-ink-600">{target.name} plan, monthly</span><span className="font-medium">${target.price.toFixed(2)}</span></div>
              <div className="mt-1 flex justify-between text-ink-500"><span>Credit for unused time on {plan.name}</span><span>-${(plan.price * 0.4).toFixed(2)}</span></div>
              <div className="mt-3 flex justify-between border-t border-ink-200 pt-3 text-base font-semibold"><span>Due today</span><span>${Math.max(target.price - plan.price * 0.4, 0).toFixed(2)}</span></div>
            </div>
            <Field label="Billing email"><input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            <div>
              <p className="mb-1.5 text-sm font-medium text-ink-700">Payment method</p>
              <div className="flex items-center gap-3 rounded-lg border border-brand-300 bg-brand-50/50 p-3">
                <CreditCard size={20} className="text-brand-600" /><div className="flex-1 text-sm"><p className="font-medium">Visa ending in 4242</p><p className="text-xs text-ink-500">Default card · expires 08/28</p></div><Check size={18} className="text-brand-600" />
              </div>
            </div>
            <button className="btn-primary w-full py-2.5" disabled={step === 'processing'}>
              {step === 'processing' ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing payment…</> : <><Lock size={15} />Confirm and pay ${Math.max(target.price - plan.price * 0.4, 0).toFixed(2)}</>}
            </button>
            <p className="text-center text-xs text-ink-400">Payments are encrypted. Cancel or change plans at any time.</p>
          </form>
        )}
      </Modal>

      <Modal open={packOpen} onClose={() => packStep !== 'processing' && setPackOpen(false)} title={packStep === 'done' ? 'Credits added' : 'Buy extra AI credits'}>
        {packStep === 'done' ? (
          <div className="py-4 text-center">
            <CheckCircle2 size={52} className="mx-auto text-emerald-500" />
            <h3 className="mt-3 text-lg font-semibold">{PACKS[pack].credits.toLocaleString()} credits added</h3>
            <p className="mt-1 text-sm text-ink-500">{org.name} now has {plan.credits.toLocaleString()} credits this cycle. Extra credits are used first and never expire mid-cycle.</p>
            <button className="btn-primary mt-6 w-full" onClick={() => setPackOpen(false)}>Done</button>
          </div>
        ) : (
          <form onSubmit={buy} className="space-y-5">
            <div className="grid gap-2.5">
              {PACKS.map((k, idx) => (
                <button type="button" key={k.credits} onClick={() => setPack(idx)}
                  className={clsx('flex items-center justify-between rounded-xl border p-3.5 text-left transition', pack === idx ? 'border-brand-500 bg-brand-50/50 ring-2 ring-brand-100' : 'border-ink-200 hover:bg-ink-50')}>
                  <span><span className="block font-semibold">{k.credits.toLocaleString()} credits</span><span className="block text-xs text-ink-500">{k.note}</span></span>
                  <span className="text-lg font-semibold">${k.price}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-ink-200 p-3">
              <CreditCard size={20} className="text-brand-600" /><div className="flex-1 text-sm"><p className="font-medium">Visa ending in 4242</p><p className="text-xs text-ink-500">Default card · expires 08/28</p></div><Check size={18} className="text-brand-600" />
            </div>
            <button className="btn-primary w-full py-2.5" disabled={packStep === 'processing'}>
              {packStep === 'processing' ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />Processing payment…</> : <><Lock size={15} />Pay ${PACKS[pack].price}.00</>}
            </button>
          </form>
        )}
      </Modal>

      <Modal open={!!receipt} onClose={() => setReceipt(null)} title="Receipt" width="max-w-lg">
        {receipt && (
          <div>
            <div className="flex items-start justify-between">
              <Logo size={26} />
              <div className="text-right text-sm"><p className="font-semibold">{receipt.id}</p><p className="text-ink-500">{receipt.date}</p></div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs uppercase tracking-wide text-ink-400">Billed to</p><p className="mt-1 font-medium">{org.name}</p><p className="text-ink-500">billing@{org.id}.example.com</p></div>
              <div><p className="text-xs uppercase tracking-wide text-ink-400">Payment</p><p className="mt-1 font-medium">Visa ending in 4242</p><p className="text-ink-500">Paid in full</p></div>
            </div>
            <table className="mt-6 w-full text-sm">
              <thead className="border-b border-ink-100 text-left text-xs uppercase tracking-wide text-ink-400"><tr><th className="py-2 font-semibold">Description</th><th className="py-2 text-right font-semibold">Amount</th></tr></thead>
              <tbody><tr className="border-b border-ink-100"><td className="py-3">{receipt.label}</td><td className="py-3 text-right">${receipt.amount.toFixed(2)}</td></tr>
                <tr><td className="pt-3 text-ink-500">Tax</td><td className="pt-3 text-right text-ink-500">$0.00</td></tr></tbody>
              <tfoot><tr><td className="pt-3 text-base font-semibold">Total paid</td><td className="pt-3 text-right text-base font-semibold">${receipt.amount.toFixed(2)}</td></tr></tfoot>
            </table>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setReceipt(null)}>Close</button>
              <button className="btn-primary" onClick={() => { toast(`${receipt.id} downloaded`, 'info'); setReceipt(null); }}><Download size={15} />Download PDF</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
