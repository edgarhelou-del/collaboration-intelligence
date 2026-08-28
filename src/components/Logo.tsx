const NODES: [number, number][] = [
  [16, 3],
  [27, 9],
  [27, 21],
  [16, 27],
  [5, 21],
  [5, 9],
  [16, 16],
];
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
  [0, 6],
  [2, 6],
  [4, 6],
];

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a][0]}
          y1={NODES[a][1]}
          x2={NODES[b][0]}
          y2={NODES[b][1]}
          stroke="#C6A144"
          strokeWidth={0.6}
          strokeOpacity={0.8}
        />
      ))}
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 6 ? 1.6 : 1.4} fill="#0A0E1B" stroke="#C6A144" strokeWidth={0.9} />
      ))}
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <LogoMark />
      <span className="text-sm font-semibold uppercase tracking-[0.25em] text-gold">Nodo</span>
    </div>
  );
}
