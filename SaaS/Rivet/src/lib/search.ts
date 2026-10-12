import { tokens } from './util';

const stem = (w: string) => w.replace(/(ing|ed|es|s)$/, '');
const same = (a: string, b: string) => a === b || (a.length > 3 && b.length > 3 && (stem(a) === stem(b) || b.startsWith(a)));

/** Share of the query's words found in `text`. */
export function coverage(query: string, text: string) {
  const q = tokens(query);
  if (!q.length) return 0;
  const t = tokens(text);
  let hit = 0;
  for (const w of q) if (t.some((x) => same(w, x))) hit++;
  return hit / q.length;
}
