const LABELS: Record<number, string> = {
  1: "Totalmente en desacuerdo",
  2: "En desacuerdo",
  3: "Ni de acuerdo ni en desacuerdo",
  4: "De acuerdo",
  5: "Totalmente de acuerdo",
};

export function LikertScale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number) => void;
}) {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`flex w-full items-center gap-4 rounded-2xl border px-5 py-4 text-left transition ${
            value === n
              ? "border-gold bg-gold-soft text-paper"
              : "border-line bg-panel text-paper/80 hover:border-gold/40"
          }`}
        >
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
              value === n ? "border-gold bg-gold text-night" : "border-line text-paper/40"
            }`}
          >
            {n}
          </span>
          <span className="text-sm sm:text-base">{LABELS[n]}</span>
        </button>
      ))}
    </div>
  );
}
