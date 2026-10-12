export function dateFromOffset(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
export const weekdayName = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { weekday: 'long' });
export const weekdayShort = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { weekday: 'short' });
export const monthDay = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
export const fullDate = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const monthKey = (n: number) => { const d = dateFromOffset(n); return d.getFullYear() * 12 + d.getMonth(); };
export const monthName = (n: number) => dateFromOffset(n).toLocaleDateString('en-US', { month: 'short' });
export const isWeekend = (n: number) => [0, 6].includes(dateFromOffset(n).getDay());
/** Offset of the Monday of the week containing offset n. */
export const weekStart = (n: number) => { const dow = dateFromOffset(n).getDay(); return n - ((dow + 6) % 7); };

export const money = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const moneyRound = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
export const moneyK = (n: number) => (Math.abs(n) >= 1000 ? `$${(n / 1000).toFixed(Math.abs(n) >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`);
export const r2 = (n: number) => Math.round(n * 100) / 100;
export const hrs = (n: number) => `${(Math.round(n * 100) / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })} h`;
export const hm = (n: number) => { const m = Math.round(n * 60); return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`; };

export function ago(offsetDays: number, minutes?: number) {
  if (offsetDays === 0) {
    const m = minutes ?? 120;
    if (m < 2) return 'Just now';
    if (m < 60) return `${m} minutes ago`;
    const h = Math.round(m / 60);
    return `${h} hour${h > 1 ? 's' : ''} ago`;
  }
  if (offsetDays === -1) return 'Yesterday';
  if (offsetDays > -7) return `${-offsetDays} days ago`;
  if (offsetDays > -14) return 'Last week';
  return monthDay(offsetDays);
}
export function dueLabel(n: number) {
  if (n < -1) return `${-n} days overdue`;
  if (n === -1) return 'Due yesterday';
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  if (n < 7) return `Due ${weekdayName(n)}`;
  if (n < 14) return `Due next ${weekdayName(n)}`;
  return `Due ${monthDay(n)}`;
}
export function dueShort(n: number) {
  if (n === -1) return 'Yesterday';
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n > 1 && n < 7) return weekdayName(n);
  return monthDay(n);
}

export function initialsOf(name: string) { return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase(); }
const TONES = ['#7538e2', '#3f3f46', '#6128c0', '#52525b', '#4d2296', '#27272a', '#ea580c', '#71717a'];
export function toneOf(key: string) { let h = 0; for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0; return TONES[h % TONES.length]; }

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'did', 'we', 'i', 'you', 'to', 'of', 'in', 'on', 'at', 'it', 'and', 'or', 'me', 'my', 'what', 'how', 'can', 'does', 'for', 'with', 'this', 'that', 'was', 'were', 'about', 'there', 'any', 'our', 'us', 'please', 'write']);
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
const pad = (n: number) => String(n).padStart(2, '0');
export function toInputDate(offset: number) { const d = dateFromOffset(offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
export function fromInputDate(v: string) {
  const [y, m, d] = v.split('-').map(Number);
  if (!y || !m || !d) return null;
  return Math.round((new Date(y, m - 1, d).getTime() - dateFromOffset(0).getTime()) / 86400000);
}
export function csvDownload(name: string, rows: (string | number)[][]) {
  const body = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([body], { type: 'text/csv' }));
  a.download = name;
  a.click();
}
/** Mid-sentence version of dueShort: "today", "tomorrow", "Friday", "Oct 24". */
export const dueWhen = (n: number) => (n >= -1 && n <= 1 ? dueShort(n).toLowerCase() : dueShort(n));
