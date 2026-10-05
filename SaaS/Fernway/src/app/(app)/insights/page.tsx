'use client';
import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { CLINICIANS } from '@/data/seed';
import type { Patient } from '@/data/types';
import { symptomLabel } from '@/lib/engine';
import { useApp, useNow } from '@/lib/store';
import { waitLabel } from '@/lib/time';
import { Skeleton } from '@/shell/ui';

const HOUR = 3600000;
const PAST_WAITS = [21, 19, 24, 18, 17, 20]; // average wait on each of the six days before today

const reviewWait = (p: Patient) => (p.startedAt ? (p.startedAt - p.arrivedAt) / 60000 : null);
const level = (p: Patient) => (p.flags.some((f) => f.level === 'urgent') ? 'urgent' : p.flags.some((f) => f.level === 'review') ? 'review' : p.flags.length ? 'info' : 'none');

export default function InsightsPage() {
  const patients = useApp((s) => s.patients);
  const now = useNow(60000);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const d = useMemo(() => {
    const buckets = Array.from({ length: 6 }, (_, i) => {
      const start = now - (6 - i) * HOUR;
      const label = new Date(start).toLocaleTimeString('en-US', { hour: 'numeric' });
      return { label, n: patients.filter((p) => p.arrivedAt >= start && p.arrivedAt < start + HOUR).length };
    });
    const waits = patients.map(reviewWait).filter((x): x is number => x !== null);
    const avgReview = waits.length ? waits.reduce((a, b) => a + b, 0) / waits.length : 0;
    const flagged = patients.filter((p) => ['urgent', 'review'].includes(level(p))).length;
    const waiting = patients.filter((p) => p.status === 'Waiting');
    const liveAvg = waiting.length ? waiting.reduce((a, p) => a + (now - p.arrivedAt) / 60000, 0) / waiting.length : 0;
    const days = [...PAST_WAITS, Math.round(liveAvg || avgReview)].map((v, i, arr) => ({
      label: new Date(now - (arr.length - 1 - i) * 24 * HOUR).toLocaleDateString('en-US', { weekday: 'short' }),
      v,
    }));
    const levels = { urgent: 0, review: 0, info: 0, none: 0 };
    patients.forEach((p) => (levels[level(p)] += 1));
    const sym: Record<string, number> = {};
    patients.forEach((p) => p.symptoms.forEach((s) => (sym[s] = (sym[s] ?? 0) + 1)));
    const topSymptoms = Object.entries(sym).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
    const byClinician = CLINICIANS.map((c) => {
      const mine = patients.filter((p) => p.clinician === c);
      const w = mine.map(reviewWait).filter((x): x is number => x !== null);
      return { name: c, total: mine.length, seen: mine.filter((p) => p.status === 'Seen').length, avg: w.length ? w.reduce((a, b) => a + b, 0) / w.length : 0 };
    });
    return { buckets, avgReview, flagged, priorityWaiting: waiting.filter((p) => level(p) === 'urgent').length, days, levels, topSymptoms, byClinician };
  }, [patients, now]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-60" />
        <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
      </div>
    );
  }

  const maxB = Math.max(1, ...d.buckets.map((b) => b.n));
  const maxD = Math.max(...d.days.map((x) => x.v), 1) * 1.15;
  const total = patients.length;

  return (
    <div>
      <p className="eyebrow">Last 6 hours and last 7 days</p>
      <h1 className="mt-1 font-display text-5xl leading-none text-heading">Insights</h1>
      <p className="mt-2 max-w-2xl text-sm text-bark-500">How the waiting room is running. Numbers update as patients check in and are seen.</p>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Checked in today" value={String(total)} sub={`${patients.filter((p) => p.status === 'Seen').length} already seen`} />
        <Kpi label="Wait to be reviewed" value={d.avgReview ? waitLabel(d.avgReview) : '-'} sub="Average, once a clinician starts" />
        <Kpi label="Flagged at check-in" value={`${total ? Math.round((d.flagged / total) * 100) : 0}%`} sub={`${d.flagged} of ${total} patients`} />
        <Kpi label="Priority waiting" value={String(d.priorityWaiting)} sub={d.priorityWaiting ? 'Needs a nurse first' : 'Nothing urgent'} tone="coral" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Panel title="Check-ins per hour" sub="Patients who arrived in each of the last six hours">
          <svg viewBox="0 0 420 220" className="w-full" role="img" aria-label={`Check-ins per hour: ${d.buckets.map((b) => `${b.label} ${b.n}`).join(', ')}`}>
            {[0, 0.5, 1].map((t) => <line key={t} x1="28" x2="410" y1={180 - t * 150} y2={180 - t * 150} className="stroke-bone-300" strokeDasharray={t ? '3 4' : '0'} />)}
            {d.buckets.map((b, i) => {
              const h = (b.n / maxB) * 150;
              const x = 44 + i * 62;
              return (
                <g key={i}>
                  <rect x={x} y={180 - h} width="38" height={Math.max(h, 2)} rx="8" className="fill-pine-500"><title>{`${b.label}: ${b.n} check-ins`}</title></rect>
                  <text x={x + 19} y={172 - h} textAnchor="middle" className="fill-bark-700 text-[12px] font-bold">{b.n}</text>
                  <text x={x + 19} y="202" textAnchor="middle" className="fill-bark-400 text-[11px]">{b.label}</text>
                </g>
              );
            })}
          </svg>
        </Panel>

        <Panel title="Average wait, last 7 days" sub="Minutes between arriving and being seen by a clinician">
          <svg viewBox="0 0 420 220" className="w-full" role="img" aria-label={`Average wait by day: ${d.days.map((x) => `${x.label} ${x.v} minutes`).join(', ')}`}>
            {[0, 0.5, 1].map((t) => <line key={t} x1="28" x2="410" y1={180 - t * 150} y2={180 - t * 150} className="stroke-bone-300" strokeDasharray={t ? '3 4' : '0'} />)}
            <path d={`M${d.days.map((x, i) => `${50 + i * 56},${180 - (x.v / maxD) * 150}`).join(' L')} L${50 + 6 * 56},180 L50,180 Z`} className="fill-pine-500/15" />
            <polyline points={d.days.map((x, i) => `${50 + i * 56},${180 - (x.v / maxD) * 150}`).join(' ')} fill="none" className="stroke-pine-500" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {d.days.map((x, i) => (
              <g key={i}>
                <circle cx={50 + i * 56} cy={180 - (x.v / maxD) * 150} r={i === 6 ? 6 : 4} className={i === 6 ? 'fill-coral-500' : 'fill-pine-500'}><title>{`${x.label}: ${x.v} min`}</title></circle>
                <text x={50 + i * 56} y={170 - (x.v / maxD) * 150} textAnchor="middle" className="fill-bark-700 text-[11px] font-bold">{x.v}</text>
                <text x={50 + i * 56} y="202" textAnchor="middle" className="fill-bark-400 text-[11px]">{i === 6 ? 'Today' : x.label}</text>
              </g>
            ))}
          </svg>
        </Panel>

        <Panel title="What the AI flagged" sub="Highest level raised for each patient today">
          <div className="flex flex-wrap items-center gap-6">
            <Donut parts={[
              { v: d.levels.urgent, cls: 'stroke-coral-500', label: 'Urgent' },
              { v: d.levels.review, cls: 'stroke-honey-500', label: 'Needs a closer look' },
              { v: d.levels.info, cls: 'stroke-tide-500', label: 'For information' },
              { v: d.levels.none, cls: 'stroke-leaf-500', label: 'Nothing flagged' },
            ]} total={total} />
            <ul className="space-y-2.5 text-sm">
              {([['Urgent', d.levels.urgent, 'bg-coral-500'], ['Needs a closer look', d.levels.review, 'bg-honey-500'], ['For information', d.levels.info, 'bg-tide-500'], ['Nothing flagged', d.levels.none, 'bg-leaf-500']] as const).map(([k, v, c]) => (
                <li key={k} className="flex items-center gap-2.5"><span className={clsx('h-3 w-3 rounded-full', c)} /><span className="w-40 text-bark-600">{k}</span><b className="text-bark-900">{v}</b></li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel title="Most reported symptoms" sub="Ticked at check-in today">
          <ul className="space-y-3">
            {d.topSymptoms.map(([s, n]) => (
              <li key={s} className="grid grid-cols-[150px_1fr_24px] items-center gap-3 text-sm">
                <span className="truncate text-bark-700">{symptomLabel(s)}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-bone-200"><span className="block h-full rounded-full bg-pine-500" style={{ width: `${(n / d.topSymptoms[0][1]) * 100}%` }} /></span>
                <b className="text-right text-bark-900">{n}</b>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel className="mt-4" title="By clinician" sub="Patients assigned today">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b border-bone-200 text-[11px] font-bold uppercase tracking-wider text-bark-500"><th className="py-2 pr-4">Clinician</th><th className="px-4 py-2">Assigned</th><th className="px-4 py-2">Seen</th><th className="px-4 py-2">Average wait to review</th></tr></thead>
            <tbody className="divide-y divide-bone-200">
              {d.byClinician.map((c) => (
                <tr key={c.name}><td className="py-3 pr-4 font-semibold text-bark-900">{c.name}</td><td className="px-4 py-3 text-bark-700">{c.total}</td><td className="px-4 py-3 text-bark-700">{c.seen}</td><td className="px-4 py-3 text-bark-700">{c.avg ? waitLabel(c.avg) : '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub: string; tone?: 'coral' }) {
  return (
    <div className="card p-4">
      <p className="eyebrow">{label}</p>
      <p className={clsx('mt-1 font-display text-5xl leading-none', tone === 'coral' ? 'text-coral-600' : 'text-heading')}>{value}</p>
      <p className="mt-1.5 text-xs text-bark-500">{sub}</p>
    </div>
  );
}

function Panel({ title, sub, children, className }: { title: string; sub: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx('card p-5', className)}>
      <h2 className="font-display text-2xl text-heading">{title}</h2>
      <p className="mb-4 text-xs text-bark-500">{sub}</p>
      {children}
    </section>
  );
}

function Donut({ parts, total }: { parts: { v: number; cls: string; label: string }[]; total: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox="0 0 140 140" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label={parts.map((p) => `${p.label} ${p.v}`).join(', ')}>
      <circle cx="70" cy="70" r={r} fill="none" className="stroke-bone-200" strokeWidth="18" />
      {parts.filter((p) => p.v > 0).map((p) => {
        const len = (p.v / Math.max(total, 1)) * c;
        const el = <circle key={p.label} cx="70" cy="70" r={r} fill="none" className={p.cls} strokeWidth="18" strokeDasharray={`${Math.max(len - 3, 0)} ${c}`} strokeDashoffset={-offset} strokeLinecap="butt"><title>{`${p.label}: ${p.v}`}</title></circle>;
        offset += len;
        return el;
      })}
      <text x="70" y="70" textAnchor="middle" dominantBaseline="central" transform="rotate(90 70 70)" className="fill-heading font-display text-[34px]">{total}</text>
    </svg>
  );
}
