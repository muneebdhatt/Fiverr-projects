'use client';
import clsx from 'clsx';
import { AGENCY, client } from '@/data/static';
import type { Invoice } from '@/data/types';
import { dueDay, lineAmount, shownStatus, taxLabel, totalsOf } from '@/data/calc';
import { fullDate, hrs, money } from '@/lib/util';
import { Logo } from './ui';

type Props = {
  invoice: Pick<Invoice, 'number' | 'clientId' | 'issued' | 'terms' | 'status' | 'lines' | 'taxRate' | 'note' | 'paidDay' | 'paidMethod'>;
  /** Team view shows hours and rate per line. The client view shows the description and amount only. */
  showRates: boolean;
  compact?: boolean;
};

export function InvoiceDoc({ invoice: inv, showRates, compact }: Props) {
  const c = client(inv.clientId);
  const t = totalsOf(inv.lines, inv.taxRate);
  const st = shownStatus(inv);
  return (
    <div className={clsx('relative rounded-xl border border-ink-200 bg-white shadow-card', compact ? 'p-5' : 'p-6 sm:p-9')}>
      {st === 'paid' && (
        <div className="pointer-events-none absolute right-6 top-24 hidden -rotate-12 rounded-lg border-4 border-brand-600 px-4 py-1 font-display text-2xl font-bold uppercase tracking-widest text-brand-600/80 sm:block">Paid</div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Logo size={30} />
          <p className="mt-3 text-sm text-ink-500">{AGENCY}<br />418 Mercer Lane, Suite 6<br />Portland, OR 97205<br />billing@foxglove.example.com</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Invoice</p>
          <p className="font-display text-2xl font-bold">{inv.number}</p>
          <p className="mt-2 text-sm text-ink-500">Issued {fullDate(inv.issued)}<br />Due {fullDate(dueDay(inv))} (Net {inv.terms})</p>
        </div>
      </div>

      <div className="mt-7 grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Bill to</p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{c.name}</p>
          <p className="text-sm text-ink-500">Attn: {c.contact}<br />{c.contactEmail}</p>
        </div>
        <div className="sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Amount due</p>
          <p className="tabnum mt-1 font-display text-3xl font-bold">{st === 'paid' ? money(0) : money(t.total)}</p>
          {st === 'paid' && inv.paidDay !== undefined && <p className="text-xs text-ink-500">Paid {fullDate(inv.paidDay)}{inv.paidMethod ? ` by ${inv.paidMethod.toLowerCase()}` : ''}</p>}
        </div>
      </div>

      <div className="mt-7 overflow-x-auto">
        <table className="w-full min-w-[420px]">
          <thead className="border-y border-ink-200"><tr><th className="py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500">Description</th>{showRates && <><th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">Hours</th><th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">Rate</th></>}<th className="py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">Amount</th></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {inv.lines.map((l) => (
              <tr key={l.id}>
                <td className="py-3 pr-3 text-sm text-ink-800">{l.description}</td>
                {showRates && <><td className="tabnum py-3 text-right text-sm text-ink-600">{hrs(l.hours).replace(' h', '')}</td><td className="tabnum py-3 text-right text-sm text-ink-600">{money(l.rate)}</td></>}
                <td className="tabnum py-3 text-right text-sm font-medium text-ink-900">{money(lineAmount(l))}</td>
              </tr>
            ))}
            {inv.lines.length === 0 && <tr><td colSpan={showRates ? 4 : 2} className="py-8 text-center text-sm text-ink-400">No lines yet</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
        {showRates && <div className="flex justify-between text-ink-500"><span>Total hours</span><span className="tabnum">{hrs(t.hours)}</span></div>}
        <div className="flex justify-between text-ink-600"><span>Subtotal</span><span className="tabnum">{money(t.subtotal)}</span></div>
        <div className="flex justify-between text-ink-600"><span>{taxLabel(inv.taxRate)}</span><span className="tabnum">{money(t.tax)}</span></div>
        <div className="flex justify-between border-t border-ink-200 pt-2 font-display text-lg font-bold text-ink-900"><span>Total</span><span className="tabnum">{money(t.total)}</span></div>
      </div>

      {inv.note && <p className="mt-6 rounded-lg bg-ink-50 p-3.5 text-sm text-ink-600">{inv.note}</p>}
      <p className="mt-6 text-xs text-ink-400">Pay online from your client portal, or by bank transfer to Foxglove Studio, account ending 7714. Thank you for your business.</p>
    </div>
  );
}
