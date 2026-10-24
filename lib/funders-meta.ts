import { daysUntil } from "@/lib/cigibm-hub";

export const FUNDER_KINDS = [
  "fondation",
  "agence_publique",
  "organisation_internationale",
  "ambassade",
  "entreprise",
  "ong_internationale",
  "reseau",
  "philanthrope",
] as const;
export type FunderKindKey = (typeof FUNDER_KINDS)[number];

export const FUNDER_KIND_LABELS: Record<FunderKindKey, string> = {
  fondation: "Fondation",
  agence_publique: "Agence publique",
  organisation_internationale: "Organisation internationale",
  ambassade: "Ambassade",
  entreprise: "Entreprise",
  ong_internationale: "ONG internationale",
  reseau: "Réseau",
  philanthrope: "Philanthrope",
};

export const FUNDER_STATUSES = ["a_contacter", "contacte", "en_discussion", "refuse", "finance"] as const;
export type FunderStatusKey = (typeof FUNDER_STATUSES)[number];

export const FUNDER_STATUS_LABELS: Record<FunderStatusKey, string> = {
  a_contacter: "À contacter",
  contacte: "Contacté",
  en_discussion: "En discussion",
  refuse: "Refusé",
  finance: "Financé",
};

export const RELEVANCE_LABELS: Record<number, string> = {
  3: "Très pertinent",
  2: "Pertinent",
  1: "À étudier",
};

// Jours avant la date limite (0 = aujourd'hui), null si aucune échéance à venir.
export function deadlineDays(deadline: Date | null, now: Date): number | null {
  if (!deadline) return null;
  const days = daysUntil(deadline, now);
  return days >= 0 ? days : null;
}

// Échéances à venir d'abord (la plus proche en tête), puis l'ordre reçu (pertinence, nom).
export function sortByUrgency<T extends { deadline: Date | null }>(items: T[], now: Date): T[] {
  return items
    .map((item, index) => ({ item, index, days: deadlineDays(item.deadline, now) ?? Infinity }))
    .sort((a, b) => a.days - b.days || a.index - b.index)
    .map((x) => x.item);
}
