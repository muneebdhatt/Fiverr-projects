'use client';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUi } from '@/lib/ui';

interface Step { sel: string; title: string; body: string }

const STEPS: Step[] = [
  { sel: '[data-tour="credits"]', title: 'AI credits', body: 'Every AI action spends credits from your plan. This card shows how many have been used this cycle and what is left.' },
  { sel: '[data-tour="org"]', title: 'Switch organisation', body: 'Each organisation is its own workspace with separate documents, teammates, usage and plan. Switching swaps everything on screen.' },
  { sel: '[data-tour="nav-documents"]', title: 'Documents', body: 'Create, edit and search documents, then ask the AI assistant to summarise, rewrite or translate them.' },
  { sel: '[data-tour="nav-team"]', title: 'Team', body: 'Invite people, change roles and see who has not yet accepted. Invitations appear on the invited person\'s home page.' },
  { sel: '[data-tour="nav-billing"]', title: 'Billing', body: 'Compare plans, upgrade, buy extra credits and open receipts. Members do not see this page.' },
  { sel: '[data-tour="nav-audit"]', title: 'Audit log', body: 'A record of who did what and when. Filter it, export it as a spreadsheet, or preview a printable report.' },
  { sel: '[data-tour="bell"]', title: 'Notifications', body: 'Invitations, accepted invites and credit alerts land here, with an unread count.' },
  { sel: '[data-tour="profile"]', title: 'Your account', body: 'Switch between demo accounts to see how roles differ, change the theme, or reset the workspace.' },
];

function visible(sel: string) {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 ? r : null;
}

export function Tour() {
  const open = useUi((s) => s.tour);
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>([]);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Build the tour from whatever is on screen: steps for hidden or role-restricted items are left out.
  useEffect(() => {
    if (!open) return;
    router.push('/dashboard');
    const t = setTimeout(() => {
      setSteps(STEPS.filter((s) => visible(s.sel)));
      setI(0);
    }, 700);
    return () => clearTimeout(t);
  }, [open, router]);

  useLayoutEffect(() => {
    if (!open || !steps[i]) return;
    const measure = () => setRect(visible(steps[i].sel));
    const el = document.querySelector(steps[i].sel);
    el?.scrollIntoView({ block: 'nearest', behavior: 'instant' as ScrollBehavior });
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => { window.removeEventListener('resize', measure); window.removeEventListener('scroll', measure, true); };
  }, [open, steps, i]);

  if (!open || steps.length === 0) return null;
  const close = () => useUi.setState({ tour: false });
  const step = steps[i];
  const last = i === steps.length - 1;
  const W = 320;
  const vw = typeof window === 'undefined' ? 1200 : window.innerWidth;
  const vh = typeof window === 'undefined' ? 800 : window.innerHeight;

  let style: React.CSSProperties = { left: Math.max(12, (vw - W) / 2), top: Math.max(12, vh / 2 - 100) };
  if (rect) {
    if (rect.left < 300 && vw >= 1024) style = { left: rect.right + 16, top: Math.min(rect.top, vh - 220) };
    else style = { left: Math.min(Math.max(12, rect.right - W), vw - W - 12), top: Math.min(rect.bottom + 14, vh - 220) };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-label="Guided tour">
      <div className="absolute inset-0" onClick={close} />
      {rect && (
        <div className="pointer-events-none absolute rounded-xl transition-all duration-300"
          style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12, boxShadow: '0 0 0 9999px rgba(15,18,38,.62)' }} />
      )}
      {!rect && <div className="pointer-events-none absolute inset-0 bg-ink-900/60" />}
      <div className="pop absolute rounded-xl border border-ink-100 bg-white p-5 shadow-2xl" style={{ ...style, width: W }}>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Step {i + 1} of {steps.length}</p>
        <h3 className="mt-1 text-base font-semibold">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-ink-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between">
          <button className="text-sm text-ink-500 hover:text-ink-800" onClick={close}>Skip tour</button>
          <div className="flex gap-2">
            {i > 0 && <button className="btn-ghost px-3 py-1.5" onClick={() => setI(i - 1)}>Back</button>}
            <button className="btn-primary px-3 py-1.5" onClick={() => (last ? close() : setI(i + 1))}>{last ? 'Done' : 'Next'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
