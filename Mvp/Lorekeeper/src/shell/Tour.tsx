'use client';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import { create } from 'zustand';
import { Modal } from './Modal';
import { useSession } from './session';

type Placement = 'bottom' | 'top' | 'right' | 'left';
type Step = { id: string; path: string; target?: string; placement?: Placement; title: string; body: string; adminOnly?: boolean };

const STEPS: Step[] = [
  { id: 'welcome', path: '/', title: 'Welcome to Lorekeeper', body: 'A two-minute look at how your team asks questions of its own documents and gets answers with sources. You can leave at any time.' },
  { id: 'ask', path: '/', target: 'chat-widget', placement: 'top', title: 'Ask from anywhere', body: 'This chat sits in the corner of every page. Type a question or pick a suggestion. Answers come only from your team’s documents, never from guesswork.' },
  { id: 'nav-docs', path: '/', target: 'nav-documents', placement: 'bottom', title: 'Your document library', body: 'Policies, guides, client notes and meeting notes all live here. Everything in the library can be cited.' },
  { id: 'upload', path: '/documents', target: 'upload', placement: 'bottom', title: 'Add documents', body: 'Drop in files and choose a category. A new file shows Processing, then Ready, and it can be renamed, downloaded or removed from its row menu.' },
  { id: 'chat-input', path: '/chat', target: 'chat-input', placement: 'top', title: 'Ask your documents', body: 'Answers type out with numbered citations. Click a number to open the exact passage the answer came from.' },
  { id: 'history', path: '/chat', target: 'history', placement: 'right', title: 'Every chat is kept', body: 'Come back to earlier conversations, rename them or delete them. Each person has their own history.' },
  { id: 'drafts', path: '/drafts', target: 'drafts-templates', placement: 'bottom', title: 'Draft a reply', body: 'Pick a template and Lorekeeper writes a first draft from the matching client or meeting notes, listing the documents it used. Edit it, then copy.' },
  { id: 'search', path: '/drafts', target: 'search', placement: 'bottom', title: 'Search everything', body: 'Find any document or past question from here. Press Ctrl K from anywhere.' },
  { id: 'bell', path: '/drafts', target: 'bell', placement: 'bottom', title: 'Stay in the loop', body: 'Uploads that finish, feedback you send and team activity show up here with an unread count.' },
  { id: 'profile', path: '/drafts', target: 'profile', placement: 'bottom', title: 'Your account', body: 'Switch accounts, open Settings for your profile, password and dark mode, or sign out.' },
  { id: 'admin', path: '/admin', target: 'admin-invite', placement: 'bottom', adminOnly: true, title: 'Run the workspace', body: 'Admins invite teammates, change roles, review answers people flagged as wrong, and watch usage.' },
  { id: 'done', path: '/', title: 'You’re all set', body: 'Try asking about remote work, expenses or invoice terms. You can replay this tour any time from Settings or the Tour button in the header.' },
];

type S = { active: boolean; index: number; start: () => void; go: (i: number) => void; stop: () => void };
export const useTour = create<S>((set) => ({
  active: false,
  index: 0,
  start: () => set({ active: true, index: 0 }),
  go: (index) => set({ index }),
  stop: () => set({ active: false }),
}));

const PAD = 8;
const W = 340;

function useTargetRect(selector: string | undefined, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    setRect(null);
    if (!active || !selector) return;
    let stop = false;
    let tries = 0;
    let raf = 0;
    const find = () => document.querySelector<HTMLElement>(`[data-tour="${selector}"]`);
    const measure = () => {
      if (stop) return;
      const el = find();
      const r = el?.getBoundingClientRect();
      if (el && r && r.width > 0 && r.height > 0) {
        const off = r.top < 70 || r.bottom > window.innerHeight - 20;
        if (off) el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior });
        setRect(el.getBoundingClientRect());
      } else if (tries++ < 40) {
        setTimeout(measure, 100);
        return;
      } else setRect(null);
      raf = requestAnimationFrame(function loop() {
        if (stop) return;
        const e2 = find()?.getBoundingClientRect();
        if (e2 && e2.width > 0) setRect((prev) => (prev && prev.top === e2.top && prev.left === e2.left && prev.width === e2.width && prev.height === e2.height ? prev : e2));
        raf = requestAnimationFrame(loop);
      });
    };
    measure();
    return () => { stop = true; cancelAnimationFrame(raf); };
  }, [selector, active]);
  return rect;
}

