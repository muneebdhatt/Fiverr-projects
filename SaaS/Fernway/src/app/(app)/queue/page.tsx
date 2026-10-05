'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, AlertTriangle, ArrowLeft, BellRing, Clock, ClipboardList, DoorOpen, Eye, FileText, Keyboard, Lock, Phone, Search, Send, Sparkles, StickyNote, UserCheck } from 'lucide-react';
import { ROOMS } from '@/data/seed';
import type { Patient, Status } from '@/data/types';
import { AI_PROMPTS, askAbout, bestPrompt, symptomLabel } from '@/lib/engine';
import { firstLast, personaOf, useApp, useNow } from '@/lib/store';
import { agoTs, clock, dayTime, todayLabel, waitLabel } from '@/lib/time';
import { ReportModal } from '@/shell/Report';
import { ShortcutsModal } from '@/shell/Shortcuts';
import { useTypewriter } from '@/shell/useTypewriter';
import { Avatar, Chip, EmptyState, FlagChip, SelectField, Segmented, Skeleton, StatusPill } from '@/shell/ui';

const isPriority = (p: Patient) => p.status !== 'Seen' && p.flags.some((f) => f.level === 'urgent');
const waited = (p: Patient, now: number) => ((p.status === 'Waiting' ? now : p.startedAt ?? now) - p.arrivedAt) / 60000;

