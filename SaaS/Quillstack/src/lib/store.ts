'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useEffect, useState } from 'react';
import { ADMIN_ORGS, CUSTOMER_ORG_IDS, DEFAULT_PLAN, DOCS, PERSONAS, ORGS, PLANS, SUPERADMIN_USER, USERS, orgFromCustom, registerOrg, type CustomOrg } from '@/data/seed';
import type { AiAction, AuditRow, Doc, DocOverride, Notif, Org, OrgProfile, PlanId, Persona, Purchase, Role, UsageEntry, User } from '@/data/types';
import { initialsOf } from '@/lib/time';
import { buildDoc } from '@/lib/newDoc';
import { hashPw } from '@/lib/hash';

export interface SignUpInput { name: string; email: string; password: string; orgName: string; industry: string; }

export interface Toast { id: number; message: string; tone: 'success' | 'info' | 'warn'; }

interface State {
  authed: boolean;
  inviteeId: string | null;
  persona: Persona;
  orgId: string;
  creditsUsed: Record<string, number>;
  extraCredits: Record<string, number>;
  planIds: Record<string, PlanId>;
  invited: Record<string, User[]>;
  removedUsers: Record<string, string[]>;
  roles: Record<string, Role>;
  extraAudit: AuditRow[];
  customDocs: Doc[];
  docOverrides: Record<string, DocOverride>;
  customOrgs: CustomOrg[];
  accounts: Record<string, string>;
  orgProfile: Record<string, OrgProfile>;
  suspended: Record<string, boolean>;
  ai: Record<string, Partial<Record<AiAction, string>>>;
  usageLog: UsageEntry[];
  purchases: Purchase[];
  notifications: Notif[];
  feedback: Record<string, { vote: 'up' | 'down'; reason?: string }>;
  toasts: Toast[];
  login: (persona: Persona) => void;
  logout: () => void;
  resetWorkspace: () => void;
  signUp: (input: SignUpInput) => void;
  switchPersona: (persona: Persona) => void;
  actAsInvitee: (orgId: string, userId: string, role: Role) => void;
  setOrg: (id: string) => void;
  addDoc: (doc: Doc) => void;
  editDoc: (id: string, patch: DocOverride) => void;
  deleteDoc: (id: string) => void;
  addOrg: (org: CustomOrg) => void;
  updateOrgProfile: (orgId: string, patch: OrgProfile) => void;
  spend: (orgId: string, amount: number, meta?: { userId: string; action: AiAction }) => void;
  topUp: (orgId: string, credits: number) => void;
  addPurchase: (orgId: string, label: string, amount: number) => void;
  saveAi: (docId: string, action: AiAction, text: string) => void;
  setFeedback: (key: string, vote: 'up' | 'down', reason?: string) => void;
  upgradePlan: (orgId: string, plan: PlanId) => void;
  invite: (orgId: string, email: string, role: Role) => void;
  acceptInvite: (orgId: string, userId: string) => void;
  declineInvite: (orgId: string, userId: string) => void;
  unsendInvite: (orgId: string, userId: string) => void;
  removeMember: (orgId: string, userId: string) => void;
  leaveOrg: (orgId: string, userId: string) => void;
  setRole: (orgId: string, userId: string, role: Role) => void;
  toggleSuspend: (orgId: string) => void;
  bulkSuspend: (ids: string[], value: boolean) => void;
  bulkPlan: (ids: string[], plan: PlanId) => void;
  log: (orgId: string, userId: string, action: string, target: string) => void;
  notify: (to: string, title: string, body: string, href?: string) => void;
  markRead: (id: string) => void;
  markAllRead: (to: string) => void;
  toast: (message: string, tone?: Toast['tone']) => void;
  dismissToast: (id: number) => void;
}

const mk = (to: string, title: string, body: string, href?: string): Notif => ({
  id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, to, title, body, at: Date.now(), read: false, href,
});