export function Tour() {
  const router = useRouter();
  const path = usePathname();
  const role = useSession((s) => s.me?.role);
  const { active, index, go, stop } = useTour();
  const steps = useMemo(() => STEPS.filter((s) => !s.adminOnly || role === 'admin'), [role]);
  const step = steps[Math.min(index, steps.length - 1)];
  const rect = useTargetRect(step?.target, active);
  const card = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(200);
  const [vp, setVp] = useState({ w: 1200, h: 800 });

  useEffect(() => {
    if (active && step && path !== step.path) router.push(step.path);
  }, [active, step, path, router]);

  useLayoutEffect(() => { if (card.current) setH(card.current.offsetHeight); }, [step, active, rect]);
  useEffect(() => {
    const u = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    u();
    window.addEventListener('resize', u);
    return () => window.removeEventListener('resize', u);
  }, []);

  const finish = useCallback(() => { stop(); try { localStorage.setItem('lk_tour_done', '1'); } catch {} }, [stop]);
  const last = index >= steps.length - 1;
  const next = useCallback(() => (last ? finish() : go(index + 1)), [last, finish, go, index]);
  const back = useCallback(() => index > 0 && go(index - 1), [go, index]);

  useEffect(() => {
    if (!active) return;
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      else if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      else if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [active, finish, next, back]);

  if (!active || !step) return null;

  const cardW = Math.min(W, vp.w - 24);
  const ready = path === step.path;
  const spot = ready && rect ? rect : null;
  let top = Math.max(12, (vp.h - h) / 2);
  let left = (vp.w - cardW) / 2;
  if (spot) {
    const place = step.placement ?? 'bottom';
    const fits = (p: Placement) =>
      p === 'bottom' ? spot.bottom + PAD + 12 + h < vp.h : p === 'top' ? spot.top - PAD - 12 - h > 0 : p === 'right' ? spot.right + PAD + 12 + cardW < vp.w : spot.left - PAD - 12 - cardW > 0;
    const order: Placement[] = [place, 'bottom', 'top', 'right', 'left'];
    const use = order.find(fits);
    if (use === 'bottom') { top = spot.bottom + PAD + 12; left = spot.left + spot.width / 2 - cardW / 2; }
    else if (use === 'top') { top = spot.top - PAD - 12 - h; left = spot.left + spot.width / 2 - cardW / 2; }
    else if (use === 'right') { left = spot.right + PAD + 12; top = spot.top + spot.height / 2 - h / 2; }
    else if (use === 'left') { left = spot.left - PAD - 12 - cardW; top = spot.top + spot.height / 2 - h / 2; }
    left = Math.min(Math.max(12, left), vp.w - cardW - 12);
    top = Math.min(Math.max(12, top), vp.h - h - 12);
  }

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Product tour">
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />
      {spot ? (
        <div
          className="pointer-events-none absolute rounded-xl ring-2 ring-brand-400 transition-all duration-200"
          style={{ top: spot.top - PAD, left: spot.left - PAD, width: spot.width + PAD * 2, height: spot.height + PAD * 2, boxShadow: '0 0 0 9999px rgba(8,14,13,.62)' }}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-[rgba(8,14,13,.62)]" />
      )}
      <div ref={card} className={clsx('card pop absolute p-5 shadow-2xl transition-all duration-200', !ready && 'opacity-0')} style={{ top, left, width: cardW }}>
        <button aria-label="Close tour" onClick={finish} className="absolute right-3 top-3 rounded p-1 text-ink-400 hover:bg-ink-100"><X className="h-4 w-4" /></button>
        {step.id === 'welcome' && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Compass className="h-5 w-5" /></div>}
        <div className="pr-6 text-base font-semibold">{step.title}</div>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1" aria-label={`Step ${index + 1} of ${steps.length}`}>
            {steps.map((s, i) => <span key={s.id} className={clsx('h-1.5 rounded-full transition-all', i === index ? 'w-4 bg-brand-600' : 'w-1.5 bg-ink-200')} />)}
          </div>
          <div className="flex items-center gap-2">
            {index > 0 && !last && <button className="btn-ghost px-2.5 py-1.5" onClick={back} aria-label="Previous step"><ArrowLeft className="h-4 w-4" /></button>}
            {index === 0 && <button className="btn-ghost px-3 py-1.5" onClick={finish}>Skip</button>}
            <button className="btn-primary px-3.5 py-1.5" onClick={next}>{last ? 'Finish' : index === 0 ? 'Start tour' : 'Next'}{!last && <ArrowRight className="h-4 w-4" />}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Offers the tour once, to people who just created an account. */
export function TourOffer() {
  const start = useTour((s) => s.start);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      if (localStorage.getItem('lk_tour_offer') === '1' && localStorage.getItem('lk_tour_done') !== '1') {
        localStorage.removeItem('lk_tour_offer');
        setOpen(true);
      }
    } catch {}
  }, []);
  const later = () => { setOpen(false); };
  return (
    <Modal open={open} onClose={later} title="Welcome aboard">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Compass className="h-5 w-5" /></div>
      <p className="text-sm text-ink-600">Would you like a quick tour of Lorekeeper? It takes about two minutes, and you can replay it later from Settings.</p>
      <div className="mt-4 flex justify-end gap-2">
        <button className="btn-ghost" onClick={later}>Maybe later</button>
        <button className="btn-primary" onClick={() => { setOpen(false); start(); }}>Take the tour</button>
      </div>
    </Modal>
  );
}
