export type Me = { id: string; name: string; email: string; role: 'member' | 'admin'; account: string; title: string; company: string; can_change_password: boolean };
export type Doc = { id: string; title: string; kind: string; category: string; pages: number; size_kb: number; owner: string; updated_mins_ago: number; status: 'Ready' | 'Processing' };
export type DocFull = Doc & { body: string[] };
export type Citation = { n: number; doc_id: string; doc_title: string; quote: string };
export type Reply = { id: string; question: string; answer: string; citations: Citation[]; not_found: boolean; related: Doc[] };
export type Template = { id: string; name: string; description: string; fields: { key: string; label: string; default: string }[] };
export type DraftResult = { text: string; found: boolean; subject: string; sources: { doc_id: string; doc_title: string; quote: string }[] };
export type SearchResult = { docs: (Doc & { snippet: string; quote: string | null })[]; questions: string[] };
export type AdminUser = { id: string; name: string; email: string; role: string; title: string; last_active_mins: number; questions: number; status: 'Active' | 'Pending' };
export type WrongRow = { id: string; user: string; question: string; reason: string; mins: number; status: string };
export const CATEGORIES = ['Policy', 'Guide', 'Client notes', 'Meeting', 'Uploaded'];
export type Persona = { key: string; role: 'member' | 'admin'; name: string; email: string; title: string };
export type Home = { doc_count: number; ready_count: number; questions_this_week: number; recent: { id: string; user: string; question: string; mins: number; rating: string | null }[]; suggestions: string[] };

import { ApiError } from './engine/errors';
import { engine } from './engine/engine';

export { ApiError };

/** A short pause so loading states show, the way a networked app would. */
const run = async <T,>(fn: () => T | Promise<T>, ms = 140): Promise<T> => {
  await new Promise((r) => setTimeout(r, ms));
  return fn();
};

export const api = {
  personas: () => run<Persona[]>(() => engine.personas(), 60),
  login: (email: string, password: string) => run<Me>(() => engine.login(email, password), 450),
  signup: (name: string, email: string, password: string) => run<Me>(() => engine.signup(name, email, password), 450),
  me: () => run<Me>(() => engine.me(), 60),
  switchTo: (role: string) => run<Me>(() => engine.switchTo(role)),
  home: () => run<Home>(() => engine.home()),
  docs: () => run<Doc[]>(() => engine.docs()),
  doc: (id: string) => run<DocFull>(() => engine.doc(id), 100),
  upload: (name: string, size_kb: number, category = 'Uploaded') => run<Doc>(() => engine.upload(name, size_kb, category), 250),
  editDoc: (id: string, p: { title?: string; category?: string }) => run<Doc>(() => engine.editDoc(id, p)),
  deleteDoc: (id: string) => run<{ ok: boolean }>(() => engine.deleteDoc(id)),
  search: (q: string) => run<SearchResult>(() => engine.search(q), 40),
  updateMe: (name: string, title: string) => run<Me>(() => engine.updateMe(name, title)),
  changePassword: (current: string, next: string) => run<{ ok: boolean }>(() => engine.changePassword(current, next), 350),
  signout: () => run<{ ok: boolean }>(() => engine.signout(), 30),
  invite: (email: string, role: string) => run<{ id: string }>(() => engine.invite(email, role), 250),
  revokeInvite: (id: string) => run<{ ok: boolean }>(() => engine.revokeInvite(id)),
  setRole: (id: string, role: string) => run<{ ok: boolean }>(() => engine.setRole(id, role)),
  setWrongStatus: (id: string, status: string) => run<{ ok: boolean }>(() => engine.setWrongStatus(id, status)),
  chat: (question: string) => run<Reply>(() => engine.chat(question), 80),
  templates: () => run<Template[]>(() => engine.templates(), 60),
  draft: (template_id: string, values: Record<string, string>) => run<DraftResult>(() => engine.draft(template_id, values), 80),
  feedback: (message_id: string, question: string, rating: 'up' | 'down', reason = '') => run<{ ok: boolean }>(() => engine.feedback(message_id, question, rating, reason), 100),
  adminStats: () => run<{ users: number; documents: number; questions_this_week: number; wrong_answers: number; pending_invites: number }>(() => engine.adminStats()),
  adminUsers: () => run<AdminUser[]>(() => engine.adminUsers()),
  adminWrong: () => run<WrongRow[]>(() => engine.adminWrong()),
  adminUsage: () => run<{ day_offset: number; questions: number; drafts: number }[]>(() => engine.adminUsage()),
};