const seedNotifs = (): Notif[] => {
  const t = Date.now();
  return [
    { id: 's1', to: 'priya.raman@example.com', title: 'Weekly usage report is ready', body: 'Northwind Studio used 912 AI credits this cycle.', at: t - 3 * 3600e3, read: false, href: '/dashboard' },
    { id: 's2', to: 'priya.raman@example.com', title: 'Bluepeak Legal is at 82% of its AI credits', body: 'Consider upgrading before the cycle ends.', at: t - 26 * 3600e3, read: false, href: '/billing' },
    { id: 's3', to: 'jonas.weber@example.com', title: 'Hannah Okafor edited a document', body: 'Social content calendar, November', at: t - 5 * 3600e3, read: false, href: '/documents' },
    { id: 's4', to: 'elena.costa@example.com', title: 'Lumen Logistics is suspended', body: 'Suspended 3 days ago. Review the account in the console.', at: t - 72 * 3600e3, read: true, href: '/admin' },
  ];
};

const initial = () => ({
  authed: false,
  inviteeId: null as string | null,
  persona: 'owner' as Persona,
  orgId: 'northwind',
  creditsUsed: Object.fromEntries(ORGS.map((o) => [o.id, o.creditsUsed])),
  extraCredits: {} as Record<string, number>,
  planIds: { ...DEFAULT_PLAN } as Record<string, PlanId>,
  invited: {} as Record<string, User[]>,
  removedUsers: {} as Record<string, string[]>,
  roles: {} as Record<string, Role>,
  extraAudit: [] as AuditRow[],
  customDocs: [] as Doc[],
  docOverrides: {} as Record<string, DocOverride>,
  customOrgs: [] as CustomOrg[],
  accounts: {} as Record<string, string>,
  orgProfile: {} as Record<string, OrgProfile>,
  suspended: Object.fromEntries(ADMIN_ORGS.map((o) => [o.id, o.suspended])),
  ai: {} as State['ai'],
  usageLog: [] as UsageEntry[],
  purchases: [] as Purchase[],
  notifications: seedNotifs(),
  feedback: {} as State['feedback'],
});

type Slice = Pick<State, 'customOrgs' | 'orgProfile'>;
function orgNameOf(s: Slice, orgId: string) {
  const base = ORGS.find((o) => o.id === orgId)?.name ?? s.customOrgs.find((o) => o.id === orgId)?.name ?? orgId;
  return s.orgProfile[orgId]?.name ?? base;
}
function ownerEmailOf(s: Slice, orgId: string) {
  return s.customOrgs.find((o) => o.id === orgId)?.ownerEmail ?? ADMIN_ORGS.find((o) => o.id === orgId)?.owner ?? null;
}
const senderOf = (s: State) =>
  s.inviteeId
    ? Object.values(s.invited).flat().find((u) => u.id === s.inviteeId)
      ?? (() => { const c = s.customOrgs.find((o) => `${o.id}-u0` === s.inviteeId); return c ? { name: c.ownerName, email: c.ownerEmail } : undefined; })()
    : (() => { const p = PERSONAS.find((x) => x.id === s.persona); return p ? { name: p.name, email: p.email } : undefined; })();

let toastId = 1;

