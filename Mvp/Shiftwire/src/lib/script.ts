/** The scripted reply sequence for a broadcast. `idx` is the position in the matched-worker list (0 to 11). */
export const STOP_IDX = 4;
const YES_ORDER = [
  { idx: 1, t: 5400 },
  { idx: 9, t: 6200 },
  { idx: 6, t: 7000 },
];

export interface FeedEvent {
  t: number;
  idx: number;
  dir: 'in' | 'out' | 'sys';
  text: string;
  kind: 'no' | 'yes' | 'stop' | 'filled' | 'unsub' | 'confirm' | 'late' | 'reminder';
}

export const clampPositions = (n: number) => Math.min(3, Math.max(1, n || 1));
export const winnerIdx = (positions: number) => YES_ORDER.slice(0, clampPositions(positions)).map((y) => y.idx);
export const fillAtFor = (positions: number) => YES_ORDER[clampPositions(positions) - 1].t;
export const doneAtFor = (positions: number) => fillAtFor(positions) + 3200;
export const spotsFilledAt = (positions: number, elapsed: number) => YES_ORDER.slice(0, clampPositions(positions)).filter((y) => elapsed >= y.t).length;

export function buildFeed(positions: number): FeedEvent[] {
  const p = clampPositions(positions);
  const winners = new Set(winnerIdx(p));
  const lateYes = YES_ORDER.filter((y) => !winners.has(y.idx));
  const fillAt = fillAtFor(p);
  const events: FeedEvent[] = [
    { t: 1600, idx: 3, dir: 'in', text: 'NO', kind: 'no' },
    { t: 3200, idx: 7, dir: 'in', text: 'No, cannot do tonight sorry', kind: 'no' },
    { t: 4000, idx: STOP_IDX, dir: 'in', text: 'STOP', kind: 'stop' },
    { t: 4500, idx: STOP_IDX, dir: 'out', text: 'You have been unsubscribed from Shiftwire texts. Reply START to rejoin.', kind: 'unsub' },
  ];
  YES_ORDER.forEach((y) => {
    events.push({ t: y.t, idx: y.idx, dir: 'in', text: 'YES', kind: 'yes' });
    if (winners.has(y.idx)) {
      events.push({ t: y.t + 350, idx: y.idx, dir: 'out', text: 'Confirmed. You are booked for this shift. Details are on their way.', kind: 'confirm' });
      events.push({ t: y.t + 700, idx: y.idx, dir: 'sys', text: 'Reminder scheduled: texted 2 hours before the shift starts.', kind: 'reminder' });
    } else {
      events.push({ t: y.t + 350, idx: y.idx, dir: 'out', text: 'Sorry, that shift was just filled. We will text you the next one.', kind: 'late' });
    }
  });
  const skip = new Set<number>([STOP_IDX, ...winners, ...lateYes.map((y) => y.idx)]);
  let k = 0;
  for (let idx = 0; idx < 12; idx++) {
    if (skip.has(idx)) continue;
    events.push({ t: fillAt + 600 + k * 190, idx, dir: 'sys', text: 'Shift filled', kind: 'filled' });
    k++;
  }
  return events.sort((a, b) => a.t - b.t);
}

export type WorkerState = 'Delivered' | 'Declined' | 'Opted out' | 'Filled the shift' | 'Too late' | 'Told shift filled';

export function stateAt(idx: number, elapsed: number, positions: number): WorkerState {
  const p = clampPositions(positions);
  const yes = YES_ORDER.find((y) => y.idx === idx);
  if (yes && elapsed >= yes.t) return winnerIdx(p).includes(idx) ? 'Filled the shift' : 'Too late';
  if (idx === STOP_IDX && elapsed >= 4000) return 'Opted out';
  if (idx === 3 && elapsed >= 1600) return 'Declined';
  if (idx === 7 && elapsed >= 3200) return 'Declined';
  const f = buildFeed(p).find((e) => e.kind === 'filled' && e.idx === idx);
  if (f && elapsed >= f.t) return 'Told shift filled';
  return 'Delivered';
}
