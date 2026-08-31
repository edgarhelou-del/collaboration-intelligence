"use client";

import { useState, useTransition } from "react";
import { editContent, updateContentStatus } from "@/app/actions";
import type { ContentItem } from "@prisma/client";

export default function ContentActions({ item }: { item: ContentItem }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    mainIdea: item.mainIdea,
    whyItMatters: item.whyItMatters,
    businessImplication: item.businessImplication,
    linkedinPost: item.linkedinPost,
  });

  function setStatus(status: "APPROVED" | "REJECTED" | "PUBLISHED") {
    startTransition(() => updateContentStatus(item.id, status));
  }

  function save() {
    startTransition(async () => {
      await editContent(item.id, draft);
      setEditing(false);
    });
  }

  if (editing) {
    return (
      <div className="space-y-3">
        <Field label="Main idea" value={draft.mainIdea} onChange={(v) => setDraft({ ...draft, mainIdea: v })} />
        <Field label="Why it matters" value={draft.whyItMatters} onChange={(v) => setDraft({ ...draft, whyItMatters: v })} textarea />
        <Field
          label="Business implication"
          value={draft.businessImplication}
          onChange={(v) => setDraft({ ...draft, businessImplication: v })}
          textarea
        />
        <Field label="LinkedIn post" value={draft.linkedinPost} onChange={(v) => setDraft({ ...draft, linkedinPost: v })} textarea rows={8} />
        <div className="flex gap-3">
          <button className="btn-primary" onClick={save} disabled={isPending}>
            Save
          </button>
          <button className="btn-secondary" onClick={() => setEditing(false)} disabled={isPending}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button className="btn-secondary" onClick={() => setEditing(true)}>
        Edit
      </button>
      <button className="btn-primary" onClick={() => setStatus("APPROVED")} disabled={isPending}>
        Approve
      </button>
      <button className="btn-secondary" onClick={() => setStatus("REJECTED")} disabled={isPending}>
        Reject
      </button>
      <button className="btn-secondary" onClick={() => setStatus("PUBLISHED")} disabled={isPending}>
        Mark as Published
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  textarea,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="label mb-1 block">{label}</span>
      {textarea ? (
        <textarea
          className="w-full rounded border border-line bg-panel p-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="w-full rounded border border-line bg-panel p-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-ink"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