export const useApp = create<State>()(
  persist(
    (set, get) => ({
      ...initial(),
      toasts: [],
      // Every sign-in starts from the same fresh workspace so each take matches.
      login: (persona) => set({ ...initial(), authed: true, persona, orgId: 'northwind' }),
      logout: () => set({ authed: false, inviteeId: null }),
      resetWorkspace: () => set({ ...initial(), authed: true, persona: get().persona, orgId: get().persona === 'superadmin' ? get().orgId : 'northwind', inviteeId: null }),
      switchPersona: (persona) => {
        const orgId = get().orgId;
        set({ inviteeId: null, persona, orgId: persona === 'superadmin' || CUSTOMER_ORG_IDS.includes(orgId) ? orgId : 'northwind' });
      },
      // Invited people sign in as themselves, with the permissions of the role they were invited with.
      actAsInvitee: (orgId, userId, role) => set({ authed: true, inviteeId: userId, orgId, persona: role === 'Admin' || role === 'Owner' ? 'owner' : 'member' }),
      // Creates the person's own organisation with them as Owner, adds a first document to try, and signs them in.
      signUp: ({ name, email, password, orgName, industry }) => {
        const s = get();
        const base = orgName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'org';
        const id = `${base}-${s.customOrgs.length + 1}`;
        const c: CustomOrg = { id, name: orgName, industry, planId: 'starter', ownerName: name, ownerEmail: email, region: 'US East' };
        registerOrg(c);
        const ownerId = `${id}-u0`;
        const starter = buildDoc(
          id, ownerId, 'Getting started with Quillstack', 'Notes',
          'Welcome to your new workspace. Quillstack helps your team summarise, rewrite and translate documents in one place.\n\n' +
            'Share this page with your teammates once they have joined. Draft your first document from the Documents page. Update your organisation profile so it looks like yours. Review the plans on the Billing page when you need more credits.\n\n' +
            'Try the AI assistant on this page to see a summary and a list of action items.',
        );
        set((st) => ({
          authed: true, inviteeId: ownerId, orgId: id, persona: 'owner' as Persona,
          customOrgs: [...st.customOrgs, c],
          accounts: { ...st.accounts, [email]: hashPw(password) },
          creditsUsed: { ...st.creditsUsed, [id]: 0 },
          planIds: { ...st.planIds, [id]: 'starter' as PlanId },
          suspended: { ...st.suspended, [id]: false },
          customDocs: [starter, ...st.customDocs],
          extraAudit: [{ id: `x-${Date.now()}-su`, orgId: id, userId: ownerId, action: 'Created organisation', target: orgName, mins: 0, at: Date.now() }, ...st.extraAudit],
          notifications: [mk(email, 'Welcome to Quillstack', 'Your workspace is ready. Open the starter document to try the AI assistant.', '/documents'), ...st.notifications],
        }));
      },
      setOrg: (id) => set({ orgId: id }),
      addOrg: (c) => {
        registerOrg(c);
        set((s) => ({
          customOrgs: [...s.customOrgs, c],
          creditsUsed: { ...s.creditsUsed, [c.id]: 0 },
          planIds: { ...s.planIds, [c.id]: c.planId },
          suspended: { ...s.suspended, [c.id]: false },
        }));
      },
      updateOrgProfile: (orgId, patch) => set((s) => ({ orgProfile: { ...s.orgProfile, [orgId]: { ...s.orgProfile[orgId], ...patch } } })),
      addDoc: (doc) => set((s) => ({ customDocs: [doc, ...s.customDocs] })),
      editDoc: (id, patch) => set((s) => ({ docOverrides: { ...s.docOverrides, [id]: { ...s.docOverrides[id], ...patch, editedAt: Date.now() } } })),
      deleteDoc: (id) => set((s) => ({ docOverrides: { ...s.docOverrides, [id]: { ...s.docOverrides[id], deleted: true } } })),
      spend: (orgId, amount, meta) =>
        set((s) => {
          const before = s.creditsUsed[orgId] ?? 0;
          const after = before + amount;
          const limit = PLANS[s.planIds[orgId] ?? 'starter'].credits + (s.extraCredits[orgId] ?? 0);
          const owner = ownerEmailOf(s, orgId);
          const name = orgNameOf(s, orgId);
          let notifications = s.notifications;
          if (owner) {
            if (before < limit && after >= limit) notifications = [mk(owner, 'AI credits used up', `${name} has used all of its AI credits.`, '/billing'), ...notifications];
            else if (before < limit * 0.8 && after >= limit * 0.8) notifications = [mk(owner, 'AI credits running low', `${name} has used ${Math.round((after / limit) * 100)}% of its AI credits.`, '/billing'), ...notifications];
          }
          return {
            creditsUsed: { ...s.creditsUsed, [orgId]: after },
            usageLog: meta ? [...s.usageLog, { orgId, userId: meta.userId, action: meta.action, credits: amount, at: Date.now() }] : s.usageLog,
            notifications,
          };
        }),
      topUp: (orgId, credits) => set((s) => ({ extraCredits: { ...s.extraCredits, [orgId]: (s.extraCredits[orgId] ?? 0) + credits } })),
      addPurchase: (orgId, label, amount) => set((s) => ({ purchases: [{ id: `p-${Date.now()}`, orgId, label, amount, at: Date.now() }, ...s.purchases] })),
      saveAi: (docId, action, text) => set((s) => ({ ai: { ...s.ai, [docId]: { ...s.ai[docId], [action]: text } } })),
      setFeedback: (key, vote, reason) => set((s) => ({ feedback: { ...s.feedback, [key]: { vote, reason } } })),
      upgradePlan: (orgId, plan) => set((s) => ({ planIds: { ...s.planIds, [orgId]: plan } })),
      invite: (orgId, email, role) =>
        set((s) => {
          const name = email.split('@')[0].split(/[._-]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
          // The invitation records whoever is signed in right now as its sender.
          const sender = senderOf(s);
          const user: User = { id: `inv-${Date.now()}`, name, email, role, lastActiveMins: 0, pending: true, invitedBy: sender?.name ?? 'A teammate', invitedByEmail: sender?.email, invitedAt: Date.now() };
          return {
            invited: { ...s.invited, [orgId]: [...(s.invited[orgId] ?? []), user] },
            notifications: [mk(email, `${user.invitedBy} invited you to ${orgNameOf(s, orgId)}`, `You were invited as ${role}. Accept it from your home page.`, '/dashboard'), ...s.notifications],
          };
        }),
      acceptInvite: (orgId, userId) =>
        set((s) => {
          const u = (s.invited[orgId] ?? []).find((x) => x.id === userId);
          return {
            invited: { ...s.invited, [orgId]: (s.invited[orgId] ?? []).map((x) => (x.id === userId ? { ...x, pending: false, lastActiveMins: 0 } : x)) },
            notifications: u?.invitedByEmail ? [mk(u.invitedByEmail, `${u.name} accepted your invitation`, `${u.name} joined ${orgNameOf(s, orgId)}.`, '/team'), ...s.notifications] : s.notifications,
          };
        }),
      declineInvite: (orgId, userId) =>
        set((s) => {
          const u = (s.invited[orgId] ?? []).find((x) => x.id === userId);
          return {
            invited: { ...s.invited, [orgId]: (s.invited[orgId] ?? []).filter((x) => x.id !== userId) },
            notifications: u?.invitedByEmail ? [mk(u.invitedByEmail, `${u.name} declined your invitation`, `${u.name} will not join ${orgNameOf(s, orgId)}.`, '/team'), ...s.notifications] : s.notifications,
          };
        }),
      unsendInvite: (orgId, userId) =>
        set((s) => {
          const u = (s.invited[orgId] ?? []).find((x) => x.id === userId);
          return {
            invited: { ...s.invited, [orgId]: (s.invited[orgId] ?? []).filter((x) => x.id !== userId) },
            notifications: u ? [mk(u.email, `Invitation to ${orgNameOf(s, orgId)} withdrawn`, `${senderOf(s)?.name ?? 'An administrator'} withdrew the invitation.`, '/dashboard'), ...s.notifications] : s.notifications,
          };
        }),
      removeMember: (orgId, userId) =>
        set((s) => {
          const inv = s.invited[orgId] ?? [];
          const target = inv.find((u) => u.id === userId) ?? USERS[orgId]?.find((u) => u.id === userId);
          const notifications = target ? [mk(target.email, `You were removed from ${orgNameOf(s, orgId)}`, 'An administrator removed you from the organisation.', '/dashboard'), ...s.notifications] : s.notifications;
          return inv.some((u) => u.id === userId)
            ? { invited: { ...s.invited, [orgId]: inv.filter((u) => u.id !== userId) }, notifications }
            : { removedUsers: { ...s.removedUsers, [orgId]: [...(s.removedUsers[orgId] ?? []), userId] }, notifications };
        }),
      leaveOrg: (orgId, userId) =>
        set((s) => {
          const u = (s.invited[orgId] ?? []).find((x) => x.id === userId);
          const owner = ownerEmailOf(s, orgId);
          return {
            invited: { ...s.invited, [orgId]: (s.invited[orgId] ?? []).filter((x) => x.id !== userId) },
            notifications: u && owner ? [mk(owner, `${u.name} left ${orgNameOf(s, orgId)}`, 'They left the organisation.', '/team'), ...s.notifications] : s.notifications,
          };
        }),
      setRole: (orgId, userId, role) => set((s) => ({ roles: { ...s.roles, [`${orgId}:${userId}`]: role } })),
      toggleSuspend: (orgId) =>
        set((s) => {
          const now = !s.suspended[orgId];
          const owner = ownerEmailOf(s, orgId);
          return {
            suspended: { ...s.suspended, [orgId]: now },
            notifications: owner ? [mk(owner, now ? `${orgNameOf(s, orgId)} was suspended` : `${orgNameOf(s, orgId)} was reinstated`, now ? 'AI features are paused until an administrator reinstates the account.' : 'AI features are available again.', '/dashboard'), ...s.notifications] : s.notifications,
          };
        }),
      bulkSuspend: (ids, value) =>
        set((s) => {
          let notifications = s.notifications;
          ids.forEach((id) => {
            const owner = ownerEmailOf(s, id);
            if (owner && s.suspended[id] !== value) notifications = [mk(owner, value ? `${orgNameOf(s, id)} was suspended` : `${orgNameOf(s, id)} was reinstated`, value ? 'AI features are paused until an administrator reinstates the account.' : 'AI features are available again.', '/dashboard'), ...notifications];
          });
          return { suspended: { ...s.suspended, ...Object.fromEntries(ids.map((id) => [id, value])) }, notifications };
        }),
      bulkPlan: (ids, plan) => set((s) => ({ planIds: { ...s.planIds, ...Object.fromEntries(ids.map((id) => [id, plan])) } })),
      log: (orgId, userId, action, target) =>
        set((s) => ({
          extraAudit: [{ id: `x-${Date.now()}-${s.extraAudit.length}`, orgId, userId, action, target, mins: 0, at: Date.now() }, ...s.extraAudit],
        })),
      notify: (to, title, body, href) => set((s) => ({ notifications: [mk(to, title, body, href), ...s.notifications] })),
      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: (to) => set((s) => ({ notifications: s.notifications.map((n) => (n.to === to ? { ...n, read: true } : n)) })),
      toast: (message, tone = 'success') => {
        const id = toastId++;
        set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
        setTimeout(() => get().dismissToast(id), 3600);
      },
      dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'quillstack-session',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: ({ toasts: _t, ...rest }) => rest as unknown as State,
    },
  ),
);

/** Rehydrates the persisted session on the client and reports when it is ready. */
export function useReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    Promise.resolve(useApp.persist.rehydrate()).finally(() => {
      useApp.getState().customOrgs.forEach(registerOrg);
      setReady(true);
    });
  }, []);
  return ready;
}

