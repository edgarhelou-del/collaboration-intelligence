"use client";

import { useTransition } from "react";
import { updateSignalStatus } from "@/app/actions";
import { signalStatusLabel } from "@/lib/labels";
import type { SignalStatus } from "@prisma/client";

const STATUSES: SignalStatus[] = ["NEW", "INVESTIGATING", "RELEVANT", "CONTACTED", "ARCHIVED"];

export default function SignalStatusControl({ id, status }: { id: string; status: SignalStatus }) {
  const [isPending, startTransition] = useTransition();

  function set(next: SignalStatus) {
    startTransition(() => updateSignalStatus(id, next));
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="label mb-1 block">Estado</span>
        <select
          value={status}
          disabled={isPending}
          onChange={(e) => set(e.target.value as SignalStatus)}
          className="h-[38px] w-full rounded border border-line bg-panel px-2 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {signalStatusLabel(s)}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap gap-2">
        <button className="btn-secondary" disabled={isPending} onClick={() => set("RELEVANT")}>
          Guardar
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => set("INVESTIGATING")}>
          Investigar
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => set("CONTACTED")}>
          Marcar Contactado
        </button>
        <button className="btn-secondary" disabled={isPending} onClick={() => set("ARCHIVED")}>
          Archivar
        </button>
      </div>
    </div>
  );
}
