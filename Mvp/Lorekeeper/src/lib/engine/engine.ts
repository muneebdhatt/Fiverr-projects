/**
 * The workspace logic that used to live in a separate API. It runs in the browser and keeps its state in
 * localStorage, so nothing is sent anywhere. Answers are prepared and the same on every run.
 */
import { ApiError } from './errors';
import rawSeed from './seed.json';

/* ---------- types ---------- */

type Cite = { doc?: string; quote: string; doc_obj?: Doc };
type Qa = { id: string; question: string; keywords: string[]; answer: string; citations: Cite[] };
type Doc = {
  id: string; title: string; kind: string; category: string; pages: number; size_kb: number; owner: string; updated: number; body: string[];
};
type User = { id: string; name: string; email: string; role: string; title: string; last_active_mins: number; questions: number };
type Field = { key: string; label: string; default: string };
type Template = { id: string; name: string; description: string; fields: Field[] };
type Importable = { kind: string; pages: number; body: string[]; qa: Qa[] };
type Seed = {
  COMPANY: string; PASSWORD: string; USERS: User[]; PERSONAS: Record<string, string>; DOCS: Doc[]; QA: Qa[];
  NOT_FOUND: { id: string; question: string; keywords: string[]; answer: string; related: string[] };
  SUGGESTIONS: string[]; TEMPLATES: Template[];
  RECENT_QUESTIONS: { id: string; user: string; question: string; mins: number; rating: string | null }[];
  WRONG_ANSWERS: { id: string; user: string; question: string; reason: string; mins: number; status: string }[];
  USAGE: number[][]; IMPORTABLE: Record<string, Importable>; VENDOR_WORDS: string[];
};
const seed = rawSeed as unknown as Seed;

type Upload = { doc: Doc; created: number; key: string | null };
type Asked = { id: string; user: string; question: string; mins: number; rating: string | null };
type Wrong = { id: string; message_id: string; user: string; question: string; reason: string; mins: number; status: string };
type Invite = { id: string; name: string; email: string; role: string };
type Session = {
  role: string;
  custom: User | null;
  uploads: Upload[];
  upload_n: number;
  questions: Asked[];
  wrong: Wrong[];
  deleted: string[];
  doc_over: Record<string, Partial<Doc>>;
  profile: Record<string, { name: string; title: string }>;
  roles: Record<string, string>;
  invites: Invite[];
  invite_n: number;
  wrong_status: Record<string, string>;
};
type State = { accounts: Record<string, { user: User; pw: string }>; s: Session };

const KEY = 'lk_state';
const PROCESSING_MS = 4000;
const CATEGORIES = ['Policy', 'Guide', 'Client notes', 'Meeting', 'Uploaded'];
const DOC_BY_ID: Record<string, Doc> = Object.fromEntries(seed.DOCS.map((d) => [d.id, d]));
const VENDOR_WORDS = new Set(seed.VENDOR_WORDS);

const freshSession = (): Session => ({
  role: 'member', custom: null, uploads: [], upload_n: 0, questions: [], wrong: [], deleted: [], doc_over: {},
  profile: {}, roles: {}, invites: [], invite_n: 0, wrong_status: {},
});

let cache: State | null = null;
function state(): State {
  if (cache) return cache;
  let loaded: State | null = null;
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null;
    if (raw) loaded = JSON.parse(raw) as State;
  } catch {}
  cache = loaded && loaded.s ? { accounts: loaded.accounts ?? {}, s: { ...freshSession(), ...loaded.s } } : { accounts: {}, s: freshSession() };
  return cache;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
}

