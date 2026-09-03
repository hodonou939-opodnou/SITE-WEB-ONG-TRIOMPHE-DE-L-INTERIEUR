"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { AmbassadorWithStats } from "@/lib/admin/ambassadors";
import CopyReferralLink from "./CopyReferralLink";

const SITE_URL = "https://ongtriomphedelinterieur.com";

function initials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Avatar({ ambassador }: { ambassador: AmbassadorWithStats }) {
  if (ambassador.photoUrl) {
    return (
      <Image
        src={ambassador.photoUrl}
        alt={ambassador.fullName}
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-xs font-semibold text-leaf-700">
      {initials(ambassador.fullName)}
    </span>
  );
}

function StatusPill({ active }: { active: boolean }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        active ? "bg-leaf-50 text-leaf-700" : "bg-ink/8 text-ink/50"
      }`}
    >
      {active ? "Actif" : "Inactif"}
    </span>
  );
}

function attendanceRate(a: AmbassadorWithStats) {
  return a.referredCount > 0 ? Math.round((a.attendedCount / a.referredCount) * 100) : null;
}

function matchesQuery(a: AmbassadorWithStats, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    a.fullName.toLowerCase().includes(q) ||
    a.phone.toLowerCase().includes(q) ||
    (a.email?.toLowerCase().includes(q) ?? false) ||
    a.slug.toLowerCase().includes(q)
  );
}

export default function AmbassadorsTable({ ambassadors }: { ambassadors: AmbassadorWithStats[] }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => ambassadors.filter((a) => matchesQuery(a, query)), [ambassadors, query]);

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
          placeholder="Rechercher par nom, téléphone ou email…"
          aria-label="Rechercher un ambassadeur"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-leaf-500"
        />
      </div>
      <p className="mt-2 text-xs text-ink/45">
        {filtered.length} ambassadeur{filtered.length !== 1 ? "s" : ""}
        {query && ` sur ${ambassadors.length}`}
      </p>

      {/* Cartes : mobile/tablette. Table : desktop (md: et plus). Les deux
          rendent le même tableau filtré, jamais dupliqué en logique. */}
      <div className="mt-4 space-y-3 md:hidden">
        {filtered.map((a) => {
          const rate = attendanceRate(a);
          return (
            <div key={a.id} className="rounded-2xl border border-ink/8 bg-mist-50 p-4">
              <div className="flex items-start gap-3">
                <Avatar ambassador={a} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-medium text-leaf-900">{a.fullName}</p>
                    <StatusPill active={a.active} />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-ink/50">{a.phone}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-mist-100 px-2 py-1 text-xs text-ink/70">
                  ?ref={a.slug}
                </code>
                <CopyReferralLink url={`${SITE_URL}/cigibm-2026?ref=${a.slug}`} />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink/60">
                <span>{a.referredCount} inscrit·e·s</span>
                <span>{a.attendedCount} présent·e·s</span>
                <span>{rate === null ? "—" : `${rate}%`}</span>
                <Link href={`/admin/ambassadors/${a.id}/edit`} className="font-semibold text-leaf-700 underline underline-offset-2">
                  Modifier
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-xl border border-ink/8 bg-mist-50 p-6 text-center text-sm text-ink/50">
            {ambassadors.length === 0 ? "Aucun ambassadeur pour l'instant." : "Aucun résultat pour cette recherche."}
          </p>
        )}
      </div>

      <div className="mt-4 hidden overflow-x-auto rounded-xl border border-ink/8 md:block">
        <table className="w-full text-sm">
          <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Lien de parrainage</th>
              <th className="px-4 py-3">Inscrit·e·s</th>
              <th className="px-4 py-3">Présent·e·s</th>
              <th className="px-4 py-3">Taux</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const rate = attendanceRate(a);
              return (
                <tr key={a.id} className="border-t border-ink/8">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar ambassador={a} />
                      <span className="font-medium text-leaf-900">{a.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-mist-100 px-2 py-1 text-xs text-ink/70">/cigibm-2026?ref={a.slug}</code>
                      <CopyReferralLink url={`${SITE_URL}/cigibm-2026?ref=${a.slug}`} />
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.referredCount}</td>
                  <td className="px-4 py-3">{a.attendedCount}</td>
                  <td className="px-4 py-3">{rate === null ? "—" : `${rate}%`}</td>
                  <td className="px-4 py-3">
                    <StatusPill active={a.active} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/ambassadors/${a.id}/edit`} className="text-leaf-700 underline underline-offset-2">
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-ink/50">
                  {ambassadors.length === 0 ? "Aucun ambassadeur pour l'instant." : "Aucun résultat pour cette recherche."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
