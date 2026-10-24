import { db } from "@/lib/db";
import { FUNDER_KINDS, FUNDER_STATUSES, deadlineDays, sortByUrgency, type FunderKindKey, type FunderStatusKey } from "@/lib/funders-meta";

export type FunderInput = {
  name: string;
  kind: FunderKindKey;
  country: string;
  scope: string | null;
  focus: string;
  relevance: number;
  why: string | null;
  howToApply: string | null;
  website: string | null;
  applyUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactFormUrl: string | null;
  linkedinUrl: string | null;
  sourceUrl: string | null;
  deadline: Date | null;
  notes: string | null;
};

type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

const text = (form: FormData, key: string, max = 2000) => {
  const v = String(form.get(key) ?? "").trim().slice(0, max);
  return v || null;
};

function url(form: FormData, key: string, label: string): Checked<string | null> {
  const v = text(form, key, 500);
  if (!v) return { ok: true, value: null };
  if (!/^https:\/\//i.test(v)) return { ok: false, error: `${label} doit commencer par https://` };
  return { ok: true, value: v };
}

export function validateFunderForm(form: FormData): Checked<FunderInput> {
  const name = text(form, "name", 160);
  if (!name || name.length < 2) return { ok: false, error: "Le nom est obligatoire." };
  const kind = String(form.get("kind") ?? "") as FunderKindKey;
  if (!FUNDER_KINDS.includes(kind)) return { ok: false, error: "Choisissez un type." };
  const country = text(form, "country", 80);
  if (!country) return { ok: false, error: "Le pays est obligatoire." };
  const focus = text(form, "focus", 300);
  if (!focus) return { ok: false, error: "Indiquez les causes soutenues." };
  const relevance = Number(form.get("relevance") ?? 2);
  if (![1, 2, 3].includes(relevance)) return { ok: false, error: "Pertinence invalide." };
  const email = text(form, "contactEmail", 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Email invalide." };
  const urls: Record<string, string | null> = {};
  for (const [key, label] of [
    ["website", "Le site"],
    ["applyUrl", "Le lien de candidature"],
    ["contactFormUrl", "Le formulaire de contact"],
    ["linkedinUrl", "Le lien LinkedIn"],
    ["sourceUrl", "La source"],
  ] as const) {
    const checked = url(form, key, label);
    if (!checked.ok) return checked;
    urls[key] = checked.value;
  }
  const deadlineText = text(form, "deadline", 10);
  if (deadlineText && !/^\d{4}-\d{2}-\d{2}$/.test(deadlineText)) return { ok: false, error: "Date limite invalide." };
  // Midi UTC : la date reste la même au Bénin quel que soit le fuseau du navigateur.
  const deadline = deadlineText ? new Date(`${deadlineText}T12:00:00Z`) : null;
  if (deadline && Number.isNaN(deadline.getTime())) return { ok: false, error: "Date limite invalide." };
  return {
    ok: true,
    value: {
      name,
      kind,
      country,
      scope: text(form, "scope", 200),
      focus,
      relevance,
      why: text(form, "why"),
      howToApply: text(form, "howToApply"),
      website: urls.website,
      applyUrl: urls.applyUrl,
      contactEmail: email,
      contactPhone: text(form, "contactPhone", 60),
      contactFormUrl: urls.contactFormUrl,
      linkedinUrl: urls.linkedinUrl,
      sourceUrl: urls.sourceUrl,
      deadline,
      notes: text(form, "notes", 5000),
    },
  };
}

export async function listFunders(filter: { kind?: FunderKindKey; status?: FunderStatusKey; q?: string } = {}) {
  const q = filter.q?.trim();
  return db.funder.findMany({
    where: {
      ...(filter.kind ? { kind: filter.kind } : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(q
        ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { country: { contains: q, mode: "insensitive" } }, { focus: { contains: q, mode: "insensitive" } }] }
        : {}),
    },
    orderBy: [{ relevance: "desc" }, { name: "asc" }],
  });
}

// Pour le tableau de bord : appels dont la date limite tombe dans les `withinDays` prochains jours.
export async function listUpcomingDeadlines(now: Date, withinDays = 30) {
  const funders = await db.funder.findMany({
    where: { deadline: { not: null }, status: { notIn: ["refuse", "finance"] } },
    select: { id: true, name: true, deadline: true },
  });
  return sortByUrgency(funders, now).filter((f) => {
    const days = deadlineDays(f.deadline, now);
    return days !== null && days <= withinDays;
  });
}

export async function countFunders() {
  const [total, followed] = await Promise.all([
    db.funder.count(),
    db.funder.count({ where: { status: { in: ["contacte", "en_discussion"] } } }),
  ]);
  return { total, followed };
}

export async function getFunder(id: string) {
  return db.funder.findUnique({ where: { id } });
}

export async function createFunder(input: FunderInput) {
  return db.funder.create({ data: { ...input, verifiedAt: input.sourceUrl ? new Date() : null } });
}

export async function updateFunder(id: string, input: FunderInput) {
  const before = await db.funder.findUniqueOrThrow({ where: { id }, select: { sourceUrl: true } });
  return db.funder.update({
    where: { id },
    data: { ...input, ...(input.sourceUrl && input.sourceUrl !== before.sourceUrl ? { verifiedAt: new Date() } : {}) },
  });
}

export async function setFunderStatus(id: string, status: FunderStatusKey) {
  if (!FUNDER_STATUSES.includes(status)) return;
  await db.funder.update({ where: { id }, data: { status } });
}

export async function deleteFunder(id: string) {
  await db.funder.deleteMany({ where: { id } });
}
