'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { Role } from '@/data/types';
import { useApp } from '@/lib/store';

const visible = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel)).find((el) => el.offsetParent !== null || getComputedStyle(el).position === 'fixed') ?? null;

interface Step { sel: string; title: string; body: string; roles?: Role[]; }

const STEPS: Step[] = [
  { sel: '[data-tour="stats"]', title: 'Today at a glance', body: 'Waiting, in review and seen counts, the average wait, and how many patients are marked Priority.' },
  { sel: '[data-tour="rooms"]', title: 'Rooms', body: 'See which rooms are free. Pick a patient, then tap a free room to place them in it.' },
  { sel: '[data-tour="filters"]', title: 'Find anyone fast', body: 'Filter by status or clinician, search by name, and sort by priority or longest wait.' },
  { sel: '[data-tour="list"]', title: 'The live queue', body: 'Patients appear here the moment they check in. Open one to see their details.', },
  { sel: '[data-tour="detail"]', title: 'Patient record', body: 'Clinicians get the AI summary, flagged items and notes. The front desk sees check-in details and can call a patient or alert a nurse.' },
  { sel: '[data-tour="nav"]', title: 'Admin tools', body: 'Insights, the audit trail, the question sets shown on the check-in screen, and staff.', roles: ['admin'] },
  { sel: '[data-tour="bell"]', title: 'Notifications', body: 'New check-ins, priority alerts and room changes land here.' },
  { sel: '[data-tour="profile"]', title: 'Switch account', body: 'Try the same queue as a receptionist, clinician or admin. You can also turn on dark mode or larger text here.' },
];

export function Tour() {
  const open = useApp((s) => s.tourOpen);
  const setTour = useApp((s) => s.setTour);
  const role = useApp((s) => s.role);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setSteps(STEPS.filter((s) => (!s.roles || s.roles.includes(role)) && visible(s.sel)));
      setI(0);
    }, 350);
    return () => clearTimeout(t);
  }, [open, role]);

  const step = steps[i];
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = visible(step.sel);
    if (!el) return;
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    const upd = () => setRect(el.getBoundingClientRect());
    const t = setTimeout(upd, 380);
    upd();
    window.addEventListener('resize', upd);
    window.addEventListener('scroll', upd, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', upd);
      window.removeEventListener('scroll', upd, true);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setTour(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, setTour]);

  if (!open || !step || !rect) return null;

  const pad = 8;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const w = Math.min(340, vw - 24);
  const below = rect.bottom + 16 + 190 < vh;
  const top = below ? rect.bottom + pad + 12 : Math.max(12, rect.top - pad - 12 - 190);
  const left = Math.min(Math.max(12, rect.left), vw - w - 12);
  const last = i === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0" onClick={() => setTour(false)} />
      <div
        className="pointer-events-none absolute rounded-2xl transition-all duration-300"
        style={{ top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: Math.min(rect.height + pad * 2, vh), boxShadow: '0 0 0 9999px rgba(10,8,4,.58)', outline: '2px solid #d6b25a' }}
      />
      <div className="card absolute animate-pop p-5 shadow-lift" style={{ top, left, width: w }} role="dialog" aria-label="Guided tour">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-2xl leading-tight text-heading">{step.title}</p>
          <button aria-label="Close tour" onClick={() => setTour(false)} className="rounded-full p-1 text-bark-400 hover:bg-bone-200"><X size={16} /></button>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-bark-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex gap-1.5">{steps.map((_, n) => <span key={n} className={n === i ? 'h-1.5 w-5 rounded-full bg-pine-600' : 'h-1.5 w-1.5 rounded-full bg-bone-300'} />)}</span>
          <button className="btn-primary !py-1.5" onClick={() => (last ? setTour(false) : setI(i + 1))}>{last ? 'Done' : 'Next'}{!last && <ArrowRight size={14} />}</button>
        </div>
      </div>
    </div>
  );
}
