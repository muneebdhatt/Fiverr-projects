'use client';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { BadgeCheck, Heart, MapPin, Search, SearchX, Star } from 'lucide-react';
import { ME_WORKER, ROLES } from '@/data/seed';
import { isNew } from '@/lib/accounts';
import { useAllWorkers } from '@/lib/me';
import type { Worker } from '@/data/types';
import { useApp } from '@/lib/store';
import { Avatar, Chip, EmptyState, Modal, PageHeader, Skeleton, useLoading } from '@/shell/ui';

export default function WorkersPage() {
  const router = useRouter();
  const optedOut = useApp((s) => s.optedOut);
  const WORKERS = useAllWorkers();
  const available = useApp((s) => s.availableTonight);
  const favourites = useApp((s) => s.favourites);
  const toggleFav = useApp((s) => s.toggleFavourite);
  const setPrefill = useApp((s) => s.setPrefill);
  const toast = useApp((s) => s.toast);
  const loading = useLoading('workers');
  const [q, setQ] = useState('');
  const [skill, setSkill] = useState('All');
  const [dist, setDist] = useState('Any');
  const [rating, setRating] = useState('Any');
  const [sort, setSort] = useState('distance');
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<Worker | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const maxD = dist === 'Any' ? Infinity : Number(dist);
    const minR = rating === 'Any' ? 0 : Number(rating);
    return WORKERS.filter((w) => (!term || w.name.toLowerCase().includes(term) || w.licence.toLowerCase().includes(term)) &&
      (skill === 'All' || w.skills.includes(skill as never)) && w.distance <= maxD && w.rating >= minR && (!favOnly || favourites[w.id]))
      .sort((a, b) => (sort === 'distance' ? a.distance - b.distance : sort === 'rating' ? b.rating - a.rating : sort === 'reliability' ? b.reliability - a.reliability : b.jobs - a.jobs));
  }, [q, skill, dist, rating, sort, favOnly, favourites, WORKERS]);

  const isOut = (w: Worker) => w.unsubscribed || !!optedOut[w.id];

  return (
    <div>
      <PageHeader title="Find workers" subtitle={`${WORKERS.length} vetted workers in the Portland area.`} />
      <div data-tour="worker-filters" className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="relative lg:col-span-2"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" /><input data-search className="input pl-9" placeholder="Search name or certificate" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className="input" value={skill} onChange={(e) => setSkill(e.target.value)} aria-label="Skill"><option value="All">All skills</option>{ROLES.map((r) => <option key={r}>{r}</option>)}</select>
        <select className="input" value={dist} onChange={(e) => setDist(e.target.value)} aria-label="Distance"><option value="Any">Any distance</option><option value="3">Within 3 mi</option><option value="5">Within 5 mi</option><option value="10">Within 10 mi</option></select>
        <select className="input" value={rating} onChange={(e) => setRating(e.target.value)} aria-label="Rating"><option value="Any">Any rating</option><option value="4.5">4.5 and up</option><option value="4.8">4.8 and up</option></select>
        <select className="input" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort"><option value="distance">Closest first</option><option value="rating">Highest rated</option><option value="reliability">Most reliable</option><option value="jobs">Most shifts</option></select>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 sm:col-span-2 lg:col-span-6"><input type="checkbox" className="h-4 w-4 accent-[#0a7587]" checked={favOnly} onChange={(e) => setFavOnly(e.target.checked)} />Show favourites only</label>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 9 }, (_, i) => <Skeleton key={i} className="h-36" />)}</div>
      ) : rows.length === 0 ? (
        <div className="card"><EmptyState icon={<SearchX size={22} />} title="No workers match" body="Widen the distance or lower the rating filter." action={<button className="btn-ghost" onClick={() => { setQ(''); setSkill('All'); setDist('Any'); setRating('Any'); setFavOnly(false); }}>Clear filters</button>} /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((w) => (
            <div key={w.id} className="card cursor-pointer p-4 transition hover:-translate-y-0.5 hover:shadow-lg" onClick={() => setOpen(w)}>
              <div className="flex items-start gap-3">
                <Avatar name={w.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">{w.name}<BadgeCheck size={15} className="shrink-0 text-brand-600" /></p>
                  <p className="text-xs text-ink-500">{w.primary}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); toggleFav(w.id); toast(favourites[w.id] ? `${w.name} removed from favourites` : `${w.name} added to favourites`, 'info'); }} className="rounded-full p-1.5 hover:bg-ink-100" aria-label="Favourite"><Heart size={17} className={clsx(favourites[w.id] ? 'fill-red-500 text-red-500' : 'text-ink-400')} /></button>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                <span className="flex items-center gap-1"><Star size={13} className="fill-accent-400 text-accent-400" />{isNew(w) ? 'New' : w.rating.toFixed(1)}</span>
                <span className="flex items-center gap-1"><MapPin size={13} />{w.distance} mi</span>
                <span>{w.jobs} shifts</span>
                {!isNew(w) && <span className="font-medium text-brand-700">{w.reliability}% reliable</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {w.skills.map((s) => <Chip key={s} tone="teal">{s}</Chip>)}
                {isOut(w) && <Chip tone="red">Unsubscribed</Chip>}
                {available && w.id === ME_WORKER && <Chip tone="green">Available tonight</Chip>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title="Worker profile">
        {open && (
          <div className="text-sm">
            <div className="flex items-center gap-4">
              <Avatar name={open.name} size={60} />
              <div>
                <p className="flex items-center gap-1.5 text-lg font-semibold">{open.name}<BadgeCheck size={17} className="text-brand-600" /></p>
                <p className="text-ink-500">{open.phone}</p>
                <p className="mt-0.5 flex items-center gap-1 text-ink-600"><Star size={14} className="fill-accent-400 text-accent-400" />{open.rating.toFixed(1)} · {open.jobs} shifts · {open.distance} mi away</p>
              </div>
            </div>
            <p className="mt-4 text-ink-700">{open.about}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink-50 p-3"><p className="text-xs text-ink-500">Certificate</p><p className="mt-0.5 font-medium">{open.licence}</p></div>
              <div className="rounded-xl bg-ink-50 p-3"><p className="text-xs text-ink-500">On Shiftwire</p><p className="mt-0.5 font-medium">{open.joinedDays} days</p></div>
              <div className="col-span-2 rounded-xl bg-ink-50 p-3"><div className="flex items-center justify-between"><p className="text-xs text-ink-500">Reliability</p><p className="text-sm font-semibold">{open.reliability}%</p></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200"><div className="h-full rounded-full bg-brand-500" style={{ width: `${open.reliability}%` }} /></div><p className="mt-1.5 text-xs text-ink-500">Turns up on time and replies quickly. Reliable workers are texted first.</p></div>
            </div>
            <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Skills</p>
            <div className="flex flex-wrap gap-1.5">{open.skills.map((s) => <Chip key={s} tone="teal">{s}</Chip>)}</div>
            <p className="mb-1.5 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Usually available</p>
            <div className="flex gap-1">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => <span key={d} className={clsx('flex-1 rounded-lg py-1.5 text-center text-xs font-medium', open.days.includes(d) ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400')}>{d}</span>)}</div>
            <div className="mt-6 flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => { toggleFav(open.id); toast(favourites[open.id] ? 'Removed from favourites' : 'Added to favourites', 'info'); }}><Heart size={15} className={clsx(favourites[open.id] && 'fill-red-500 text-red-500')} />{favourites[open.id] ? 'Favourited' : 'Favourite'}</button>
              <button className="btn-primary flex-1" disabled={isOut(open)} onClick={() => { setPrefill({ role: open.primary }); router.push('/post-shift'); }}>{isOut(open) ? 'Opted out of texts' : 'Invite to a shift'}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
