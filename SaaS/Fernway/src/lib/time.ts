export function ago(mins: number): string {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${Math.round(mins)} min ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'} ago`;
  const d = h / 24;
  if (d < 2) return 'yesterday';
  if (d < 14) return `${Math.round(d)} days ago`;
  return `${Math.round(d / 7)} weeks ago`;
}
export const agoTs = (ts: number, now: number) => ago((now - ts) / 60000);
export function clock(ts: number) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
export function dayTime(ts: number) {
  return new Date(ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export function waitLabel(mins: number) {
  if (mins < 1) return '<1 min';
  if (mins < 60) return `${Math.round(mins)} min`;
  return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
}
export function initialsOf(name: string) {
  return name.replace(/^(Dr\.?|Nurse)\s+/i, '').split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
const TONES = ['#966c18', '#a8552d', '#7a5a3a', '#8a6006', '#b3402f', '#6e6254', '#9c7a3c', '#5e4a2e'];
export function toneOf(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}
export function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
