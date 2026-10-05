'use client';
import clsx from 'clsx';
import { useState } from 'react';
import { CalendarCheck, Inbox, Zap } from 'lucide-react';
import { standing, useMe } from '@/lib/me';
import { dayLabel, hourLabel, timeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import { PhoneFrame } from '@/shell/PhoneFrame';
import { Avatar, Chip, EmptyState, Skeleton, useLoading } from '@/shell/ui';

interface Offer { id: string; from: string; role: string; day: number; start: number; end: number; rate: number; place: string; ago: string; gone?: boolean }

const OFFERS: Offer[] = [
  { id: 'o1', from: 'Cedar & Pine Events', role: 'Bartender', day: 0, start: 18, end: 23, rate: 24, place: '214 Alder Street', ago: '4 minutes ago' },
  { id: 'o2', from: 'Larkspur Kitchen', role: 'Line Cook', day: 1, start: 16, end: 22, rate: 27, place: '88 Hawthorne Boulevard', ago: '2 hours ago' },
  { id: 'o3', from: 'Tidewater Suites', role: 'Line Cook', day: -1, start: 11, end: 17, rate: 26, place: '40 Waterfront Drive', ago: 'yesterday', gone: true },
];
const BOOKED = [
  { id: 'b1', from: 'Northgate Banquet Hall', role: 'Line Cook', day: 2, start: 15, end: 22, rate: 27 },
  { id: 'b2', from: 'Ember & Oak Grill', role: 'Line Cook', day: 4, start: 16, end: 23, rate: 26 },
];

type Tab = 'offers' | 'booked' | 'texts';

export default function OffersPage() {
  const replies = useApp((s) => s.offerReply);
  const setReply = useApp((s) => s.setOfferReply);
  const available = useApp((s) => s.availableTonight);
  const setAvailable = useApp((s) => s.setAvailable);
  const toast = useApp((s) => s.toast);
  const loading = useLoading('offers');
  const [tab, setTab] = useState<Tab>('offers');
  const me = useMe();
  const bookedOffers = OFFERS.filter((o) => replies[o.id] === 'yes').map((o) => ({ id: o.id, from: o.from, role: o.role, day: o.day, start: o.start, end: o.end, rate: o.rate }));
  const booked = [...bookedOffers, ...BOOKED];
  const next = booked.slice().sort((a, b) => a.day - b.day)[0];

  return (
    <PhoneFrame className="bg-ink-50">
      <div className="bg-white px-5 pb-3 pt-3">
        <div className="flex items-center gap-3">
          <Avatar name={me.name} size={40} />
          <div className="flex-1"><p className="text-base font-semibold leading-tight">Hi, {me.name.split(' ')[0]}</p><p className="text-xs text-ink-500">{standing(me)}</p></div>
        </div>
        <button
          data-tour="availability"
          onClick={() => { setAvailable(!available); toast(!available ? 'You are marked available tonight. You will be texted first.' : 'Availability turned off', 'info'); }}
          className={clsx('mt-3 flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition', available ? 'border-brand-300 bg-brand-50' : 'border-ink-200 bg-white hover:bg-ink-50')}
          aria-pressed={available}
        >
          <Zap size={18} className={available ? 'text-brand-600' : 'text-ink-400'} />
          <span className="flex-1 text-sm"><span className="block font-medium">Available tonight</span><span className="block text-xs text-ink-500">{available ? 'Nearby venues see you first' : 'Turn on to be texted first'}</span></span>
          <span className={clsx('relative h-6 w-10 rounded-full transition', available ? 'bg-brand-600' : 'bg-ink-300')}><span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-[#ffffff] shadow transition-all', available ? 'left-[18px]' : 'left-0.5')} /></span>
        </button>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-ink-100 p-1 text-sm font-medium">
          {([['offers', 'Offers'], ['booked', 'My shifts'], ['texts', 'Texts']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={clsx('rounded-md py-1.5 transition', tab === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600')}>{l}</button>
          ))}
        </div>
      </div>

      <div data-tour="offer-list" className="flex-1 space-y-3 overflow-y-auto p-4">
        {loading ? (
          <><Skeleton className="h-40" /><Skeleton className="h-40" /></>
        ) : tab === 'offers' ? (
          OFFERS.map((o) => {
            const r = replies[o.id];
            return (
              <div key={o.id} className="pop">
                <p className="mb-1 px-1 text-[11px] text-ink-500">{o.from} · {o.ago}</p>
                <div className="rounded-2xl rounded-bl-sm bg-white p-4 text-sm shadow-card">
                  <p className="font-semibold">{o.role} needed {o.day === 0 ? 'today' : dayLabel(o.day).toLowerCase()}</p>
                  <p className="mt-1 text-ink-600">{timeRange(o.start, o.end)} · ${o.rate}/hr</p>
                  <p className="text-ink-600">{o.place}</p>
                  {o.gone ? (
                    <p className="mt-3 rounded-lg bg-ink-100 px-3 py-2 text-xs text-ink-600">Shift filled. Thanks for the quick reply.</p>
                  ) : r ? (
                    <div className="mt-3 flex justify-end"><span className={clsx('rounded-2xl rounded-br-sm px-3.5 py-1.5 text-sm font-semibold text-white', r === 'yes' ? 'bg-emerald-600' : 'bg-ink-500')}>{r === 'yes' ? 'YES' : 'NO'}</span></div>
                  ) : (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button className="btn-ghost" onClick={() => { setReply(o.id, 'no'); toast('Reply sent. They will offer it to someone else.', 'info'); }}>Reply NO</button>
                      <button className="btn-primary" onClick={() => { setReply(o.id, 'yes'); toast(`You are booked at ${o.from}`); }}>Reply YES</button>
                    </div>
                  )}
                </div>
                {r === 'yes' && <p className="mt-1.5 px-1 text-xs text-emerald-700">Confirmed. Your shift is on My shifts.</p>}
              </div>
            );
          })
        ) : tab === 'booked' ? (
          booked.length === 0 ? (
            <EmptyState icon={<Inbox size={22} />} title="Nothing booked yet" body="Reply YES to an offer and it lands here." />
          ) : (
            booked.map((b) => (
              <div key={b.id} className="pop flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><CalendarCheck size={20} /></span>
                <div className="min-w-0 flex-1 text-sm"><p className="truncate font-semibold">{b.role} at {b.from}</p><p className="text-ink-600">{dayLabel(b.day)} · {timeRange(b.start, b.end)}</p></div>
                <Chip tone="green">Confirmed</Chip>
              </div>
            ))
          )
        ) : (
          <>
            <p className="px-1 text-center text-[11px] text-ink-500">Texts from Shiftwire</p>
            {next && (
              <div className="pop">
                <p className="mb-1 px-1 text-[11px] text-ink-500">Shiftwire · 2 hours before your shift</p>
                <div className="rounded-2xl rounded-bl-sm bg-white p-4 text-sm shadow-card">Reminder: {next.role} at {next.from} starts in 2 hours ({hourLabel(next.start)}). Reply C to confirm you are on your way.</div>
              </div>
            )}
            <div className="pop">
              <p className="mb-1 px-1 text-[11px] text-ink-500">Shiftwire · yesterday</p>
              <div className="rounded-2xl rounded-bl-sm bg-white p-4 text-sm shadow-card">Thanks for working at Tidewater Suites. How was it? Reply 1 to 5.</div>
              <div className="mt-2 flex justify-end"><span className="rounded-2xl rounded-br-sm bg-brand-600 px-3.5 py-1.5 text-sm font-semibold text-white">5</span></div>
            </div>
            <p className="px-1 text-center text-[11px] text-ink-500">Reply STOP to any text to opt out.</p>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}
