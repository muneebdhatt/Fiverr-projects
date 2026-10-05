import { AUDIT, CREDIT_COST } from '@/data/seed';
import type { AiAction, UsageEntry } from '@/data/types';

const GROUP: Record<string, string> = {
  summary: 'Summaries', actions: 'Action items', rewrite: 'Rewrites', translate: 'Translations',
  formal: 'Tone changes', friendly: 'Tone changes', concise: 'Tone changes', followup: 'Follow-ups',
};
const AUDIT_KEY: Record<string, AiAction> = {
  'AI summarise': 'summary', 'AI action items': 'actions', 'AI rewrite': 'rewrite', 'AI translate': 'translate', 'AI follow-up': 'followup',
};

export interface Bar { label: string; value: number }

function tally(into: Map<string, number>, key: string, value: number) {
  into.set(key, (into.get(key) ?? 0) + value);
}

/**
 * Splits an organisation's AI credits by action and by person.
 * The starting balance is spread in proportion to the organisation's recorded AI activity,
 * and anything spent during this visit is added exactly as it happened.
 */
export function usageBreakdown(orgId: string, baseUsed: number, live: UsageEntry[], nameOf: (userId: string) => string) {
  const byAction = new Map<string, number>();
  const byPerson = new Map<string, number>();

  const rows = AUDIT.filter((r) => r.orgId === orgId && AUDIT_KEY[r.action]);
  const weight = rows.reduce((sum, r) => sum + CREDIT_COST[AUDIT_KEY[r.action]], 0);
  if (weight > 0 && baseUsed > 0) {
    const scale = baseUsed / weight;
    rows.forEach((r) => {
      const credits = CREDIT_COST[AUDIT_KEY[r.action]] * scale;
      tally(byAction, GROUP[AUDIT_KEY[r.action]], credits);
      tally(byPerson, nameOf(r.userId), credits);
    });
  }
  live.filter((e) => e.orgId === orgId).forEach((e) => {
    tally(byAction, GROUP[e.action], e.credits);
    tally(byPerson, nameOf(e.userId), e.credits);
  });

  const toBars = (m: Map<string, number>): Bar[] =>
    Array.from(m, ([label, value]) => ({ label, value: Math.round(value) })).filter((b) => b.value > 0).sort((a, b) => b.value - a.value);
  return { byAction: toBars(byAction), byPerson: toBars(byPerson).slice(0, 5) };
}
