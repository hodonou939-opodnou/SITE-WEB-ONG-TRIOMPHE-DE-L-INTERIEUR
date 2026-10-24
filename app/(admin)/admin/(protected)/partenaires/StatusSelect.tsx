"use client";

import { useTransition } from "react";
import { FUNDER_STATUSES, FUNDER_STATUS_LABELS, type FunderStatusKey } from "@/lib/funders-meta";
import { deleteFunderAction, setFunderStatusAction } from "./actions";

const TONE: Record<FunderStatusKey, string> = {
  a_contacter: "border-ink/15 bg-mist-50 text-ink/70",
  contacte: "border-amber-400 bg-amber-50 text-amber-900",
  en_discussion: "border-leaf-400 bg-leaf-50 text-leaf-800",
  refuse: "border-ink/10 bg-ink/5 text-ink/45",
  finance: "border-leaf-700 bg-leaf-700 text-mist-50",
};

// Suivi en un geste, directement depuis la liste.
export function StatusSelect({ id, status }: { id: string; status: FunderStatusKey }) {
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Statut du suivi"
      value={status}
      disabled={pending}
      onChange={(e) => start(() => setFunderStatusAction(id, e.target.value as FunderStatusKey))}
      className={`min-h-10 rounded-full border px-3 text-sm font-semibold disabled:opacity-60 ${TONE[status]}`}
    >
      {FUNDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {FUNDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteFunderButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (confirm("Supprimer cette fiche ?")) start(() => deleteFunderAction(id));
      }}
      className="min-h-11 rounded-full border border-red-400/50 px-5 text-sm font-semibold text-red-700 disabled:opacity-60"
    >
      {pending ? "Suppression…" : "Supprimer la fiche"}
    </button>
  );
}