export default function QueuePage() {
  const patients = useApp((s) => s.patients);
  const role = useApp((s) => s.role);
  const alerts = useApp((s) => s.alerts);
  const roomOf = useApp((s) => s.roomOf);
  const assignRoom = useApp((s) => s.assignRoom);
  const arrivalDone = useApp((s) => s.arrivalDone);
  const triggerArrival = useApp((s) => s.triggerArrival);
  const focusId = useApp((s) => s.focusId);
  const setFocus = useApp((s) => s.setFocus);
  const setStatusFor = useApp((s) => s.setStatus);
  const callToDesk = useApp((s) => s.callToDesk);
  const toastFn = useApp((s) => s.toast);
  const logOpen = useApp((s) => s.logOpen);
  const logQueueView = useApp((s) => s.logQueueView);
  const now = useNow();

  const [status, setStatus] = useState<'All' | Status>('All');
  const [q, setQ] = useState('');
  const [who, setWho] = useState('all');
  const [sort, setSort] = useState('priority');
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [handover, setHandover] = useState(false);
  const [keys, setKeys] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // One scripted walk-in arrives while staff are watching the queue.
  useEffect(() => {
    if (arrivalDone) return;
    const t = setTimeout(() => {
      triggerArrival();
      toastFn('New check-in: Nadia Rosen');
    }, 30000);
    return () => clearTimeout(t);
  }, [arrivalDone, triggerArrival, toastFn]);

  // Opening a notification jumps straight to that patient.
  useEffect(() => {
    if (!focusId) return;
    setStatus('All');
    setWho('all');
    setQ('');
    setSelected(focusId);
    setFocus(null);
  }, [focusId, setFocus]);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => logQueueView(), [logQueueView, role]);
  useEffect(() => {
    setSelected(null);
    setWho(role === 'clinician' ? 'Dr. Elena Marsh' : 'all');
  }, [role]);
  useEffect(() => {
    if (selected) logOpen(selected);
  }, [selected, logOpen, role]);

  const counts = useMemo(() => ({
    All: patients.length,
    Waiting: patients.filter((p) => p.status === 'Waiting').length,
    'In review': patients.filter((p) => p.status === 'In review').length,
    Seen: patients.filter((p) => p.status === 'Seen').length,
    priority: patients.filter(isPriority).length,
  }), [patients]);

  const avgWait = useMemo(() => {
    const w = patients.filter((p) => p.status === 'Waiting');
    return w.length ? w.reduce((a, p) => a + waited(p, now), 0) / w.length : 0;
  }, [patients, now]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out = patients.filter((p) => {
      if (status !== 'All' && p.status !== status) return false;
      if (who !== 'all' && p.clinician !== who) return false;
      if (flaggedOnly && !p.flags.some((f) => f.level !== 'info')) return false;
      if (term && !`${p.name} ${p.reason}`.toLowerCase().includes(term)) return false;
      return true;
    });
    const rank = { Waiting: 0, 'In review': 1, Seen: 2 } as const;
    return out.sort((a, b) => {
      if (sort === 'arrival') return b.arrivedAt - a.arrivedAt;
      if (sort === 'wait') return a.arrivedAt - b.arrivedAt;
      if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
      if (isPriority(a) !== isPriority(b)) return isPriority(a) ? -1 : 1;
      return a.status === 'Seen' ? b.arrivedAt - a.arrivedAt : a.arrivedAt - b.arrivedAt;
    });
  }, [patients, status, who, flaggedOnly, q, sort]);

  const sel = patients.find((p) => p.id === selected) ?? null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable="true"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = list.findIndex((p) => p.id === selected);
      if (k === 'j' || k === 'arrowdown' || k === 'k' || k === 'arrowup') {
        e.preventDefault();
        const next = k === 'j' || k === 'arrowdown' ? Math.min(list.length - 1, idx + 1) : Math.max(0, idx < 0 ? 0 : idx - 1);
        if (list[next]) setSelected(list[next].id);
      } else if (k === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (k === '?') {
        setKeys(true);
      } else if (k === 'escape') {
        if (!document.querySelector('[role="dialog"]')) setSelected(null);
      } else if (k === 's' && role === 'clinician' && sel && sel.status !== 'Seen') {
        const to = sel.status === 'Waiting' ? 'In review' : 'Seen';
        setStatusFor(sel.id, to);
        toastFn(to === 'Seen' ? `${sel.name} marked as seen` : `Review started for ${sel.name}`);
      } else if (k === 'c' && role === 'receptionist' && sel) {
        callToDesk(sel.id);
        toastFn(`${sel.name} called to the desk`);
      } else if (k === 'n' && role === 'clinician' && sel) {
        e.preventDefault();
        (document.querySelector('textarea[aria-label="Clinician note"]') as HTMLTextAreaElement | null)?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [list, selected, sel, role, setStatusFor, callToDesk, toastFn]);

  return (
    <div>
      <div className={clsx('mb-5 flex flex-wrap items-end justify-between gap-3', sel && 'hidden lg:flex')}>
        <div>
          <p className="eyebrow">{todayLabel()}</p>
          <h1 className="mt-1 font-display text-5xl leading-none text-heading">Today&apos;s queue</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-2 hidden text-sm text-bark-500 xl:block">{role === 'receptionist' ? 'Front desk view: check-in details only' : role === 'clinician' ? 'Full intakes and clinical notes' : 'Queue overview: clinical answers are hidden'}</p>
          {role === 'clinician' && <button className="btn-ghost" onClick={() => setHandover(true)}><FileText size={15} />Handover report</button>}
          <button className="btn-ghost !px-3" onClick={() => setKeys(true)} aria-label="Keyboard shortcuts" title="Keyboard shortcuts (?)"><Keyboard size={16} /></button>
        </div>
      </div>

      <div data-tour="stats" className={clsx('mb-4 grid grid-cols-2 gap-3 md:grid-cols-4', sel && 'hidden lg:grid')}>
        <Stat label="Waiting" value={counts.Waiting} sub={counts.Waiting ? `Average wait ${waitLabel(avgWait)}` : 'Nobody waiting'} tone="honey" />
        <Stat label="In review" value={counts['In review']} sub="With a clinician now" tone="tide" />
        <Stat label="Seen today" value={counts.Seen} sub="Completed visits" tone="pine" />
        <Stat label="Priority" value={counts.priority} sub={counts.priority ? 'Needs a nurse first' : 'Nothing urgent'} tone="coral" />
      </div>

      <div data-tour="rooms" className={clsx('mb-5 grid grid-cols-2 gap-3 md:grid-cols-4', sel && 'hidden lg:grid')}>
        {ROOMS.map((r) => {
          const occ = patients.find((p) => roomOf[p.id] === r.id);
          const canPlace = !occ && sel && sel.status !== 'Seen';
          return (
            <button
              key={r.id}
              onClick={() => {
                if (occ) setSelected(occ.id);
                else if (canPlace && sel) {
                  if (assignRoom(sel.id, r.id)) toastFn(`${firstLast(sel.name)} is in ${r.name}`);
                }
              }}
              className={clsx('flex items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition', occ ? 'border-tide-100 bg-tide-50 hover:border-tide-500' : canPlace ? 'border-dashed border-pine-400 bg-pine-50 hover:bg-pine-100' : 'border-dashed border-bone-300 bg-transparent')}
            >
              <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', occ ? 'bg-tide-500 text-white' : 'bg-bone-200 text-bark-400')}><DoorOpen size={17} /></span>
              <span className="min-w-0 leading-tight">
                <span className="block text-sm font-bold text-bark-800">{r.name}</span>
                <span className={clsx('block truncate text-xs', occ ? 'font-semibold text-tide-700' : 'text-bark-400')}>
                  {occ ? `${firstLast(occ.name)} · ${waitLabel(Math.max(0, now - (occ.startedAt ?? now)) / 60000)} in` : canPlace && sel ? `Place ${firstLast(sel.name)} here` : 'Free'}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div data-tour="filters" className={clsx('mb-4 flex flex-wrap items-center gap-2.5', sel && 'hidden lg:flex')}>
        <div className="no-scrollbar max-w-full overflow-x-auto">
          <Segmented<'All' | Status>
            value={status}
            onChange={setStatus}
            options={(['All', 'Waiting', 'In review', 'Seen'] as const).map((s) => ({ value: s, label: <>{s} <span className="ml-1 text-xs opacity-60">{counts[s]}</span></> }))}
          />
        </div>
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-bark-400" />
          <input ref={searchRef} className="field !rounded-full !py-2 pl-10" placeholder="Search name or reason" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search the queue" />
        </div>
        <SelectField label="Filter by clinician" value={who} onChange={setWho} options={[{ value: 'all', label: 'All clinicians' }, ...['Dr. Elena Marsh', 'Dr. Samir Haddad', 'Nurse Tobias Okoye'].map((c) => ({ value: c, label: c }))]} />
        <SelectField label="Sort" value={sort} onChange={setSort} options={[{ value: 'priority', label: 'Sort: Priority first' }, { value: 'wait', label: 'Sort: Longest wait' }, { value: 'arrival', label: 'Sort: Latest arrival' }]} />
        {role === 'clinician' && (
          <button onClick={() => setFlaggedOnly((f) => !f)} aria-pressed={flaggedOnly} className={clsx('btn border', flaggedOnly ? 'border-coral-500 bg-coral-50 text-coral-700' : 'border-bone-300 bg-snow text-bark-700 hover:bg-bone-100')}>
            <AlertTriangle size={15} />Flagged only
          </button>
        )}
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
        <section data-tour="list" className={clsx('card overflow-hidden', sel && 'hidden lg:block')} aria-label="Queue">
          {loading ? (
            <div className="space-y-px">{Array.from({ length: 6 }, (_, i) => <div key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-10 w-10 !rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div></div>)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={<Search size={22} />} title="Nobody matches that" body="Try a different name, or clear the filters to see everyone checked in today." action={<button className="btn-soft" onClick={() => { setQ(''); setStatus('All'); setWho('all'); setFlaggedOnly(false); }}>Clear filters</button>} />
          ) : (
            <ul className="divide-y divide-bone-200">
              {list.map((p) => (
                <li key={p.id}>
                  <button onClick={() => setSelected(p.id)} className={clsx('flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-bone-100', selected === p.id && 'bg-pine-50 shadow-[inset_3px_0_0_#a07620]')}>
                    <Avatar name={p.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[15px] font-bold text-bark-900">{p.name}</span>
                        {(p.walkIn || p.id === 'p-live') && <Chip tone="pine" className="!px-2 !py-0.5 !text-[10px] uppercase tracking-wide">New</Chip>}
                        {isPriority(p) && <span className="flex items-center gap-1 rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"><AlertTriangle size={10} />Priority</span>}
                      </div>
                      <p className="mt-0.5 truncate text-[13px] text-bark-500">{p.reason} · {p.age} {p.sex} · {p.clinician}</p>
                      {roomOf[p.id] && <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-tide-700"><DoorOpen size={12} />{ROOMS.find((r) => r.id === roomOf[p.id])?.name}</p>}
                      {(alerts[p.id]?.desk || (alerts[p.id]?.nurse && !alerts[p.id]!.nurse!.ack && role !== 'receptionist')) && (
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {alerts[p.id]?.desk && <span className="rounded-full bg-tide-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-tide-700">Called to desk</span>}
                          {alerts[p.id]?.nurse && !alerts[p.id]!.nurse!.ack && role !== 'receptionist' && <span className="rounded-full bg-coral-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-coral-700">Nurse alerted</span>}
                        </div>
                      )}
                      {role === 'clinician' && p.flags[0] && p.flags[0].level !== 'info' && (
                        <p className={clsx('mt-1 truncate text-xs font-semibold', p.flags[0].level === 'urgent' ? 'text-coral-600' : 'text-honey-700')}>{p.flags[0].text}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <StatusPill status={p.status} />
                      <span className="flex items-center gap-1 text-xs text-bark-400"><Clock size={11} />{p.status === 'Seen' ? agoTs(p.seenAt ?? p.arrivedAt, now) : `${waitLabel(waited(p, now))} wait`}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section data-tour="detail" className={clsx('lg:sticky lg:top-24', !sel && 'hidden lg:block')} aria-label="Patient detail">
          {sel ? <Detail key={`${sel.id}-${role}`} p={sel} now={now} onBack={() => setSelected(null)} /> : (
            <div className="card"><EmptyState icon={<ClipboardList size={22} />} title="Choose someone from the queue" body={role === 'receptionist' ? 'Open a patient to see their check-in details.' : 'Open a patient to read their intake, the AI summary and anything flagged for a nurse.'} /></div>
          )}
        </section>
      </div>

      <ReportModal open={handover} onClose={() => setHandover(false)} patients={patients.filter((p) => who === 'all' || p.clinician === who)} kind="handover" label={`Shift handover report${who === 'all' ? '' : ` for ${who}`}`} />
      <ShortcutsModal open={keys} onClose={() => setKeys(false)} role={role} />
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: number; sub: string; tone: 'honey' | 'tide' | 'pine' | 'coral' }) {
  const bar = { honey: 'bg-honey-400', tide: 'bg-tide-500', pine: 'bg-leaf-500', coral: 'bg-coral-500' }[tone];
  return (
    <div className="card relative overflow-hidden p-4 pl-5">
      <span className={clsx('absolute inset-y-0 left-0 w-1.5', bar)} />
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-5xl leading-none text-heading">{value}</p>
      <p className="mt-1.5 text-xs text-bark-500">{sub}</p>
    </div>
  );
}

function Detail({ p, now, onBack }: { p: Patient; now: number; onBack: () => void }) {
  const role = useApp((s) => s.role);
  const setStatusFor = useApp((s) => s.setStatus);
  const toast = useApp((s) => s.toast);
  const audit = useApp((s) => s.audit);
  const al = useApp((s) => s.alerts[p.id]);
  const callToDesk = useApp((s) => s.callToDesk);
  const clearDesk = useApp((s) => s.clearDesk);
  const alertNurse = useApp((s) => s.alertNurse);
  const ackNurse = useApp((s) => s.ackNurse);
  const clinician = role === 'clinician';
  const roomOf = useApp((s) => s.roomOf[p.id] ?? '');
  const allRooms = useApp((s) => s.roomOf);
  const assignRoom = useApp((s) => s.assignRoom);
  const [exporting, setExporting] = useState(false);
  const opens =audit.filter((a) => a.action === 'Opened intake' && a.patient === p.name).slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <button onClick={onBack} className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-bark-500 hover:text-bark-800 lg:hidden"><ArrowLeft size={15} />Back to queue</button>
        <div className="flex flex-wrap items-start gap-4">
          <Avatar name={p.name} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-4xl leading-none text-heading">{p.name}</h2>
            <p className="mt-1.5 text-sm text-bark-500">{p.age} years · {p.sex === 'F' ? 'Female' : 'Male'} · Born {p.dob}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <StatusPill status={p.status} />
              <Chip>{p.reason}</Chip>
              <Chip><Clock size={11} />Arrived {clock(p.arrivedAt)}</Chip>
            </div>
            {p.status !== 'Seen' && (
              <div className="mt-3 flex items-center gap-2.5">
                <span className="eyebrow flex items-center gap-1.5"><DoorOpen size={12} />Room</span>
                <SelectField
                  label="Assign a room"
                  value={roomOf}
                  onChange={(v) => {
                    if (assignRoom(p.id, v || null)) toast(v ? `${firstLast(p.name)} is in ${ROOMS.find((r) => r.id === v)!.name}` : 'Room released');
                  }}
                  options={[{ value: '', label: 'Not assigned' }, ...ROOMS.map((r) => ({ value: r.id, label: Object.entries(allRooms).some(([pid, rid]) => rid === r.id && pid !== p.id) ? `${r.name} (in use)` : r.name }))]}
                />
              </div>
            )}
          </div>
          {clinician && <button className="btn-ghost !px-3.5" onClick={() => setExporting(true)}><FileText size={15} />Export summary</button>}
        </div>
        {clinician && <ReportModal open={exporting} onClose={() => setExporting(false)} patients={[p]} kind="patient" label={`Patient summary for ${p.name}`} />}

        {clinician ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-bone-200 pt-4">
            <span className="eyebrow">Status</span>
            <Segmented<Status>
              size="sm"
              value={p.status}
              onChange={(s) => {
                setStatusFor(p.id, s);
                toast(s === 'Seen' ? `${p.name} marked as seen` : s === 'In review' ? `Review started for ${p.name}` : `${p.name} moved back to waiting`);
              }}
              options={(['Waiting', 'In review', 'Seen'] as const).map((s) => ({ value: s, label: s }))}
            />
            {p.status === 'Waiting' && <button className="btn-primary ml-auto" onClick={() => { setStatusFor(p.id, 'In review'); toast(`Review started for ${p.name}`); }}><UserCheck size={16} />Start review</button>}
            {p.status === 'In review' && <button className="btn-primary ml-auto" onClick={() => { setStatusFor(p.id, 'Seen'); toast(`${p.name} marked as seen`); }}><UserCheck size={16} />Mark as seen</button>}
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-bone-200 pt-4">
            {al?.desk ? (
              <button className="btn-soft" onClick={() => { clearDesk(p.id); toast(`${p.name} is at the desk`); }}><Check size={15} />Called {clock(al.desk)} · Mark at desk</button>
            ) : (
              <button className="btn-primary" onClick={() => { callToDesk(p.id); toast(`${p.name} called to the desk`); }}><Phone size={15} />Call to desk</button>
            )}
            {al?.nurse ? (
              <span className={clsx('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold', al.nurse.ack ? 'bg-pine-100 text-heading' : 'bg-coral-50 text-coral-700 ring-1 ring-coral-200')}>
                <BellRing size={15} />{al.nurse.ack ? 'Nurse is on their way' : `Nurse alerted ${agoTs(al.nurse.ts, now)}`}
              </span>
            ) : isPriority(p) && <button className="btn-coral" onClick={() => { alertNurse(p.id); toast(`Nurse alerted about ${p.name}`, 'warn'); }}><BellRing size={15} />Let the nurse know</button>}
          </div>
        )}
      </div>

      {clinician && al?.nurse && (
        <div className={clsx('flex flex-wrap items-center gap-3 rounded-2xl p-4 text-sm ring-1', al.nurse.ack ? 'bg-pine-50 text-heading ring-pine-200' : 'bg-coral-50 text-coral-700 ring-coral-200')}>
          <BellRing size={18} className="shrink-0" />
          <p className="flex-1"><b>{al.nurse.ack ? 'Alert acknowledged.' : 'Front desk alert.'}</b> {al.nurse.by} asked for a nurse to see this patient {agoTs(al.nurse.ts, now)}.</p>
          {!al.nurse.ack && <button className="btn-coral" onClick={() => { ackNurse(p.id); toast('Alert acknowledged, front desk told'); }}>Acknowledge</button>}
        </div>
      )}
      {al?.desk && clinician && <div className="rounded-2xl bg-tide-50 p-3.5 text-sm font-semibold text-tide-700 ring-1 ring-tide-100">Called to the front desk at {clock(al.desk)}</div>}

      {clinician ? <ClinicalView p={p} now={now} /> : (
        <>
          <div className="card grid gap-x-8 gap-y-4 p-5 sm:grid-cols-2">
            <Info label="Appointment" value={`${clock(p.apptAt)} with ${p.clinician}`} />
            <Info label="Arrived" value={`${clock(p.arrivedAt)} (${agoTs(p.arrivedAt, now)})`} />
            <Info label="Time waiting" value={p.status === 'Seen' ? 'Seen' : waitLabel(waited(p, now))} />
            <Info label="Reason for visit" value={p.reason} />
            <Info label="Date of birth" value={p.dob} />
            <Info label="Checked in" value="At the kiosk" />
          </div>
          {isPriority(p) && (
            <div className="flex items-start gap-3 rounded-2xl bg-coral-50 p-4 text-sm text-coral-700 ring-1 ring-coral-200">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <p><b>Priority patient.</b> The care team has flagged this check-in. Please let a nurse know and avoid leaving them waiting.</p>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-2xl bg-bone-200 p-4 text-sm text-bark-600">
            <Lock size={17} className="mt-0.5 shrink-0 text-bark-400" />
            <p>Symptoms, answers and the AI summary are visible to clinicians only. Switch to a clinician account to read the full intake.</p>
          </div>
        </>
      )}

      <div className="card p-5">
        <p className="eyebrow mb-3 flex items-center gap-1.5"><Eye size={12} />Access history</p>
        {opens.length === 0 ? <p className="text-sm text-bark-400">Nobody has opened this record yet.</p> : (
          <ul className="space-y-2">
            {opens.map((a) => (
              <li key={a.id} className="flex items-center gap-2.5 text-sm">
                <Avatar name={a.user} size={24} />
                <span className="font-semibold text-bark-700">{a.user}</span>
                <span className="text-bark-400">opened this {agoTs(a.ts, now)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="eyebrow">{label}</p><p className="mt-1 text-[15px] font-semibold text-bark-800">{value}</p></div>;
}

function ClinicalView({ p, now }: { p: Patient; now: number }) {
  const addNote = useApp((s) => s.addNote);
  const toast = useApp((s) => s.toast);
  const [note, setNote] = useState('');

  return (
    <>
      <SummaryCard p={p} />
      <AskBox p={p} />

      <div className="card p-5">
        <p className="eyebrow mb-3">Reported symptoms</p>
        {p.symptoms.length ? <div className="flex flex-wrap gap-2">{p.symptoms.map((s) => <Chip key={s} tone="pine" className="!text-sm">{symptomLabel(s)}</Chip>)}</div> : <p className="text-sm text-bark-500">No symptoms ticked at check-in.</p>}
        <p className="eyebrow mb-3 mt-6">Answers</p>
        <dl className="divide-y divide-bone-200">
          {p.qa.map((x) => (
            <div key={x.id} className="grid gap-1 py-2.5 sm:grid-cols-[1.4fr_1fr] sm:gap-6">
              <dt className="text-sm text-bark-500">{x.q}</dt>
              <dd className="text-sm font-semibold text-bark-900">{x.a}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="card p-5">
        <p className="eyebrow mb-3 flex items-center gap-1.5"><StickyNote size={12} />Clinician notes</p>
        <div className="flex gap-2">
          <textarea className="field min-h-[72px] flex-1" placeholder="Add a note to this record" value={note} onChange={(e) => setNote(e.target.value)} aria-label="Clinician note" />
          <button className="btn-primary self-end" disabled={!note.trim()} onClick={() => { addNote(p.id, note); setNote(''); toast('Note saved to the record'); }}><Send size={15} />Save</button>
        </div>
        {p.notes.length > 0 && (
          <ul className="mt-4 space-y-3">
            {p.notes.map((n) => (
              <li key={n.id} className="rounded-xl bg-bone-100 p-3.5">
                <p className="text-sm text-bark-800">{n.text}</p>
                <p className="mt-1.5 text-xs text-bark-400">{n.by} · {agoTs(n.ts, now)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function SummaryCard({ p }: { p: Patient }) {
  const typed = useApp((s) => s.typed[p.id]);
  const markTyped = useApp((s) => s.markTyped);
  const { shown, typing, start } = useTypewriter(14);
  const [phase, setPhase] = useState<'thinking' | 'typing' | 'done'>(typed ? 'done' : 'thinking');

  useEffect(() => {
    if (typed) return;
    const t = setTimeout(() => {
      setPhase('typing');
      start(p.summary, () => {
        setPhase('done');
        markTyped(p.id);
      });
    }, 1100);
    return () => clearTimeout(t);
  }, [typed, p.id, p.summary, start, markTyped]);

  const done = phase === 'done';
  return (
    <div className="overflow-hidden rounded-2xl border border-pine-200 bg-gradient-to-br from-pine-50 to-snow shadow-soft">
      <div className="flex items-center gap-2 border-b border-pine-100 px-5 py-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-pine-700 text-white"><Sparkles size={14} /></span>
        <p className="text-sm font-bold text-heading">AI summary</p>
        <span className="ml-auto text-xs text-bark-400">From the patient&apos;s check-in answers</span>
      </div>
      <div className="p-5">
        {phase === 'thinking' ? (
          <div className="space-y-2.5" aria-live="polite">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent"><span className="inline-flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-pine-500" style={{ animationDelay: `${i * 120}ms` }} />)}</span>Reading the intake</p>
            <Skeleton className="h-3.5 w-full" /><Skeleton className="h-3.5 w-11/12" /><Skeleton className="h-3.5 w-2/3" />
          </div>
        ) : (
          <p className={clsx('text-[15px] leading-relaxed text-bark-800', typing && 'caret')}>{done ? p.summary : shown}</p>
        )}
        {done && p.flags.length > 0 && (
          <div className="mt-4 animate-rise">
            <p className="eyebrow mb-2">Flagged items</p>
            <ul className="flex flex-col gap-2">
              {p.flags.map((f, i) => (
                <li key={i}><FlagChip level={f.level}>{f.level === 'urgent' ? <AlertTriangle size={13} /> : f.level === 'review' ? <Eye size={13} /> : <ClipboardList size={13} />}{f.text}</FlagChip></li>
              ))}
            </ul>
          </div>
        )}
        {done && p.flags.length === 0 && <p className="mt-3 text-sm font-semibold text-leaf-700">Nothing flagged at check-in.</p>}
      </div>
    </div>
  );
}

function AskBox({ p }: { p: Patient }) {
  const [turns, setTurns] = useState<{ q: string; a: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [text, setText] = useState('');
  const { shown, typing, start } = useTypewriter(12);
  const end = useRef<HTMLDivElement>(null);

  const ask = (prompt: string, label = prompt) => {
    if (busy) return;
    const answer = askAbout(p, prompt);
    setBusy(true);
    setTurns((t) => [...t, { q: label, a: '' }]);
    setTimeout(() => {
      start(answer, () => {
        setTurns((t) => t.map((x, i) => (i === t.length - 1 ? { ...x, a: answer } : x)));
        setBusy(false);
      });
    }, 800);
  };
  useEffect(() => end.current?.scrollIntoView({ block: 'nearest' }), [shown, turns.length]);

  const last = turns.length - 1;
  return (
    <div className="card p-5">
      <p className="eyebrow mb-3 flex items-center gap-1.5"><Sparkles size={12} />Ask about this intake</p>
      <div className="flex flex-wrap gap-2">
        {AI_PROMPTS.map((s) => (
          <button key={s} disabled={busy} onClick={() => ask(s)} className="rounded-full border border-pine-200 bg-pine-50 px-3.5 py-1.5 text-sm font-semibold text-heading transition hover:bg-pine-100 disabled:opacity-50">{s}</button>
        ))}
      </div>
      {turns.length > 0 && (
        <div className="mt-4 space-y-3">
          {turns.map((t, i) => (
            <div key={i} className="space-y-2">
              <p className="ml-auto w-fit max-w-[90%] rounded-2xl rounded-br-md bg-pine-700 px-3.5 py-2 text-sm text-white">{t.q}</p>
              <p className={clsx('max-w-[95%] rounded-2xl rounded-bl-md bg-bone-100 px-3.5 py-2.5 text-sm leading-relaxed text-bark-800', i === last && busy && typing && 'caret')}>
                {i === last && busy ? (shown || <span className="text-bark-400">Thinking…</span>) : t.a}
              </p>
            </div>
          ))}
          <div ref={end} />
        </div>
      )}
      <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; ask(bestPrompt(text), text.trim()); setText(''); }}>
        <input className="field !rounded-full" placeholder="Ask your own question" value={text} onChange={(e) => setText(e.target.value)} aria-label="Ask about this intake" />
        <button className="btn-primary" disabled={busy || !text.trim()} aria-label="Send"><Send size={15} /></button>
      </form>
    </div>
  );
}
