'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Mail, Phone, Search } from 'lucide-react';
import { CLIENTS, project, projectsOf } from '@/data/static';
import type { Client } from '@/data/types';
import { shownStatus } from '@/data/calc';
import { useApp, useEntries, useInvoices } from '@/lib/store';
import { clientStats } from '@/lib/derive';
import { coverage } from '@/lib/search';
import { fullDate, moneyRound } from '@/lib/util';
import { Avatar, Chip, Drawer, EmptyState, InvoiceChip, PageHead, PageSkeleton, useLoading } from '@/shell/ui';

type SortKey = 'name' | 'outstanding' | 'unbilled';

export default function ClientsPage() {
  const loading = useLoading('clients');
  const entries = useEntries();
  const invoices = useInvoices();
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [open, setOpen] = useState<Client | null>(null);
  const toast = useApp((s) => s.toast);

  const rows = useMemo(() => {
    const l = CLIENTS.map((c) => ({ c, s: clientStats(c.id, entries, invoices) })).filter(({ c }) => !q.trim() || coverage(q, `${c.name} ${c.contact} ${c.city}`) > 0.5);
    return l.sort((a, b) => (sort === 'outstanding' ? b.s.outstanding - a.s.outstanding : sort === 'unbilled' ? b.s.unbilledAmount - a.s.unbilledAmount : a.c.name.localeCompare(b.c.name)));
  }, [entries, invoices, q, sort]);

  if (loading) return <PageSkeleton />;
  return (
    <div>
      <PageHead title="Clients" sub={`${CLIENTS.length} clients · ${moneyRound(rows.reduce((n, r) => n + r.s.invoiced, 0))} invoiced to date`} />
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-52 flex-1"><Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-10" placeholder="Search clients" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search clients" /></div>
        <select className="input w-auto" value={sort} onChange={(e) => setSort(e.target.value as SortKey)} aria-label="Sort"><option value="name">Sort: name</option><option value="outstanding">Sort: outstanding</option><option value="unbilled">Sort: unbilled work</option></select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-ink-100 bg-ink-50"><tr><th className="th">Client</th><th className="th text-right">Projects</th><th className="th text-right">Invoiced</th><th className="th text-right">Outstanding</th><th className="th text-right">Unbilled</th><th className="th">Status</th></tr></thead>
          <tbody className="divide-y divide-ink-100">
            {rows.map(({ c, s }) => (
              <tr key={c.id} className="cursor-pointer hover:bg-ink-50" onClick={() => setOpen(c)}>
                <td className="td"><span className="flex items-center gap-3"><Avatar name={c.name} size={34} /><span><span className="block font-semibold text-ink-900">{c.name}</span><span className="text-xs text-ink-500">{c.contact} · {c.city}</span></span></span></td>
                <td className="td tabnum text-right">{s.projects}</td>
                <td className="td tabnum text-right">{moneyRound(s.invoiced)}</td>
                <td className="td tabnum text-right font-medium text-ink-900">{moneyRound(s.outstanding)}</td>
                <td className="td tabnum text-right">{moneyRound(s.unbilledAmount)}</td>
                <td className="td">{s.overdue > 0 ? <Chip tone="ember">Overdue {moneyRound(s.overdue)}</Chip> : s.outstanding > 0 ? <Chip tone="brand">Awaiting payment</Chip> : <Chip tone="gray">Up to date</Chip>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <EmptyState icon={<Search size={22} />} title="No clients match" body="Try a different name." />}
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} title={open && <div><p className="font-display text-xl font-bold">{open.name}</p><p className="text-sm text-ink-500">Client since {fullDate(open.since)}</p></div>} footer={open && <div className="flex gap-2"><Link href={`/invoices/new?client=${open.id}`} className="btn-primary flex-1">Create invoice</Link><button className="btn-ghost" onClick={() => toast(`Opened a message to ${open.contact}`)}><Mail size={16} /> Email</button></div>}>
        {open && (() => {
          const s = clientStats(open.id, entries, invoices);
          const inv = invoices.filter((i) => i.clientId === open.id).sort((a, b) => b.issued - a.issued);
          return (
            <div className="space-y-6">
              <div className="rounded-xl bg-ink-50 p-4 text-sm"><p className="font-semibold text-ink-900">{open.contact}</p><p className="text-ink-500">{open.contactTitle}</p><p className="mt-2 flex items-center gap-2 text-ink-600"><Mail size={14} /> {open.contactEmail}</p><p className="mt-1 flex items-center gap-2 text-ink-600"><Phone size={14} /> {open.phone}</p><p className="mt-2 text-xs text-ink-500">Net {open.terms} · sales tax {(open.taxRate * 100).toFixed(2).replace(/\.?0+$/, '')}%</p></div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl border border-ink-200 p-3"><p className="tabnum font-display text-lg font-bold">{moneyRound(s.paid)}</p><p className="text-[11px] text-ink-500">Paid</p></div>
                <div className="rounded-xl border border-ink-200 p-3"><p className="tabnum font-display text-lg font-bold">{moneyRound(s.outstanding)}</p><p className="text-[11px] text-ink-500">Outstanding</p></div>
                <div className="rounded-xl border border-ink-200 p-3"><p className="tabnum font-display text-lg font-bold">{moneyRound(s.unbilledAmount)}</p><p className="text-[11px] text-ink-500">Unbilled</p></div>
              </div>
              <div><h3 className="mb-2 font-sans text-sm font-semibold">Projects</h3><ul className="space-y-1.5">{projectsOf(open.id).map((p) => <li key={p.id}><Link href={`/projects/${p.id}`} className="block rounded-lg border border-ink-200 px-3 py-2 text-sm font-medium hover:bg-ink-50">{project(p.id).name}</Link></li>)}</ul></div>
              <div><h3 className="mb-2 font-sans text-sm font-semibold">Invoices</h3><ul className="divide-y divide-ink-100 rounded-xl border border-ink-200">{inv.map((i) => <li key={i.id}><Link href={`/invoices/${i.id}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-ink-50"><span className="font-medium">{i.number}</span><InvoiceChip status={shownStatus(i)} /></Link></li>)}</ul></div>
              <div className="rounded-xl border border-ink-200 p-4 text-sm"><p className="text-xs font-semibold uppercase tracking-wider text-ink-400">Internal note (never shown to the client)</p><p className="mt-1.5 text-ink-700">{open.internalNote}</p></div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
