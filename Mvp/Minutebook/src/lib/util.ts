export function dateFromOffset(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
export const weekdayName = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { weekday: 'long' });
export const monthDay = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

/** Offset (<= 0) of the k-th working day back; k = 0 is today, or the last working day on a weekend. */
export function workdaysAgo(k: number) {
  let off = 0;
  const isOff = (o: number) => [0, 6].includes(dateFromOffset(o).getDay());
  while (isOff(off)) off--;
  for (let i = 0; i < k; i++) {
    off--;
    while (isOff(off)) off--;
  }
  return off;
}

const DOW = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 } as const;
/** Days until the next given weekday (always at least 1), plus whole weeks. */
export function wd(name: keyof typeof DOW, weeks = 0) {
  const today = dateFromOffset(0).getDay();
  let n = (DOW[name] - today + 7) % 7;
  if (n === 0) n = 7;
  return n + 7 * weeks;
}

export function meetingWhen(day: number, time: string) {
  if (time === 'Just now') return time;
  if (day === 0) return `Today, ${time}`;
  if (day === -1) return `Yesterday, ${time}`;
  if (day > -7) return `${weekdayName(day)}, ${time}`;
  return `${monthDay(day)}, ${time}`;
}
export function meetingDay(day: number) {
  if (day === 0) return 'Today';
  if (day === -1) return 'Yesterday';
  if (day > -7) return weekdayName(day);
  return monthDay(day);
}

export function dueLabel(n: number) {
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return 'Yesterday';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n < 7) return `Due ${weekdayName(n)}`;
  if (n < 14) return `Due next ${weekdayName(n)}`;
  return `Due ${monthDay(n)}`;
}
export function dueShort(n: number) {
  if (n < 0) return n === -1 ? 'Yesterday' : monthDay(n);
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n < 7) return weekdayName(n);
  return monthDay(n);
}

export function clock(sec: number) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
}
export const minsLabel = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim() : `${m} min`);

export function initialsOf(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
const TONES = ['#e24614', '#3f3f46', '#be360e', '#52525b', '#98300e', '#27272a', '#f46434', '#71717a'];
export function toneOf(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'did', 'we', 'i', 'you', 'to', 'of', 'in', 'on', 'at', 'it', 'and', 'or', 'me', 'my', 'what', 'how', 'can', 'does', 'for', 'with', 'this', 'that', 'was', 'were', 'about', 'there', 'any', 'our', 'us', 'meeting']);
export const tokens = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s'$]/g, ' ').split(/\s+/).filter((w) => w && !STOP.has(w));

const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');
const sameWord = (a: string, b: string) => a === b || (a.length > 3 && b.length > 3 && stem(a) === stem(b));

/** How close free text is to a prepared entry (0 to 1). Callers take the best score, so it never fails. */
export function closeness(input: string, ...targets: string[]) {
  const a = tokens(input);
  if (!a.length) return 0;
  let best = 0;
  for (const t of targets) {
    const b = tokens(t);
    if (!b.length) continue;
    let hit = 0;
    for (const w of b) if (a.some((x) => sameWord(x, w))) hit++;
    best = Math.max(best, hit / Math.max(b.length, 2));
  }
  return best;
}

/** Share of the query's words found in `text` (used for searching transcripts). */
export function coverage(query: string, text: string) {
  const q = tokens(query);
  if (!q.length) return 0;
  const t = tokens(text);
  let hit = 0;
  for (const w of q) if (t.some((x) => sameWord(x, w))) hit++;
  return hit / q.length;
}

export const firstSentence = (s: string) => s.split(/(?<=\.)\s/)[0];

const pad = (n: number) => String(n).padStart(2, '0');
export function toInputDate(offset: number) {
  const d = dateFromOffset(offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromInputDate(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Math.round((new Date(y, m - 1, d).getTime() - dateFromOffset(0).getTime()) / 86400000);
}
