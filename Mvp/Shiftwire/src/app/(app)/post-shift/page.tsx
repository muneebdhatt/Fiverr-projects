'use client';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, Check, Flame, MapPin, Repeat, Send } from 'lucide-react';
import { BUSINESSES, ME_BUSINESS, ROLES, WORKERS, matchWorkers, workerById } from '@/data/seed';
import type { EscalateRule, Role, Shift, Template } from '@/data/types';
import { dayLabel, hourLabel, money, timeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import { Avatar, Chip, Field, PageHeader } from '@/shell/ui';

const RATES: Record<Role, number> = { Bartender: 24, Server: 19, 'Line Cook': 26, Dishwasher: 17, 'Event Setup': 18, 'Banquet Captain': 28 };
const HOURS = Array.from({ length: 18 }, (_, i) => 6 + i);
const LOCATIONS = [BUSINESSES[0].address, '40 Waterfront Drive, Portland', '1500 Northgate Way, Portland'];
const ESCALATE: { id: EscalateRule; label: string }[] = [
  { id: 'none', label: 'Do nothing' },
  { id: 'rate', label: 'Raise the rate by $3/hr' },
  { id: 'radius', label: 'Widen the search to 10 miles' },
  { id: 'both', label: 'Raise the rate and widen the search' },
];

export default function PostShiftPage() {
  const router = useRouter();
  const optedOut = useApp((s) => s.optedOut);
  const favourites = useApp((s) => s.favourites);
  const available = useApp((s) => s.availableTonight);
  const prefill = useApp((s) => s.prefill);
  const setPrefill = useApp((s) => s.setPrefill);
  const templates = useApp((s) => s.templates);
  const saveTemplate = useApp((s) => s.saveTemplate);
  const startBroadcast = useApp((s) => s.startBroadcast);
  const toast = useApp((s) => s.toast);
  const bizName = useApp((s) => s.bizName);
  const [role, setRole] = useState<Role>('Bartender');
  const [day, setDay] = useState(0);
  const [start, setStart] = useState(18);
  const [end, setEnd] = useState(23);
  const [rate, setRate] = useState(24);
  const [positions, setPositions] = useState(1);
  const [radius, setRadius] = useState(6);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [escalate, setEscalate] = useState<EscalateRule>('rate');
  const [repeat, setRepeat] = useState(false);
  const [escalated, setEscalated] = useState<{ bump: number; radius: number } | null>(null);
  const [savingName, setSavingName] = useState<string | null>(null);
  const [sending, setSending] = useState<string[] | null>(null);
  const [delivered, setDelivered] = useState(0);

  useEffect(() => {
    if (!prefill) return;
    setRole(prefill.role);
    setRate(prefill.rate ?? RATES[prefill.role]);
    if (prefill.start !== undefined) setStart(prefill.start);
    if (prefill.end !== undefined) setEnd(prefill.end);
    if (prefill.positions) setPositions(prefill.positions);
    if (prefill.location) setLocation(prefill.location);
    if (prefill.escalated) { setEscalated(prefill.escalated); setRadius(prefill.escalated.radius); setDay(0); }
    setPrefill(null);
  }, [prefill, setPrefill]);

  const matched = useMemo(() => matchWorkers(role, optedOut, { favourites, radius, available }), [role, optedOut, favourites, radius, available]);
  const skilled = matched.filter((id) => workerById(id)?.skills.includes(role)).length;
  const favCount = matched.filter((id) => favourites[id]).length;
  const farthest = Math.max(...matched.map((id) => workerById(id)!.distance));
  const valid = end > start && rate >= 15;
  const hours = end - start;
  const total = hours * rate * positions;
  const message = `${bizName}: ${positions > 1 ? `${positions} × ` : ''}${role} needed ${day === 0 ? 'today' : dayLabel(day)}, ${timeRange(start, end)} at $${rate}/hr. ${location.split(',')[0]}. Reply YES to claim it.`;

  function loadTemplate(t: Template) {
    setRole(t.role); setStart(t.start); setEnd(t.end); setRate(t.rate); setLocation(t.location); setPositions(t.positions); setEscalated(null);
    toast(`Loaded “${t.name}”`, 'info');
  }

  function broadcast() {
    if (!valid) return;
    setSending(matched);
    setDelivered(0);
  }

  useEffect(() => {
    if (!sending) return;
    if (delivered >= sending.length) {
      const t = setTimeout(() => {
        const base: Shift = {
          id: `new-${Date.now()}`, businessId: ME_BUSINESS, role, dayOffset: day, start, end, rate, location, positions,
          status: 'Open', sent: sending.length, replies: 0, autoEscalate: escalate, escalated: escalated ?? undefined, recurring: repeat,
        };
        const later: Shift[] = repeat
          ? [3, 2, 1].map((w) => ({ ...base, id: `new-${Date.now()}-r${w}`, dayOffset: day + 7 * w, status: 'Scheduled' as const, sent: 0, autoEscalate: undefined, escalated: undefined }))
          : [];
        startBroadcast(base, sending, later);
        if (repeat) toast('Weekly repeat set for the next 3 weeks', 'info');
        router.push('/shifts/live');
      }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDelivered((d) => d + 1), 230);
    return () => clearTimeout(t);
  }, [sending, delivered, role, day, start, end, rate, location, positions, escalate, escalated, repeat, startBroadcast, toast, router]);

  if (sending) {
    return (
      <div className="pop mx-auto max-w-lg">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Send size={18} /></span>
            <div>
              <h1 className="text-lg font-semibold">Sending to {sending.length} workers</h1>
              <p className="text-sm text-ink-500">{positions > 1 ? `${positions} × ` : ''}{role} · {dayLabel(day)} · {timeRange(start, end)}</p>
            </div>
          </div>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-100"><div className="h-full rounded-full bg-brand-600 transition-all duration-200" style={{ width: `${(delivered / sending.length) * 100}%` }} /></div>
          <ul className="mt-5 max-h-[22rem] space-y-1 overflow-y-auto pr-1">
            {sending.map((id, i) => {
              const w = WORKERS.find((x) => x.id === id)!;
              const done = i < delivered;
              return (
                <li key={id} className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm">
                  <Avatar name={w.name} size={28} />
                  <span className="flex-1 truncate">{w.name}</span>
                  <span className="text-xs text-ink-500">{w.distance} mi</span>
                  {done ? <span className="flex items-center gap-1 text-xs font-medium text-emerald-600"><Check size={14} />Delivered</span> : i === delivered ? <span className="flex items-center gap-1.5 text-xs text-brand-700"><span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />Sending</span> : <span className="text-xs text-ink-400">Queued</span>}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Post a shift" subtitle="Describe the shift and Shiftwire texts the closest qualified workers." />

      {escalated && (
        <div className="pop mb-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
          <Flame size={18} className="shrink-0 text-amber-600" />
          <p><span className="font-semibold">Escalated re-broadcast.</span> Rate raised by ${escalated.bump}/hr and the search widened to {escalated.radius} miles.</p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">Templates</span>
        {templates.map((t) => (
          <button key={t.id} onClick={() => loadTemplate(t)} className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50">{t.name}</button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div data-tour="shift-form" className="card space-y-4 p-5 lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Role">
              <select className="input" value={role} onChange={(e) => { const r = e.target.value as Role; setRole(r); setRate(RATES[r]); setEscalated(null); }}>
                {ROLES.map((r) => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <Field label="Workers needed">
              <div className="flex gap-1">
                {[1, 2, 3].map((n) => <button key={n} type="button" onClick={() => setPositions(n)} className={clsx('flex-1 rounded-lg border py-2 text-sm font-medium transition', positions === n ? 'border-brand-600 bg-brand-600 text-white' : 'border-ink-200 bg-white text-ink-700 hover:bg-ink-50')}>{n}</button>)}
              </div>
            </Field>
            <Field label="Date">
              <select className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>
                {Array.from({ length: 8 }, (_, i) => <option key={i} value={i}>{dayLabel(i)}</option>)}
              </select>
            </Field>
            <Field label="Location">
              <select className="input" value={location} onChange={(e) => setLocation(e.target.value)}>
                {[...new Set([location, ...LOCATIONS])].map((l) => <option key={l}>{l}</option>)}
              </select>
            </Field>
            <Field label="Start time">
              <select className="input" value={start} onChange={(e) => setStart(Number(e.target.value))}>
                {HOURS.map((h) => <option key={h} value={h}>{hourLabel(h)}</option>)}
              </select>
            </Field>
            <Field label="End time" hint={end <= start ? 'End time must be after the start time.' : undefined}>
              <select className="input" value={end} onChange={(e) => setEnd(Number(e.target.value))}>
                {HOURS.concat(24).map((h) => <option key={h} value={h}>{hourLabel(h % 24)}</option>)}
              </select>
            </Field>
            <Field label="Hourly rate" hint={rate < 15 ? 'Minimum rate is $15 per hour.' : undefined}>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-500">$</span><input className="input pl-6" type="number" min={15} max={80} value={rate} onChange={(e) => setRate(Number(e.target.value))} /></div>
            </Field>
            <Field label="Search radius">
              <select className="input" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                {[3, 6, 10].map((r) => <option key={r} value={r}>Within {r} miles</option>)}
              </select>
            </Field>
          </div>

          <div data-tour="escalation"><Field label="If nobody says YES within 2 minutes">
            <select className="input" value={escalate} onChange={(e) => setEscalate(e.target.value as EscalateRule)}>
              {ESCALATE.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field></div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink-100 p-3 text-sm">
            <input type="checkbox" className="h-4 w-4 accent-[#0a7587]" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} />
            <Repeat size={16} className="text-ink-500" />
            <span><span className="font-medium">Repeat weekly</span><span className="block text-xs text-ink-500">Schedules the same shift for the next 3 weeks. Each one is broadcast 48 hours before it starts.</span></span>
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button data-tour="broadcast-btn" className="btn-primary flex-1 py-3 text-base" disabled={!valid} onClick={broadcast}><Send size={17} />Broadcast to {matched.length} workers</button>
            {savingName === null ? (
              <button className="btn-ghost py-3" onClick={() => setSavingName(`${role} ${hourLabel(start).replace(':00', '')}`)}><BookmarkPlus size={16} />Save as template</button>
            ) : (
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!savingName.trim()) return; saveTemplate({ name: savingName.trim(), role, start, end, rate, location, positions }); toast(`Template “${savingName.trim()}” saved`); setSavingName(null); }}>
                <input className="input w-44" autoFocus value={savingName} onChange={(e) => setSavingName(e.target.value)} aria-label="Template name" />
                <button className="btn-primary">Save</button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Estimated cost</h2>
            <p className="mt-1 text-3xl font-semibold">{valid ? money(total) : '$0'}</p>
            <p className="text-sm text-ink-500">{hours > 0 ? hours : 0} h × ${rate}/hr × {positions} {positions === 1 ? 'worker' : 'workers'}</p>
            <p className="mt-2 text-xs text-ink-500">Paid to workers by you directly. Shiftwire adds no per-shift fee.</p>
          </div>
          <div data-tour="who-texted" className="card p-5">
            <h2 className="text-sm font-semibold">Who will be texted</h2>
            <p className="mt-1 text-sm text-ink-500">{matched.length} workers matched · {skilled} with {role} skills · farthest {farthest} mi</p>
            <div className="mt-3 flex -space-x-2">
              {matched.slice(0, 8).map((id) => <Avatar key={id} name={workerById(id)!.name} size={32} ring />)}
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-100 text-xs font-medium text-ink-600 ring-2 ring-white">+{matched.length - 8}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {favCount > 0 && <Chip tone="amber">{favCount} favourites texted first</Chip>}
              {available && <Chip tone="teal">Available-tonight boost on</Chip>}
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-ink-500"><MapPin size={13} className="mt-0.5 shrink-0" />Favourites and the most reliable workers rank first. Opted-out workers are skipped.</p>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Text they will receive</h2>
            <div className="mt-3 rounded-2xl rounded-bl-sm bg-ink-100 px-4 py-3 text-sm text-ink-800">{message}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