async function hashPw(pw: string): Promise<string> {
  const bytes = new TextEncoder().encode('lorekeeper:' + pw);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/* ---------- people ---------- */

function baseUser(s: Session): User {
  if (s.role === 'custom' && s.custom) return s.custom;
  const uid = seed.PERSONAS[s.role === 'admin' ? 'admin' : 'member'];
  return seed.USERS.find((u) => u.id === uid) as User;
}
function withOverrides(u: User, s: Session): User {
  return { ...u, ...(s.profile[u.id] ?? {}), ...(s.roles[u.id] ? { role: s.roles[u.id] } : {}) };
}
const currentUser = (s: Session) => withOverrides(baseUser(s), s);
function requireAdmin(s: Session) {
  if (currentUser(s).role !== 'admin') throw new ApiError(403, 'Admins only');
}

/* ---------- documents ---------- */

const dview = (d: Doc, s: Session): Doc => ({ ...d, ...(s.doc_over[d.id] ?? {}) });
const uploadStatus = (u: Upload) => (Date.now() - u.created >= PROCESSING_MS ? 'Ready' : 'Processing');
const summary = (d: Doc, status = 'Ready') => ({
  id: d.id, title: d.title, kind: d.kind, category: d.category, pages: d.pages, size_kb: d.size_kb, owner: d.owner,
  updated_mins_ago: d.updated, status: status as 'Ready' | 'Processing',
});
const liveSeedDocs = (s: Session) => seed.DOCS.filter((d) => !s.deleted.includes(d.id)).map((d) => dview(d, s));
function allDocs(s: Session) {
  const rows = [...s.uploads].reverse().map((u) => summary(dview(u.doc, s), uploadStatus(u)));
  return rows.concat(liveSeedDocs(s).map((d) => summary(d)));
}
function findAnyDoc(id: string, s: Session): [Doc, string] | null {
  if (!s.deleted.includes(id) && DOC_BY_ID[id]) return [dview(DOC_BY_ID[id], s), 'Ready'];
  const u = s.uploads.find((x) => x.doc.id === id);
  return u ? [dview(u.doc, s), uploadStatus(u)] : null;
}

/* ---------- matching ---------- */

const TOKEN_RE = /[a-z0-9$%]+/g;
const tokens = (t: string) => new Set(t.toLowerCase().match(TOKEN_RE) ?? []);
const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'what', 'how', 'do', 'i', 'we', 'our', 'my', 'of', 'to', 'for', 'on', 'in', 'and', 'can', 'does', 'did', 'with', 'it', 'me', 'about', 'tell', 'was', 's', 'policy', 'policies', 'get', 'need', 'much', 'many', 'document', 'documents', 'please', 'any', 'there', 'this', 'that', 'have', 'has']);
const minusStop = (t: Set<string>) => new Set([...t].filter((x) => !STOP.has(x)));
const overlap = (a: Set<string>, b: Set<string>) => [...a].filter((x) => b.has(x)).length;

type Entry = { question: string; keywords: string[] };
function hitCount(question: string, e: Entry) {
  const q = minusStop(tokens(question));
  const kw = new Set([...e.keywords, ...minusStop(tokens(e.question))]);
  return overlap(q, kw);
}
function score(question: string, e: Entry) {
  const n = minusStop(tokens(question)).size;
  return n === 0 ? 0 : hitCount(question, e) / Math.sqrt(n);
}
function relevant(question: string, e: Entry) {
  const n = minusStop(tokens(question)).size;
  return score(question, e) >= 0.45 && (n < 2 || hitCount(question, e) >= 2);
}
function relatedDocs(question: string, s: Session, limit = 3) {
  const q = minusStop(tokens(question));
  return liveSeedDocs(s)
    .map((d) => ({ d, hits: overlap(q, new Set([...tokens(d.title), ...tokens(d.body.join(' '))])) }))
    .sort((a, b) => b.hits - a.hits || (a.d.id < b.d.id ? -1 : 1))
    .slice(0, limit)
    .map((x) => summary(x.d));
}

/* ---------- API ---------- */