// ------------- derived helpers -------------
export function currentUserId(persona: Persona) {
  const s = useApp.getState();
  const all = Object.values(s.invited).flat();
  const email = s.inviteeId ? all.find((u) => u.id === s.inviteeId)?.email : PERSONAS.find((p) => p.id === persona)?.email;
  const joined = (s.invited[s.orgId] ?? []).find((u) => u.email === email && !u.pending);
  if (joined) return joined.id;
  if (s.inviteeId) return s.inviteeId;
  return persona === 'owner' ? 'u-priya' : persona === 'member' ? 'u-jonas' : SUPERADMIN_USER.id;
}

/** Applies an organisation's edited profile (name, industry, colour) on top of its base record. */
export function applyProfile(o: Org, p?: OrgProfile): Org {
  if (!p) return o;
  return {
    ...o,
    name: p.name ?? o.name,
    industry: p.industry ?? o.industry,
    tone: p.tone ?? o.tone,
    initials: p.name ? initialsOf(p.name.replace('&', '')).slice(0, 2) : o.initials,
  };
}

/** Every organisation, including ones created in this visit, with edits applied. */
export function useOrgList() {
  const customOrgs = useApp((s) => s.customOrgs);
  const profiles = useApp((s) => s.orgProfile);
  return [...ORGS, ...customOrgs.map(orgFromCustom)].map((o) => applyProfile(o, profiles[o.id]));
}

