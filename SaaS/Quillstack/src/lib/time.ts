export function ago(mins: number): string {
  if (mins < 1) return 'just now';
  if (mins < 60) return `${Math.round(mins)} minute${Math.round(mins) === 1 ? '' : 's'} ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)} hour${Math.round(h) === 1 ? '' : 's'} ago`;
  const d = h / 24;
  if (d < 2) return 'yesterday';
  if (d < 14) return `${Math.round(d)} days ago`;
  const w = d / 7;
  if (w < 9) return `${Math.round(w)} weeks ago`;
  return `${Math.round(d / 30)} months ago`;
}
export function absolute(mins: number): string {
  return new Date(Date.now() - mins * 60000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
export const MINUTES_THIS_MONTH = () => {
  const n = new Date();
  return (n.getDate() - 1) * 1440 + n.getHours() * 60 + n.getMinutes();
};
export function initialsOf(name: string) {
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
const TONES = ['#4638dc', '#0d9488', '#d97706', '#be185d', '#2563eb', '#7c3aed', '#059669', '#dc2626'];
export function toneOf(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return TONES[h % TONES.length];
}
