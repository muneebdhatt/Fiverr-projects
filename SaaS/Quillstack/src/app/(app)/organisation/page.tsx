'use client';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { ADMIN_ORGS, INDUSTRIES, ORGS, REGIONS } from '@/data/seed';
import { currentUserId, useApp, useOrg, useOrgList } from '@/lib/store';
import { initialsOf } from '@/lib/time';
import { Field, PageHeader } from '@/shell/ui';

const SWATCHES = ['#4638dc', '#0d9488', '#d97706', '#be185d', '#2563eb', '#7c3aed', '#059669', '#dc2626'];

export default function OrganisationPage() {
  const { org } = useOrg();
  const orgs = useOrgList();
  const persona = useApp((s) => s.persona);
  const customOrgs = useApp((s) => s.customOrgs);
  const profile = useApp((s) => s.orgProfile[org.id]);
  const { updateOrgProfile, log, toast } = useApp();

  const baseRegion = customOrgs.find((o) => o.id === org.id)?.region ?? ADMIN_ORGS.find((o) => o.id === org.id)?.region ?? REGIONS[0];
  const region = profile?.region ?? baseRegion;
  const [form, setForm] = useState({ name: org.name, industry: org.industry, region, tone: org.tone });
  const [err, setErr] = useState('');

  // Switching organisation loads that organisation's profile into the form.
  useEffect(() => { setForm({ name: org.name, industry: org.industry, region, tone: org.tone }); setErr(''); }, [org.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const industries = Array.from(new Set([form.industry, ...INDUSTRIES]));
  const dirty = form.name !== org.name || form.industry !== org.industry || form.region !== region || form.tone !== org.tone;
  const initials = initialsOf((form.name || org.name).replace('&', '')).slice(0, 2);

  function save(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return setErr('Enter an organisation name.');
    if (orgs.some((o) => o.id !== org.id && o.name.toLowerCase() === name.toLowerCase())) return setErr('Another organisation already uses that name.');
    updateOrgProfile(org.id, { name, industry: form.industry, region: form.region, tone: form.tone });
    log(org.id, currentUserId(persona), 'Updated organisation', name);
    toast('Organisation profile saved');
  }

  return (
    <div>
      <PageHeader title="Organisation" subtitle="How your workspace appears to your team" />
      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="card space-y-5 p-6 lg:col-span-2">
          <Field label="Organisation name"><input className="input" value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setErr(''); }} /></Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Industry"><select className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}>{industries.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Data region"><select className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>{REGIONS.map((x) => <option key={x}>{x}</option>)}</select></Field>
          </div>
          <div>
            <p className="mb-1.5 text-sm font-medium text-ink-700">Brand colour</p>
            <div className="flex flex-wrap gap-2.5">
              {SWATCHES.map((c) => (
                <button type="button" key={c} onClick={() => setForm({ ...form, tone: c })} aria-label={`Use colour ${c}`} aria-pressed={form.tone === c}
                  className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-400" style={{ background: c }}>
                  {form.tone === c && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
          </div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" disabled={!dirty} onClick={() => setForm({ name: org.name, industry: org.industry, region, tone: org.tone })}>Discard</button>
            <button className="btn-primary" disabled={!dirty}>Save changes</button>
          </div>
        </form>
        <div className="card h-fit p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Preview</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-ink-200 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white" style={{ background: form.tone }}>{initials}</span>
            <span><span className="block text-sm font-semibold">{form.name || 'Organisation name'}</span><span className="block text-xs text-ink-500">{form.industry} · {form.region}</span></span>
          </div>
          <p className="mt-4 text-sm text-ink-500">This is how {ORGS.find((o) => o.id === org.id)?.name ?? 'your organisation'} appears in the organisation switcher, invitations and the Super-admin console.</p>
        </div>
      </div>
    </div>
  );
}