export function useOrg() {
  const s = useApp();
  const created = s.customOrgs.find((o) => o.id === s.orgId);
  const found = ORGS.find((o) => o.id === s.orgId) ?? (created ? orgFromCustom(created) : ORGS[0]);
  const org = applyProfile(found, s.orgProfile[found.id]);
  const basePlan = PLANS[s.planIds[org.id] ?? org.planId];
  const bonus = s.extraCredits[org.id] ?? 0;
  const plan = bonus ? { ...basePlan, credits: basePlan.credits + bonus } : basePlan;
  const used = s.creditsUsed[org.id] ?? org.creditsUsed;
  const removed = s.removedUsers[org.id] ?? [];
  const baseUsers = USERS[org.id].filter((u) => !removed.includes(u.id)).map((u) => ({ ...u, role: s.roles[`${org.id}:${u.id}`] ?? u.role }));
  const invited = (s.invited[org.id] ?? []).map((u) => ({ ...u, role: s.roles[`${org.id}:${u.id}`] ?? u.role }));
  const users = [...baseUsers, ...invited];
  return { org, plan, bonus, used, remaining: Math.max(plan.credits - used, 0), users, seatsUsed: users.length };
}

/** Seeded documents plus any created during this visit, with edits applied and deleted ones removed. */
export function useDocs(orgId: string) {
  const custom = useApp((s) => s.customDocs);
  const ov = useApp((s) => s.docOverrides);
  return [...custom, ...DOCS]
    .filter((d) => d.orgId === orgId && !ov[d.id]?.deleted)
    .map((d) => {
      const o = ov[d.id];
      if (!o) return d;
      const { deleted: _d, editedAt, editedBy: _e, ...fields } = o;
      return { ...d, ...fields, updatedMins: editedAt ? (Date.now() - editedAt) / 60000 : d.updatedMins };
    });
}

