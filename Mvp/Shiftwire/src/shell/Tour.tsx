'use client';
import clsx from 'clsx';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Compass, X } from 'lucide-react';
import type { PersonaId } from '@/data/types';
import { TOURS } from '@/lib/tour';
import { useApp } from '@/lib/store';

interface Rect { top: number; left: number; width: number; height: number }
const PAD = 8;
const CARD_W = 340;

function findTarget(name: string): HTMLElement | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`));
  return nodes.find((n) => n.getBoundingClientRect().width > 0 && n.getBoundingClientRect().height > 0) ?? null;
}

export function Tour({ persona, onClose }: { persona: PersonaId; onClose: () => void }) {
  const steps = TOURS[persona];
  const router = useRouter();
  const path = (usePathname() || '/').replace(/\/$/, '') || '/';
  const toast = useApp((s) => s.toast);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 1200, h: 800 });
  const step = steps[i];
  const last = i === steps.length - 1;

  const measure = useCallback(() => {
    setVp({ w: window.innerWidth, h: window.innerHeight });
    const el = findTarget(step.target);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.target]);

  // Move to the right page, then wait for the highlighted element to appear.
  useEffect(() => {
    if (step.path && path !== step.path) router.push(step.path);
  }, [step, path, router]);

  useEffect(() => {
    if (step.path && path !== step.path) return;
    let tries = 0;
    let scrolled = false;
    const timer = setInterval(() => {
      tries += 1;
      const el = findTarget(step.target);
      if (el && !scrolled) {
        scrolled = true;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
      measure();
      if (tries > 60) clearInterval(timer);
    }, 120);
    return () => clearInterval(timer);
  }, [step, path, measure]);

  useLayoutEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [measure]);

  const finish = useCallback((done: boolean) => {
    onClose();
    if (done) toast('Tour finished. You can restart it any time from the header.', 'info');
  }, [onClose, toast]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish(false);
      else if (e.key === 'ArrowRight') setI((n) => Math.min(steps.length - 1, n + 1));
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(0, n - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish, steps.length]);

  if (typeof document === 'undefined') return null;

  const w = Math.min(CARD_W, vp.w - 24);
  let cardStyle: React.CSSProperties;
  if (rect) {
    const below = rect.top + rect.height + PAD + 14;
    const fitsBelow = below + 230 < vp.h;
    const top = fitsBelow ? below : Math.max(12, rect.top - PAD - 14 - 230);
    const left = Math.min(Math.max(12, rect.left + rect.width / 2 - w / 2), vp.w - w - 12);
    cardStyle = { top, left, width: w };
  } else {
    cardStyle = { top: Math.max(12, vp.h / 2 - 115), left: Math.max(12, vp.w / 2 - w / 2), width: w };
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[70]" aria-hidden />
      {rect ? (
        <div
          className="pointer-events-none fixed z-[71] rounded-xl ring-2 ring-brand-400 transition-all duration-300"
          style={{ top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2, boxShadow: '0 0 0 9999px rgba(8, 12, 22, 0.62)' }}
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[71] bg-[rgba(8,12,22,0.62)]" />
      )}
      <div className="pop fixed z-[72] rounded-2xl border border-ink-100 bg-white p-5 shadow-2xl transition-all duration-300" style={cardStyle} role="dialog" aria-label="Product tour">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Compass size={18} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">Step {i + 1} of {steps.length}</p>
            <h2 className="mt-0.5 text-base font-semibold text-ink-900">{step.title}</h2>
          </div>
          <button onClick={() => finish(false)} className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700" aria-label="Skip tour"><X size={17} /></button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{step.body}</p>
        <div className="mt-4 flex items-center gap-1.5">
          {steps.map((_, n) => <span key={n} className={clsx('h-1.5 rounded-full transition-all', n === i ? 'w-5 bg-brand-600' : 'w-1.5 bg-ink-200')} />)}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => finish(false)} className="mr-auto text-sm font-medium text-ink-500 hover:text-ink-800">Skip</button>
          {i > 0 && <button onClick={() => setI(i - 1)} className="btn-ghost"><ArrowLeft size={15} />Back</button>}
          <button onClick={() => (last ? finish(true) : setI(i + 1))} className="btn-primary">{last ? 'Finish' : <>Next<ArrowRight size={15} /></>}</button>
        </div>
      </div>
    </>,
    document.body,
  );
}
