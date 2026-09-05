"use client";

import { useTransition } from "react";
import { updateBioFindingStatus } from "@/app/actions";
import type { BioStatus } from "@prisma/client";

const STATUSES: BioStatus[] = ["NEW", "REVIEWING", "RELEVANT", "ARCHIVED"];

export default function BioFindingStatusControl({ id, status }: { id: string; status: BioStatus }) {
  const [isPending, startTransition] = useTransition();

  function set(next: BioStatus) {
    startTransition(() => updateBioFindingStatus(id, next));
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="label mb-1 block">Status</span>
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => set(e.target.value as BioStatus)}
          className="h-[38px] w-full rounded border border-line bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={isPending} onClick={() => set("RELEVANT")}>
          Mark Relevant
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => set("REVIEWING")}>
          Review
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => set("ARCHIVED")}>
          Archive
        </button>
      </div>
    </div>
  );
}