/** Edit metadata for a document, if it has been edited this visit. */
export function useDocEdit(id: string) {
  return useApp((s) => s.docOverrides[id]);
}

/** Everyone who has been invited, across organisations. */
export function useInvitees() {
  const invited = useApp((s) => s.invited);
  const roles = useApp((s) => s.roles);
  const customOrgs = useApp((s) => s.customOrgs);
  const fromInvites = Object.entries(invited).flatMap(([orgId, us]) => us.map((u) => ({ orgId, user: { ...u, role: roles[`${orgId}:${u.id}`] ?? u.role } })));
  // The owner of an organisation created in this visit is an account too, so they can sign in and be switched to.
  const owners = customOrgs.map((c) => ({
    orgId: c.id,
    user: { id: `${c.id}-u0`, name: c.ownerName, email: c.ownerEmail, role: 'Owner' as Role, lastActiveMins: 0 } as User,
  }));
  return [...fromInvites, ...owners];
}

/** The invited person currently signed in, if any. */
export function useIdentity() {
  const inviteeId = useApp((s) => s.inviteeId);
  const all = useInvitees();
  return inviteeId ? all.find((x) => x.user.id === inviteeId) ?? null : null;
}

/** The email address of whoever is signed in. */
export function useMyEmail() {
  const inviteeId = useApp((s) => s.inviteeId);
  const persona = useApp((s) => s.persona);
  const all = useInvitees();
  if (inviteeId) return all.find((x) => x.user.id === inviteeId)?.user.email ?? null;
  return PERSONAS.find((p) => p.id === persona)?.email ?? null;
}

/** Invitations addressed to the signed-in account, and the organisations it has joined by invitation. */
export function useMyInvites() {
  const email = useMyEmail();
  const all = useInvitees();
  const mine = all.filter((x) => x.user.email === email);
  const persona = useApp((s) => s.persona);
  const identity = useIdentity();
  const myName = identity?.user.name ?? PERSONAS.find((p) => p.id === persona)?.name ?? 'there';
  return {
    pending: mine.filter((x) => x.user.pending),
    memberOrgIds: mine.filter((x) => !x.user.pending).map((x) => x.orgId),
    myName,
  };
}
