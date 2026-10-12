'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, Search } from 'lucide-react';
import { ACCOUNTS, CLIENTS, client } from '@/data/static';
import { dueDay, invoiceTotals, shownStatus, type ShownStatus } from '@/data/calc';
import { useApp, useEntries, useInvoices } from '@/lib/store';
import { totalsAll } from '@/lib/derive';
import { dueShort, fullDate, money, moneyRound, r2 } from '@/lib/util';
import { EmptyState, InvoiceChip, PageHead, PageSkeleton, Stat, Tabs, useLoading } from '@/shell/ui';

type Tab = 'all' | ShownStatus;

export default function InvoicesPage() {
  const role = useApp((s) => s.role)!;
  const loading = useLoading('invoices-' + role);
  const router = useRouter();
  const all = useInvoices();
  const entries = useEntries();
  const myClient = ACCOUNTS.client.clientId;
  const base = useMemo(() => (role === 'client' ? all.filter((i) => i.clientId === myClient && i.status !== 'draft') : all), [all, role, myClient]);
  const [tab, setTab] = useState<Tab>('all');
  const [q, setQ] = useState('');
  const [cid, setCid] = useState('all');
  const [sort, setSort] = useState<'issued' | 'amount' | 'due'>('issued');

  const counts = (s: ShownStatus) => base.filter((i) => shownStatus(i) === s).length;
  const list = useMemo(() => {
    let l = base.filter((i) => (tab === 'all' || shownStatus(i) === tab) && (cid === 'all' || i.clientId === cid));
    if (q.trim()) l = l.filter((i) => `${i.number} ${client(i.clientId).name}`.toLowerCase().includes(q.trim().toLowerCase()));
    return l.slice().sort((a, b) => (sort === 'amount' ? invoiceTotals(b).total - invoiceTotals(a).total : sort === 'due' ? dueDay(a) - dueDay(b) : b.issued - a.issued || b.number.localeCompare(a.number)));
  }, [base, tab, q, cid, sort]);

  if (loading) return <PageSkeleton />;
  const t = totalsAll(entries, all);
  const clientDue = r2(base.filter((i) => i.status === 'sent').reduce((n, i) => n + invoiceTotals(i).total, 0));
  const owner = role === 'owner';

  return (
    <div>
      <PageHead
        title="Invoices"
        sub={owner ? `${all.length} invoices across ${CLIENTS.length} clients` : 'Your invoices from Foxglove Studio'}
        actions={owner ? <Link href="/invoices/new" className="btn-primary"><Plus size={16} /> New invoice</Link> : undefined}
      />
      {owner ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Outstanding" value={moneyRound(t.outstanding)} sub={`${counts('sent') + counts('overdue')} open invoices`} />
          <Stat label="Overdue" value={moneyRound(t.overdue)} tone={t.overdue ? 'ember' : undefined} sub={`${counts('overdue')} past due`} />
          <Stat label="Drafts" value={moneyRound(t.drafts)} sub={`${counts('draft')} not yet sent`} />
          <Stat label="Collected, 30 days" value={moneyRound(t.paid30)} sub="Payments received" />
        </div>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Balance due" value={money(clientDue)} sub={`${counts('sent') + counts('overdue')} open invoice${counts('sent') + counts('overdue') === 1 ? '' : 's'}`} />
          <Stat label="Paid to date" value={moneyRound(r2(base.filter((i) => i.status === 'paid').reduce((n, i) => n + invoiceTotals(i).total, 0)))} sub={`${counts('paid')} invoices`} />
        </div>
      )}

      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'all', label: 'All', count: base.length },
          ...(owner ? [{ id: 'draft' as Tab, label: 'Draft', count: counts('draft') }] : []),
          { id: 'sent', label: 'Awaiting payment', count: counts('sent') },
          { id: 'overdue', label: 'Overdue', count: counts('overdue') },
          { id: 'paid', label: 'Paid', count: counts('paid') },
        ]}
      />
      <div className="my-4 flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
          <input className="input pl-10" placeholder={owner ? 'Search by number or client' : 'Search by number'} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search invoices" />
        </div>
        {owner && (
          <select className="input w-auto" value={cid} onChange={(e) => setCid(e.target.value)} aria-label="Filter by client">
            <option value="all">All clients</option>
            {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        )}
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="issued">Sort: newest</option>
          <option value="due">Sort: due date</option>
          <option value="amount">Sort: amount</option>
        </select>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px]">
          <thead className="border-b border-ink-100 bg-ink-50"><tr><th className="th">Invoice</th>{owner && <th className="th">Client</th>}<th className="th">Issued</th><th className="th">Due</th><th className="th text-right">Amount</th><th className="th">Status</th><th className="th" /></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {list.map((i) => {
              const st = shownStatus(i);
              return (
                <tr key={i.id} className="cursor-pointer hover:bg-ink-50" onClick={() => router.push(`/invoices/${i.id}`)}>
                  <td className="td font-semibold text-ink-900">{i.number}</td>
                  {owner && <td className="td">{client(i.clientId).name}</td>}
                  <td className="td whitespace-nowrap">{fullDate(i.issued)}</td>
                  <td className="td whitespace-nowrap">{st === 'paid' ? '–' : dueShort(dueDay(i))}</td>
                  <td className="td tabnum text-right font-medium text-ink-900">{money(invoiceTotals(i).total)}</td>
                  <td className="td"><InvoiceChip status={st} /></td>
                  <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                    {!owner && (st === 'sent' || st === 'overdue') && <Link href={`/pay/${i.id}`} className="btn-primary btn-sm">Pay now</Link>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <EmptyState icon={<FileText size={22} />} title="No invoices match" body="Try another tab or clear the search." action={<button className="btn-ghost btn-sm" onClick={() => { setTab('all'); setQ(''); setCid('all'); }}>Clear filters</button>} />}
      </div>
    </div>
  );
}
