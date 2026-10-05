import type { PersonaId } from '@/data/types';

export interface TourStep {
  path: string;
  target: string;
  title: string;
  body: string;
}

const COMMON_END: TourStep[] = [
  { path: '', target: 'header-tools', title: 'Shortcuts, theme and alerts', body: 'Keyboard shortcuts, dark mode and your notifications live up here. Press ? any time to see the shortcut list.' },
  { path: '', target: 'profile-menu', title: 'Switch account', body: 'Open this menu to see Shiftwire as a business, a worker or an admin. Each role has its own screens.' },
];

export const TOURS: Record<PersonaId, TourStep[]> = {
  business: [
    { path: '/shifts', target: 'nav-/post-shift', title: 'Post a shift', body: 'Everything starts here. Describe an open shift and Shiftwire texts the closest qualified workers.' },
    { path: '/post-shift', target: 'shift-form', title: 'Describe the shift', body: 'Role, date, hours, rate and how many workers you need. Load a saved template or repeat the shift weekly.' },
    { path: '/post-shift', target: 'escalation', title: 'Escalation rules', body: 'If nobody says YES within 2 minutes, Shiftwire can raise the rate or widen the search for you.' },
    { path: '/post-shift', target: 'who-texted', title: 'Who gets the text', body: 'The closest qualified workers, with favourites and the most reliable ranked first. Anyone who opted out is skipped.' },
    { path: '/post-shift', target: 'broadcast-btn', title: 'Broadcast', body: 'One tap texts the whole group. You land on a live feed where replies arrive and the first YES wins the shift.' },
    { path: '/workers', target: 'worker-filters', title: 'Find workers', body: 'Filter by skill, distance and rating, sort by reliability, and favourite the people you trust.' },
    { path: '/shifts', target: 'shift-table', title: 'Shift history', body: 'Every shift with its status, who covered it and how fast. Open one to rate the worker, replay it or post it again.' },
    { path: '/billing', target: 'billing-plan', title: 'Plan and billing', body: 'One plan, one price. See your next charge date, texts sent this month and every invoice.' },
    ...COMMON_END,
  ],
  worker: [
    { path: '/offers', target: 'availability', title: 'Available tonight', body: 'Turn this on and nearby businesses text you first when they need cover.' },
    { path: '/offers', target: 'offer-list', title: 'Shift offers', body: 'Offers arrive like text messages. Reply YES to claim a shift, or NO to pass. The first YES wins.' },
    { path: '/earnings', target: 'earnings-stats', title: 'Your earnings', body: 'What you earned, hours worked and your average rate over the last 30 days.' },
    { path: '/profile', target: 'nav-/profile', title: 'Your profile', body: 'Keep your skills, certificate and usual days up to date so the right shifts find you.' },
    ...COMMON_END,
  ],
  admin: [
    { path: '/admin', target: 'admin-kpis', title: 'The marketplace at a glance', body: 'Businesses, workers, shifts posted, fill rate and this month’s revenue.' },
    { path: '/admin', target: 'admin-mrr', title: 'Recurring revenue', body: 'Monthly recurring revenue from paying businesses. Resolving a failed payment moves this number.' },
    { path: '/admin', target: 'admin-tabs', title: 'Businesses, workers and compliance', body: 'Browse every business, worker and shift, and review the consent and opt-out log. Each tab exports to CSV.' },
    ...COMMON_END,
  ],
};
