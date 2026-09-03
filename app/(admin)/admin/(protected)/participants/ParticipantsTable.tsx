"use client";

import { useMemo, useState } from "react";
import type { ParticipantRow } from "@/lib/admin/participants";

function matchesQuery(p: ParticipantRow, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.fullName.toLowerCase().includes(q) ||
    p.phone.toLowerCase().includes(q) ||
    (p.email?.toLowerCase().includes(q) ?? false) ||
    (p.ambassadorName?.toLowerCase().includes(q) ?? false)
  );
}

function AttendancePill({ attended }: { attended: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        attended ? "bg-leaf-50 text-leaf-700" : "bg-ink/8 text-ink/50"
      }`}
    >
      {attended ? "Présent·e" : "—"}
    </span>
  );
}

export default function ParticipantsTable({ participants }: { participants: ParticipantRow[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => participants.filter((p) => matchesQuery(p, query)), [participants, query]);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40"
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m20 20-3.8-3.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher par nom, téléphone, email ou ambassadeur…"
          aria-label="Rechercher un·e participant·e"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      <p className="mt-2 text-xs text-ink/45">
        {filtered.length} participant{filtered.length !== 1 ? "s" : ""}
        {query && ` sur ${participants.length}`}
      </p>

      {/* Cartes : mobile/tablette. Table : desktop (md: et plus). */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-2xl border border-ink/8 bg-mist-50 p-4">
            <div className="flex items-start justify-between gap-2">
              <p className="truncate font-medium text-leaf-900">{p.fullName}</p>
              <AttendancePill attended={!!p.attendedAt} />
            </div>
            <p className="mt-1 text-xs text-ink/60">{p.phone}</p>
            {p.email && <p className="truncate text-xs text-ink/60">{p.email}</p>}
            {p.ambassadorName && (
              <p className="mt-2 text-xs text-leaf-700">Parrainé·e par {p.ambassadorName}</p>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-ink/8 bg-mist-50 p-6 text-center text-sm text-ink/50">
            {participants.length === 0 ? "Aucun participant pour l'instant." : "Aucun résultat pour cette recherche."}
          </p>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-ink/8 md:block">
        <table className="w-full text-sm">
          <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Ambassadeur</th>
              <th className="px-4 py-3">Présence</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-ink/8">
                <td className="px-4 py-3">{p.fullName}</td>
                <td className="px-4 py-3">{p.phone}</td>
                <td className="px-4 py-3">{p.email ?? "—"}</td>
                <td className="px-4 py-3">{p.ambassadorName ?? "—"}</td>
                <td className="px-4 py-3">
                  <AttendancePill attended={!!p.attendedAt} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                  {participants.length === 0 ? "Aucun participant pour l'instant." : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