const meOf = (s: Session) => {
  const u = currentUser(s);
  return { id: u.id, name: u.name, email: u.email, role: u.role as 'member' | 'admin', account: s.role, title: u.title, company: seed.COMPANY, can_change_password: s.role === 'custom' };
};
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export const engine = {
  personas() {
    const { s } = state();
    const out = Object.entries(seed.PERSONAS).map(([key, uid]) => {
      const u = withOverrides(seed.USERS.find((x) => x.id === uid) as User, s);
      return { key, role: u.role as 'member' | 'admin', name: u.name, email: u.email, title: u.title };
    });
    if (s.custom) {
      const c = withOverrides(s.custom, s);
      out.push({ key: 'custom', role: c.role as 'member' | 'admin', name: c.name, email: c.email, title: c.title });
    }
    return out;
  },

  async login(emailRaw: string, password: string) {
    const st = state();
    const email = emailRaw.trim().toLowerCase();
    const mine = st.accounts[email];
    if (mine) {
      if ((await hashPw(password)) !== mine.pw) throw new ApiError(401, 'Incorrect email or password');
      st.s.custom = mine.user;
      st.s.role = 'custom';
    } else {
      const user = seed.USERS.find((u) => u.email === email);
      if (!user || password !== seed.PASSWORD) throw new ApiError(401, 'Incorrect email or password');
      st.s.role = user.role === 'admin' ? 'admin' : 'member';
    }
    save();
    return meOf(st.s);
  },

  async signup(nameRaw: string, emailRaw: string, password: string) {
    const st = state();
    const name = nameRaw.split(/\s+/).filter(Boolean).join(' ');
    const email = emailRaw.trim().toLowerCase();
    if (name.length < 2) throw new ApiError(400, 'Enter your full name');
    if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Enter a valid work email');
    if (password.length < 8) throw new ApiError(400, 'Use at least 8 characters for the password');
    if (st.accounts[email] || seed.USERS.some((u) => u.email === email)) throw new ApiError(409, 'An account with this email already exists');
    const user: User = { id: `c${Object.keys(st.accounts).length + 1}`, name, email, role: 'member', title: 'Team member', last_active_mins: 0, questions: 0 };
    st.accounts[email] = { user, pw: await hashPw(password) };
    st.s.custom = user;
    st.s.role = 'custom';
    save();
    return meOf(st.s);
  },

  signout() {
    const st = state();
    st.s = freshSession();
    save();
    return { ok: true };
  },

  me: () => meOf(state().s),

  updateMe(nameRaw: string, titleRaw: string) {
    const st = state();
    const name = nameRaw.split(/\s+/).filter(Boolean).join(' ');
    if (name.length < 2) throw new ApiError(400, 'Enter your full name');
    const base = baseUser(st.s);
    st.s.profile[base.id] = { name, title: titleRaw.split(/\s+/).filter(Boolean).join(' ') || base.title };
    if (st.s.role === 'custom' && st.s.custom) {
      Object.assign(st.s.custom, st.s.profile[base.id]);
      if (st.accounts[st.s.custom.email]) st.accounts[st.s.custom.email].user = st.s.custom;
    }
    save();
    return meOf(st.s);
  },

  async changePassword(current: string, next: string) {
    const st = state();
    if (st.s.role !== 'custom' || !st.s.custom) throw new ApiError(400, "This account's password is managed by your administrator");
    const acct = st.accounts[st.s.custom.email];
    if (!acct || (await hashPw(current)) !== acct.pw) throw new ApiError(400, 'Your current password is not correct');
    if (next.length < 8) throw new ApiError(400, 'Use at least 8 characters for the new password');
    acct.pw = await hashPw(next);
    save();
    return { ok: true };
  },

  switchTo(role: string) {
    const st = state();
    if (!(role in seed.PERSONAS) && !(role === 'custom' && st.s.custom)) throw new ApiError(400, 'Unknown account');
    st.s.role = role;
    save();
    return meOf(st.s);
  },

  home() {
    const { s } = state();
    const recent = [...s.questions].reverse().map((q) => ({ id: q.id, user: q.user, question: q.question, mins: q.mins, rating: q.rating })).concat(seed.RECENT_QUESTIONS);
    const docs = allDocs(s);
    return {
      doc_count: docs.length,
      ready_count: docs.filter((d) => d.status === 'Ready').length,
      questions_this_week: seed.USAGE.slice(-7).reduce((n, u) => n + u[0], 0) + s.questions.length,
      recent: recent.slice(0, 6),
      suggestions: seed.SUGGESTIONS,
    };
  },

  docs: () => allDocs(state().s),

  doc(id: string) {
    const found = findAnyDoc(id, state().s);
    if (!found) throw new ApiError(404, 'Document not found');
    return { ...summary(found[0], found[1]), body: found[0].body };
  },

  upload(nameRaw: string, size_kb: number, category = 'Uploaded') {
    const st = state();
    const s = st.s;
    const name = nameRaw.trim() || 'Untitled document';
    const title = name.replace(/\.[A-Za-z0-9]{1,5}$/, '').replace(/[_-]/g, ' ').trim() || 'Untitled document';
    s.upload_n += 1;
    const owner = currentUser(s).name;
    const doc: Doc = {
      id: `u${s.upload_n}`,
      title: title === title.toLowerCase() ? title.replace(/\b\w/g, (c) => c.toUpperCase()) : title,
      kind: name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Guide',
      category: CATEGORIES.includes(category) ? category : 'Uploaded',
      pages: Math.max(1, Math.floor(size_kb / 90)), size_kb: Math.max(size_kb, 1), owner, updated: 0,
      body: [`Added by ${owner} to the workspace library. This file is now part of the searchable documents your team can ask about.`],
    };
    const key = (title.toLowerCase().match(TOKEN_RE) ?? []).join(' ');
    const known = seed.IMPORTABLE[key];
    if (known) { doc.body = known.body; doc.kind = known.kind; doc.pages = known.pages; }
    s.uploads.push({ doc, created: Date.now(), key: known ? key : null });
    save();
    return summary(doc, 'Processing');
  },

  editDoc(id: string, p: { title?: string; category?: string }) {
    const s = state().s;
    if (!findAnyDoc(id, s)) throw new ApiError(404, 'Document not found');
    const over: Partial<Doc> = { ...(s.doc_over[id] ?? {}) };
    if (p.title !== undefined) {
      const t = p.title.split(/\s+/).filter(Boolean).join(' ');
      if (t.length < 2) throw new ApiError(400, 'Give the document a name');
      over.title = t.slice(0, 120);
    }
    if (p.category !== undefined) {
      if (!CATEGORIES.includes(p.category)) throw new ApiError(400, 'Unknown category');
      over.category = p.category;
    }
    over.updated = 0;
    s.doc_over[id] = over;
    save();
    const [d, status] = findAnyDoc(id, s) as [Doc, string];
    return summary(d, status);
  },

  deleteDoc(id: string) {
    const s = state().s;
    if (!findAnyDoc(id, s)) throw new ApiError(404, 'Document not found');
    if (DOC_BY_ID[id]) s.deleted.push(id);
    else s.uploads = s.uploads.filter((u) => u.doc.id !== id);
    delete s.doc_over[id];
    save();
    return { ok: true };
  },

  search(q: string) {
    const s = state().s;
    const needle = q.trim().toLowerCase();
    if (needle.length < 2) return { docs: [], questions: [] };
    const docs = [];
    for (const row of allDocs(s)) {
      const found = findAnyDoc(row.id, s);
      if (!found || row.status !== 'Ready') continue;
      const body = found[0].body;
      const snippet = body.find((p) => p.toLowerCase().includes(needle)) ?? null;
      if (row.title.toLowerCase().includes(needle) || snippet) docs.push({ ...row, snippet: (snippet ?? body[0]).slice(0, 140), quote: snippet });
    }
    const asked = seed.RECENT_QUESTIONS.map((r) => r.question).concat(s.questions.map((x) => x.question));
    const qs: string[] = [];
    for (const text of [...seed.QA.map((x) => x.question), ...asked, ...seed.SUGGESTIONS]) {
      if (text.toLowerCase().includes(needle) && !qs.includes(text)) qs.push(text);
    }
    return { docs: docs.slice(0, 6), questions: qs.slice(0, 4) };
  },

  chat(questionRaw: string) {
    const st = state();
    const s = st.s;
    const question = questionRaw.trim();
    if (!question) throw new ApiError(400, 'Ask a question first');
    const extra: Qa[] = [];
    for (const u of s.uploads) {
      const known = u.key ? seed.IMPORTABLE[u.key] : undefined;
      if (!known || uploadStatus(u) !== 'Ready') continue;
      for (const q of known.qa) extra.push({ ...q, citations: q.citations.map((c) => ({ ...c, doc_obj: u.doc })) });
    }
    const prepared = seed.QA.filter((q) => q.citations.every((c) => !s.deleted.includes(c.doc as string)));
    const nf = { ...seed.NOT_FOUND };
    const candidates: (Qa | typeof nf)[] = [...prepared, ...extra, nf];
    let best = candidates.reduce((a, b) => (score(question, b) > score(question, a) ? b : a));
    const vendorish = [...tokens(question)].some((t) => VENDOR_WORDS.has(t));
    if (extra.length === 0 && vendorish) best = nf;
    const mid = `m${s.questions.length + 1}`;
    let reply;
    if (best === nf || !relevant(question, best)) {
      const related = best === nf && !vendorish
        ? seed.NOT_FOUND.related.filter((i) => !s.deleted.includes(i)).map((i) => summary(dview(DOC_BY_ID[i], s)))
        : relatedDocs(question, s);
      reply = { id: mid, question, answer: seed.NOT_FOUND.answer, citations: [], not_found: true, related };
    } else {
      const q = best as Qa;
      const citations = q.citations.map((c, i) => {
        const d = dview(c.doc_obj ?? DOC_BY_ID[c.doc as string], s);
        return { n: i + 1, doc_id: d.id, doc_title: d.title, quote: c.quote };
      });
      reply = { id: mid, question, answer: q.answer, citations, not_found: false, related: [] };
    }
    s.questions.push({ id: mid, user: currentUser(s).name, question, mins: 0, rating: null });
    save();
    return reply;
  },

  templates: () => seed.TEMPLATES,

  draft(template_id: string, values: Record<string, string>) {
    const s = state().s;
    const t = seed.TEMPLATES.find((x) => x.id === template_id);
    if (!t) throw new ApiError(404, 'Template not found');
    const v: Record<string, string> = {};
    for (const f of t.fields) v[f.key] = (values[f.key] || f.default).trim();
    const sender = currentUser(s).name.split(' ')[0];
    const searchable = [...liveSeedDocs(s), ...s.uploads.filter((u) => uploadStatus(u) === 'Ready').map((u) => dview(u.doc, s))];
    const findDoc = (subject: string, category: string) => {
      const q = minusStop(tokens(subject));
      let best: Doc | null = null;
      let bestScore = 0;
      for (const d of searchable) {
        const hit = overlap(q, minusStop(tokens(d.title)));
        if (hit === 0) continue;
        const sc = hit * 10 + (d.category === category ? 5 : 0);
        if (sc > bestScore) { best = d; bestScore = sc; }
      }
      return best;
    };
    const sentences = (text: string) => text.split(/(?<=[.!?])(?<!\bDr\.)(?<!\bMr\.)(?<!\bMrs\.)(?<!\bMs\.)\s+/).map((x) => x.trim()).filter(Boolean);
    const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
    const sources: { doc_id: string; doc_title: string; quote: string }[] = [];
    let text: string;
    let subject: string;
    let doc: Doc | null;
    if (t.id === 't1') {
      doc = findDoc(v.client, 'Client notes');
      subject = v.client;
      const bullets: string[] = [];
      let nextStep: string | null = null;
      if (doc) {
        doc.body.forEach((para, i) => {
          if (i === 0) return;
          for (const sent of sentences(para)) {
            if (sent.toLowerCase().startsWith('open item:')) nextStep = cap(sent.split(':').slice(1).join(':').trim());
            else bullets.push(sent);
            sources.push({ doc_id: doc!.id, doc_title: doc!.title, quote: sent });
          }
        });
      }
      const lines = [`Hi ${v.contact},`, '', `Thanks again for your time. Here is a quick update on ${v.topic} for ${v.client}.`];
      if (bullets.length) lines.push('', 'What we have noted from our conversations:', ...bullets.map((b) => `- ${b}`));
      if (nextStep) lines.push('', `On our side: ${nextStep}`);
      lines.push('', 'Please let me know if anything above is out of date, and I will update our notes.', '', 'Best regards,', sender, 'Harbor & Pine Consulting');
      text = lines.join('\n');
    } else {
      doc = findDoc(v.meeting, 'Meeting');
      subject = v.meeting;
      const recap: string[] = [];
      const actions: string[] = [];
      if (doc) {
        for (const para of doc.body) {
          if (para.toLowerCase().startsWith('action items:')) {
            actions.push(...para.split(':').slice(1).join(':').split(';').map((x) => x.trim().replace(/\.$/, '')).filter(Boolean));
            sources.push({ doc_id: doc.id, doc_title: doc.title, quote: para });
          } else {
            for (const sent of sentences(para)) {
              if (sent.toLowerCase().startsWith('attendees:')) continue;
              recap.push(sent);
              sources.push({ doc_id: doc.id, doc_title: doc.title, quote: sent });
            }
          }
        }
      }
      const lines = ['Hi team,', '', `Thanks for joining ${v.meeting}. Here is a short recap from the notes.`];
      if (recap.length) lines.push('', ...recap.map((r) => `- ${r}`));
      const owner = v.owner.toLowerCase();
      const mine = actions.filter((a) => owner && a.toLowerCase().includes(owner));
      lines.push('', 'Next steps:', ...actions.map((a) => `- ${a}`));
      if (mine.length === 0) lines.push(`- ${v.owner} owns the first action and will share it by ${v.date}.`);
      lines.push('', 'Please reply here if anything is blocking you.', '', 'Thanks,', sender);
      text = lines.join('\n');
    }
    return { template_id: t.id, text, found: doc !== null, subject, sources };
  },

  feedback(message_id: string, question: string, rating: 'up' | 'down', reason = '') {
    const s = state().s;
    if (rating !== 'up' && rating !== 'down') throw new ApiError(400, 'Bad rating');
    for (const q of s.questions) if (q.id === message_id) q.rating = rating;
    s.wrong = s.wrong.filter((w) => w.message_id !== message_id);
    if (rating === 'down') {
      s.wrong.push({ id: `w-${message_id}`, message_id, user: currentUser(s).name, question, reason: reason.trim() || 'No details given.', mins: 0, status: 'Open' });
    }
    save();
    return { ok: true };
  },

  /* ---------- admin ---------- */

  adminStats() {
    const st = state();
    requireAdmin(st.s);
    return {
      users: seed.USERS.length + Object.keys(st.accounts).length,
      documents: allDocs(st.s).length,
      questions_this_week: seed.USAGE.slice(-7).reduce((n, u) => n + u[0], 0) + st.s.questions.length,
      wrong_answers: wrongRows(st.s).filter((w) => w.status === 'Open').length,
      pending_invites: st.s.invites.length,
    };
  },

  adminUsers() {
    const st = state();
    requireAdmin(st.s);
    return roster(st);
  },

  adminWrong() {
    const st = state();
    requireAdmin(st.s);
    return wrongRows(st.s);
  },

  adminUsage() {
    requireAdmin(state().s);
    return seed.USAGE.map((u, i) => ({ day_offset: 13 - i, questions: u[0], drafts: u[1] }));
  },

  invite(emailRaw: string, role: string) {
    const st = state();
    requireAdmin(st.s);
    const email = emailRaw.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, 'Enter a valid email address');
    if (role !== 'member' && role !== 'admin') throw new ApiError(400, 'Choose a role');
    if (roster(st).some((r) => r.email === email)) throw new ApiError(409, 'That person is already on the team or invited');
    st.s.invite_n += 1;
    const name = email.split('@')[0].split(/[._-]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    const row = { id: `i${st.s.invite_n}`, name, email, role };
    st.s.invites.push(row);
    save();
    return row;
  },

  revokeInvite(id: string) {
    const st = state();
    requireAdmin(st.s);
    const before = st.s.invites.length;
    st.s.invites = st.s.invites.filter((i) => i.id !== id);
    if (st.s.invites.length === before) throw new ApiError(404, 'Invitation not found');
    save();
    return { ok: true };
  },

  setRole(id: string, role: string) {
    const st = state();
    requireAdmin(st.s);
    if (role !== 'member' && role !== 'admin') throw new ApiError(400, 'Choose a role');
    if (id === currentUser(st.s).id) throw new ApiError(400, "You can't change your own role");
    const inv = st.s.invites.find((i) => i.id === id);
    if (inv) inv.role = role;
    else if (roster(st).some((r) => r.id === id)) st.s.roles[id] = role;
    else throw new ApiError(404, 'User not found');
    save();
    return { ok: true };
  },

  setWrongStatus(id: string, status: string) {
    const st = state();
    requireAdmin(st.s);
    if (!['Open', 'Reviewed', 'Resolved'].includes(status)) throw new ApiError(400, 'Unknown status');
    if (!wrongRows(st.s).some((r) => r.id === id)) throw new ApiError(404, 'Answer not found');
    st.s.wrong_status[id] = status;
    save();
    return { ok: true };
  },
};

function roster(st: State) {
  const people = [...seed.USERS, ...Object.values(st.accounts).map((a) => a.user)].map((u) => withOverrides(u, st.s));
  const rows = people.map((u) => ({
    id: u.id, name: u.name, email: u.email, role: u.role, title: u.title, last_active_mins: u.last_active_mins, questions: u.questions, status: 'Active' as 'Active' | 'Pending',
  }));
  return rows.concat(st.s.invites.map((i) => ({ id: i.id, name: i.name, email: i.email, role: i.role, title: 'Invited', last_active_mins: -1, questions: 0, status: 'Pending' as const })));
}

function wrongRows(s: Session) {
  const mine = [...s.wrong].reverse().map((w) => ({ id: w.id, user: w.user, question: w.question, reason: w.reason, mins: w.mins, status: w.status }));
  return [...mine, ...seed.WRONG_ANSWERS.map((w) => ({ ...w }))].map((r) => ({ ...r, status: s.wrong_status[r.id] ?? r.status }));
}
