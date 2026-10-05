export type PlanId = 'starter' | 'team' | 'business';
export type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer';
export type Persona = 'owner' | 'member' | 'superadmin';
export type AiAction = 'summary' | 'actions' | 'rewrite' | 'translate' | 'formal' | 'friendly' | 'concise' | 'followup';

export interface Plan {
  id: PlanId; name: string; price: number; seats: number; credits: number; tagline: string; features: string[];
}
export interface Org { id: string; name: string; initials: string; tone: string; planId: PlanId; creditsUsed: number; industry: string; }
export interface User { id: string; name: string; email: string; role: Role; lastActiveMins: number; pending?: boolean; invitedBy?: string; invitedByEmail?: string; invitedAt?: number; }
export interface Doc {
  id: string; orgId: string; title: string; kind: string; authorId: string; updatedMins: number; createdMins: number; words: number;
  body: string[]; summary: string; actions: string[]; rewrite: string; es: string;
}
export interface AuditRow { id: string; orgId: string; userId: string; action: string; target: string; mins: number; at?: number; }
export interface AdminOrg { id: string; name: string; planId: PlanId; seats: number; seatLimit: number; aiCost: number; suspended: boolean; owner: string; region: string; }
export interface PersonaInfo { id: Persona; userId: string; name: string; email: string; title: string; password: string; }

export interface Notif { id: string; to: string; title: string; body: string; at: number; read: boolean; href?: string; }
export interface DocOverride {
  title?: string; kind?: string; body?: string[]; words?: number; summary?: string; actions?: string[]; rewrite?: string; es?: string;
  deleted?: boolean; editedAt?: number; editedBy?: string;
}
export interface UsageEntry { orgId: string; userId: string; action: AiAction; credits: number; at: number; }
export interface Purchase { id: string; orgId: string; label: string; amount: number; at: number; }
export interface OrgProfile { name?: string; industry?: string; region?: string; tone?: string; }
