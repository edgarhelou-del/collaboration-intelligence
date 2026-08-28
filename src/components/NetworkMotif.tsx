// Decorative wireframe node-graph, echoing the reference brand card and the
// product's own metaphor (intelligence flowing between nodes in a network).
// Purely decorative: aria-hidden, used on marketing/auth surfaces only.

const NODES: [number, number][] = [
  [300, 40],
  [520, 150],
  [560, 400],
  [400, 560],
  [180, 540],
  [40, 340],
  [140, 130],
  [340, 300],
];

const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 6],
  [6, 0],
  [0, 7],
  [1, 7],
  [2, 7],
  [3, 7],
  [4, 7],
  [5, 7],
  [6, 7],
  [1, 3],
  [4, 6],
];

export function NetworkMotif({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 600"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {EDGES.map(([a, b], i) => (
        <line
          key={i}
          x1={NODES[a][0]}
          y1={NODES[a][1]}
          x2={NODES[b][0]}
          y2={NODES[b][1]}
          stroke="#C6A144"
          strokeWidth={1}
          strokeOpacity={0.22}
        />
      ))}
      {NODES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={7} fill="#0A0E1B" stroke="#C6A144" strokeWidth={1.4} strokeOpacity={0.55} />
      ))}
    </svg>
  );
}
