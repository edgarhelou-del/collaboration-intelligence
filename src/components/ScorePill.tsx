import { classifyScore } from "@/lib/scoring";

const COLORS: Record<string, string> = {
  Exceptional: "text-signal-exceptional border-signal-exceptional",
  Strong: "text-signal-strong border-signal-strong",
  Interesting: "text-signal-interesting border-signal-interesting",
  Archive: "text-signal-archive border-signal-archive",
};

export default function ScorePill({ score }: { score: number }) {
  const classification = classifyScore(score);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-xs font-medium ${COLORS[classification]}`}
      title={classification}
    >
      {score}
      <span className="text-[10px] opacity-70">/100</span>
    </span>
  );
}
