'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, Building2, CircleDollarSign, Cpu, PauseCircle, Plus, Search, X } from 'lucide-react';
import { ADMIN_ORGS, AI_COST_PER_CREDIT, INDUSTRIES, ORGS, PLANS, REGIONS, adminFromCustom } from '@/data/seed';
import type { PlanId } from '@/data/types';
import { currentUserId, useApp } from '@/lib/store';
import { Chip, EmptyState, Field, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';
import { USERS } from '@/data/seed';

export default function AdminPage() {
  const loading = useLoading('admin');
  const { suspended, toggleSuspend, creditsUsed, planIds, invited, removedUsers, orgProfile, persona, log, toast, setOrg, customOrgs, addOrg, bulkSuspend, bulkPlan } = useApp();
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkConfirm, setBulkConfirm] = useState<'suspend' | 'reinstate' | null>(null);
  const [bulkPlanId, setBulkPlanId] = useState<'' | PlanId>('');
  const router = useRouter();
  const [q, setQ] = useState('');
  const [plan, setPlan] = useState<'all' | PlanId>('all');
  const [confirm, setConfirm] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', industry: INDUSTRIES[0], planId: 'starter' as PlanId, email: '', region: REGIONS[0] });
  const [err, setErr] = useState('');
  const set = (k: keyof typeof form, v: string) => { setForm((f) => ({ ...f, [k]: v })); setErr(''); };

  function create(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    if (!name) return setErr('Enter the organisation name.');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid owner email address.');
    const taken = [...ORGS, ...customOrgs].some((o) => o.name.toLowerCase() === name.toLowerCase());
    if (taken) return setErr('An organisation with that name already exists.');
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'org';
    const id = `${base}-${customOrgs.length + 1}`;
    const ownerName = email.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    addOrg({ id, name, industry: form.industry, planId: form.planId, ownerName, ownerEmail: email, region: form.region });
    log(id, currentUserId(persona), 'Created organisation', name);
    toast(`${name} has been created`);
    setOpen(false);
    setForm({ name: '', industry: INDUSTRIES[0], planId: 'starter', email: '', region: REGIONS[0] });
  }

  const orgs = useMemo(() => [...ADMIN_ORGS, ...customOrgs.map(adminFromCustom)].map((o) => {
    const live = true;
    return {
      ...o,
      name: orgProfile[o.id]?.name ?? o.name,
      region: orgProfile[o.id]?.region ?? o.region,
      planId: planIds[o.id] ?? o.planId,
      seats: live ? USERS[o.id].filter((u) => !(removedUsers[o.id] ?? []).includes(u.id)).length + (invited[o.id]?.length ?? 0) : o.seats,
      seatLimit: PLANS[planIds[o.id] ?? o.planId].seats,
      aiCost: live ? (creditsUsed[o.id] ?? 0) * AI_COST_PER_CREDIT : o.aiCost,
      suspended: suspended[o.id] ?? o.suspended,
    };
  }), [creditsUsed, planIds, invited, removedUsers, orgProfile, suspended, customOrgs]);

  const rows = orgs.filter((o) => (plan === 'all' || o.planId === plan) && `${o.name} ${o.owner}`.toLowerCase().includes(q.toLowerCase()));
  const mrr = orgs.filter((o) => !o.suspended).reduce((s, o) => s + PLANS[o.planId].price, 0);
  const cost = orgs.reduce((s, o) => s + o.aiCost, 0);
  const target = orgs.find((o) => o.id === confirm);

  function apply() {
    if (!target) return;
    toggleSuspend(target.id);
    log(target.id, currentUserId(persona), target.suspended ? 'Reinstated organisation' : 'Suspended organisation', target.name);
    toast(target.suspended ? `${target.name} has been reinstated` : `${target.name} has been suspended`, target.suspended ? 'success' : 'warn');
    setConfirm(null);
  }

  const me = currentUserId(persona);
  const nameFor = (id: string) => orgs.find((o) => o.id === id)?.name ?? id;
  const allShown = rows.length > 0 && rows.every((o) => selected.includes(o.id));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  function doBulkSuspend(value: boolean) {
    const ids = selected.filter((id) => orgs.find((o) => o.id === id)?.suspended !== value);
    bulkSuspend(ids, value);
    ids.forEach((id) => log(id, me, value ? 'Suspended organisation' : 'Reinstated organisation', nameFor(id)));
    toast(ids.length ? `${ids.length} ${ids.length === 1 ? 'organisation' : 'organisations'} ${value ? 'suspended' : 'reinstated'}` : `Nothing to change: all selected were already ${value ? 'suspended' : 'active'}`, value ? 'warn' : 'success');
    setSelected([]);
    setBulkConfirm(null);
  }

  function doBulkPlan(p: PlanId) {
    const ok = selected.filter((id) => { const o = orgs.find((x) => x.id === id); return !!o && o.planId !== p && o.seats <= PLANS[p].seats; });
    const skipped = selected.length - ok.length;
    bulkPlan(ok, p);
    ok.forEach((id) => log(id, me, 'Changed plan', `${nameFor(id)} to ${PLANS[p].name}`));
    toast(`${ok.length} moved to ${PLANS[p].name}${skipped ? `, ${skipped} left as they were (same plan or too many seats)` : ''}`, ok.length ? 'success' : 'warn');
    setSelected([]);
    setBulkPlanId('');
  }

  const stats = [
    { label: 'Organisations', value: orgs.length, icon: <Building2 size={18} /> },
    { label: 'Monthly recurring revenue', value: `$${mrr.toLocaleString()}`, icon: <CircleDollarSign size={18} /> },
    { label: 'AI cost this month', value: `$${cost.toFixed(2)}`, icon: <Cpu size={18} /> },
    { label: 'Suspended', value: orgs.filter((o) => o.suspended).length, icon: <PauseCircle size={18} /> },
  ];

  return (
    <div>
      <PageHeader title="Super-admin console" subtitle="Every organisation on Quillstack"
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} />New organisation</button>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5"><div className="flex items-center justify-between text-sm text-ink-500">{s.label}<span className="text-brand-500">{s.icon}</span></div><p className="mt-2 text-2xl font-semibold tracking-tight">{s.value}</p></div>
        ))}
      </div>
      <div className="card">
        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input className="input pl-9" placeholder="Search organisations or owners" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search organisations" /></div>
          <select className="input sm:w-44" value={plan} onChange={(e) => setPlan(e.target.value as 'all' | PlanId)} aria-label="Filter by plan"><option value="all">All plans</option><option value="starter">Starter</option><option value="team">Team</option><option value="business">Business</option></select>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 bg-brand-50/60 px-4 py-2.5" role="toolbar" aria-label="Bulk actions">
            <span className="text-sm font-medium text-brand-700">{selected.length} selected</span>
            <button className="btn-ghost px-3 py-1.5" onClick={() => setBulkConfirm('suspend')}>Suspend</button>
            <button className="btn-ghost px-3 py-1.5" onClick={() => setBulkConfirm('reinstate')}>Reinstate</button>
            <select className="input w-44 py-1.5" value={bulkPlanId} aria-label="Change plan for selected" onChange={(e) => { const v = e.target.value as PlanId; if (v) doBulkPlan(v); }}>
              <option value="">Change plan…</option>
              {Object.values(PLANS).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <button className="ml-auto inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800" onClick={() => setSelected([])}><X size={14} />Clear</button>
          </div>
        )}
        {loading ? (
          <div className="space-y-3 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Building2 size={22} />} title="No organisations found" body="Adjust the search or plan filter." action={<button className="btn-ghost" onClick={() => { setQ(''); setPlan('all'); }}>Clear filters</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="border-b border-ink-100 bg-ink-50/60"><tr><th className="th w-10"><input type="checkbox" aria-label="Select all organisations" checked={allShown} onChange={() => setSelected(allShown ? [] : rows.map((o) => o.id))} className="h-4 w-4 rounded border-ink-300 accent-brand-600" /></th><th className="th">Organisation</th><th className="th">Plan</th><th className="th">Seats</th><th className="th text-right">AI cost</th><th className="th">Status</th><th className="th text-right">Workspace</th><th className="th text-right">Suspend</th></tr></thead>
              <tbody className="divide-y divide-ink-100">
                {rows.map((o) => (
                  <tr key={o.id} className={o.suspended ? 'bg-red-50/40' : 'hover:bg-ink-50/60'}>
                    <td className="td"><input type="checkbox" aria-label={`Select ${o.name}`} checked={selected.includes(o.id)} onChange={() => toggle(o.id)} className="h-4 w-4 rounded border-ink-300 accent-brand-600" /></td>
                    <td className="td"><span className="block font-medium text-ink-900">{o.name}</span><span className="block text-xs text-ink-500">{o.owner} · {o.region}</span></td>
                    <td className="td"><Chip tone={o.planId === 'business' ? 'brand' : o.planId === 'team' ? 'teal' : 'gray'}>{PLANS[o.planId].name}</Chip></td>
                    <td className="td tabular-nums">{o.seats} / {o.seatLimit}</td>
                    <td className="td text-right tabular-nums">${o.aiCost.toFixed(2)}</td>
                    <td className="td">{o.suspended ? <Chip tone="red">Suspended</Chip> : <Chip tone="green">Active</Chip>}</td>
                    <td className="td text-right">
                      <button className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline" onClick={() => { setOrg(o.id); router.push('/dashboard'); }}>Open<ArrowUpRight size={14} /></button>
                    </td>
                    <td className="td text-right">
                      <button role="switch" aria-checked={o.suspended} aria-label={`Suspend ${o.name}`} onClick={() => setConfirm(o.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${o.suspended ? 'bg-red-500' : 'bg-ink-200'}`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${o.suspended ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!target} onClose={() => setConfirm(null)} title={target?.suspended ? 'Reinstate organisation' : 'Suspend organisation'} width="max-w-md">
        {target && (
          <div className="space-y-4">
            <p className="text-sm text-ink-600">{target.suspended
              ? `${target.name} will regain access and AI features straight away.`
              : `${target.name} and its ${target.seats} teammates will lose access to AI features until you reinstate the organisation. Their documents are kept.`}</p>
            <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setConfirm(null)}>Cancel</button><button className={target.suspended ? 'btn-primary' : 'btn-danger'} onClick={apply}>{target.suspended ? 'Reinstate' : 'Suspend'}</button></div>
          </div>
        )}
      </Modal>
      <Modal open={open} onClose={() => setOpen(false)} title="New organisation" width="max-w-xl">
        <form onSubmit={create} className="space-y-4">
          <Field label="Organisation name"><input className="input" autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="For example, Juniper Accounting" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Industry"><select className="input" value={form.industry} onChange={(e) => set('industry', e.target.value)}>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Region"><select className="input" value={form.region} onChange={(e) => set('region', e.target.value)}>{REGIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          <Field label="Plan" hint={`${PLANS[form.planId].seats} seats and ${PLANS[form.planId].credits.toLocaleString()} AI credits a month`}>
            <select className="input" value={form.planId} onChange={(e) => set('planId', e.target.value)}>{Object.values(PLANS).map((p) => <option key={p.id} value={p.id}>{p.name} · ${p.price} per month</option>)}</select>
          </Field>
          <Field label="Owner email" hint="The owner becomes the first seat."><input className="input" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@company.com" /></Field>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button><button className="btn-primary">Create organisation</button></div>
        </form>
      </Modal>
      <Modal open={!!bulkConfirm} onClose={() => setBulkConfirm(null)} title={bulkConfirm === 'suspend' ? 'Suspend selected organisations' : 'Reinstate selected organisations'} width="max-w-md">
        <p className="text-sm text-ink-600">{bulkConfirm === 'suspend'
          ? `${selected.length} ${selected.length === 1 ? 'organisation' : 'organisations'} will lose access to AI features until reinstated. Their documents are kept.`
          : `${selected.length} ${selected.length === 1 ? 'organisation' : 'organisations'} will regain access straight away.`}</p>
        <div className="mt-5 flex justify-end gap-2"><button className="btn-ghost" onClick={() => setBulkConfirm(null)}>Cancel</button><button className={bulkConfirm === 'suspend' ? 'btn-danger' : 'btn-primary'} onClick={() => doBulkSuspend(bulkConfirm === 'suspend')}>{bulkConfirm === 'suspend' ? 'Suspend' : 'Reinstate'}</button></div>
      </Modal>
    </div>
  );
}
