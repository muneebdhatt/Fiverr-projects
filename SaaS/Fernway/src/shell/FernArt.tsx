/** Decorative fern frond, drawn from simple leaflets along a curved stem. */
export function Frond({ className, color = '#d6b25a', opacity = 1, leaflets = 14 }: { className?: string; color?: string; opacity?: number; leaflets?: number }) {
  const items = Array.from({ length: leaflets }, (_, i) => {
    const t = i / (leaflets - 1);
    const y = 300 - t * 270;
    const x = 100 + Math.sin(t * 2.2) * 26;
    const len = 62 * (1 - t * 0.78) + 8;
    return { x, y, len, t };
  });
  return (
    <svg viewBox="0 0 220 320" className={className} aria-hidden fill="none" style={{ opacity }}>
      <g style={{ stroke: color }} strokeLinecap="round">
        <path d={`M100 310 C 100 250, 130 150, ${items[items.length - 1].x} 22`} strokeWidth="3" />
        {items.map((p, i) => (
          <g key={i} strokeWidth="9">
            <path d={`M${p.x} ${p.y} q ${-p.len * 0.55} ${-p.len * 0.28} ${-p.len} ${p.len * 0.12}`} />
            <path d={`M${p.x} ${p.y} q ${p.len * 0.55} ${-p.len * 0.28} ${p.len} ${p.len * 0.12}`} />
          </g>
        ))}
      </g>
    </svg>
  );
}
