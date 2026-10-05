export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function dateFromOffset(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}
export function dayLabel(n: number) {
  if (n === 0) return 'Today';
  if (n === 1) return 'Tomorrow';
  if (n === -1) return 'Yesterday';
  return dateFromOffset(n).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
export function longDate(n: number) {
  return dateFromOffset(n).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}
export function hourLabel(h: number) {
  const hh = Math.floor(h);
  const m = Math.round((h - hh) * 60);
  return `${((hh + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
}
export const money = (n: number) => '$' + n.toLocaleString('en-US');
export const timeRange = (s: number, e: number) => `${hourLabel(s)} to ${hourLabel(e)}`;
export function absoluteAgo(mins: number) {
  return new Date(Date.now() - mins * 60000).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
