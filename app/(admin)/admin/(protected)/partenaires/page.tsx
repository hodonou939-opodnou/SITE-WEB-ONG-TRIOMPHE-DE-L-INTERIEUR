import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { listFunders } from "@/lib/admin/funders";
import {
  FUNDER_KINDS,
  FUNDER_KIND_LABELS,
  FUNDER_STATUSES,
  FUNDER_STATUS_LABELS,
  RELEVANCE_LABELS,
  deadlineDays,
  sortByUrgency,
  type FunderKindKey,
  type FunderStatusKey,
} from "@/lib/funders-meta";
import { StatusSelect } from "./StatusSelect";

const TZ = "Africa/Porto-Novo";

function host(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default async function FundersPage({ searchParams }: { searchParams: Promise<{ type?: string; statut?: string; q?: string }> }) {
  await requireAdmin();
  const { type, statut, q } = await searchParams;
  const kind = FUNDER_KINDS.includes(type as FunderKindKey) ? (type as FunderKindKey) : undefined;
  const status = FUNDER_STATUSES.includes(statut as FunderStatusKey) ? (statut as FunderStatusKey) : undefined;
  const query = q?.trim().slice(0, 80) || undefined;

  let funders: Awaited<ReturnType<typeof listFunders>> = [];
  let all: Awaited<ReturnType<typeof listFunders>> = [];
  let failed = false;
  try {
    [funders, all] = await Promise.all([listFunders({ kind, status, q: query }), listFunders()]);
  } catch (err) {
    console.error("listFunders failed", err);
    failed = true;
  }
  const now = new Date();
  funders = sortByUrgency(funders, now);

  const counts = Object.fromEntries(FUNDER_STATUSES.map((s) => [s, all.filter((f) => f.status === s).length])) as Record<FunderStatusKey, number>;
  const kindsPresent = FUNDER_KINDS.filter((k) => all.some((f) => f.kind === k));

  const href = (next: { type?: string; statut?: string }) => {
    const p = new URLSearchParams();
    const t = "type" in next ? next.type : kind;
    const s = "statut" in next ? next.statut : status;
    if (t) p.set("type", t);
    if (s) p.set("statut", s);
    if (query) p.set("q", query);
    const qs = p.toString();
    return qs ? `/admin/partenaires?${qs}` : "/admin/partenaires";
  };
  const chip = (active: boolean) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ${active ? "border-leaf-700 bg-leaf-700 text-mist-50" : "border-ink/12 bg-mist-50 text-ink/70"}`;
  const contactLink = "inline-flex min-h-9 items-center rounded-full border border-ink/12 px-3 text-xs font-semibold text-leaf-800 hover:border-leaf-400";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-leaf-900 sm:text-3xl">Bailleurs et partenaires</h1>
      <p className="mt-1 text-sm text-ink/60">
        Fondations, agences, ambassades et entreprises qui financent la santé mentale, les femmes, les jeunes ou les personnes vulnérables. Chaque coordonnée vient
        de la page officielle indiquée, avec sa date de vérification.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {FUNDER_STATUSES.map((s) => (
          <Link key={s} href={href({ statut: status === s ? undefined : s })} className={`rounded-2xl border p-3 ${status === s ? "border-leaf-600 bg-leaf-50" : "border-ink/8 bg-mist-50"}`}>
            <span className="block font-display text-2xl text-leaf-900">{counts[s] ?? 0}</span>
            <span className="text-xs text-ink/60">{FUNDER_STATUS_LABELS[s]}</span>
          </Link>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <form action="/admin/partenaires" className="flex flex-1 gap-2">
          {kind && <input type="hidden" name="type" value={kind} />}
          {status && <input type="hidden" name="statut" value={status} />}
          <input
            name="q"
            defaultValue={query}
            placeholder="Nom, pays ou cause…"
            className="min-h-12 w-full rounded-full border border-ink/15 bg-mist-50 px-5 text-base outline-none focus:border-leaf-500 sm:text-sm"
          />
          <button type="submit" className="min-h-12 shrink-0 rounded-full border border-leaf-600 px-5 text-sm font-bold text-leaf-700">Chercher</button>
        </form>
        <Link href="/admin/partenaires/new" className="inline-flex min-h-12 items-center justify-center rounded-full bg-leaf-600 px-5 text-sm font-bold text-mist-50">+ Ajouter une fiche</Link>
      </div>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Link href={href({ type: undefined })} className={chip(!kind)}>Tous les types</Link>
        {kindsPresent.map((k) => (
          <Link key={k} href={href({ type: k })} className={chip(kind === k)}>
            {FUNDER_KIND_LABELS[k]}
          </Link>
        ))}
      </div>

      {(kind || status || query) && (
        <p className="mt-3 text-sm text-ink/60">
          {funders.length} résultat{funders.length > 1 ? "s" : ""} ·{" "}
          <Link href="/admin/partenaires" className="text-leaf-700 underline underline-offset-4">Tout afficher</Link>
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {funders.map((f) => (
          <li key={f.id} className="rounded-2xl border border-ink/8 bg-mist-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h2 className="break-words font-semibold text-ink">{f.name}</h2>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink/55">
                  <span className="rounded-full bg-leaf-100 px-2 py-0.5 font-semibold text-leaf-800">{FUNDER_KIND_LABELS[f.kind]}</span>
                  <span>{f.country}</span>
                  {f.scope && <span>· {f.scope}</span>}
                  <span className={f.relevance === 3 ? "font-semibold text-amber-800" : ""}>· {RELEVANCE_LABELS[f.relevance] ?? ""}</span>
                </p>
              </div>
              <StatusSelect id={f.id} status={f.status} />
            </div>

            {(() => {
              const days = deadlineDays(f.deadline, now);
              if (days === null || !f.deadline) return null;
              const date = f.deadline.toLocaleDateString("fr-FR", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" });
              const left = days === 0 ? "aujourd'hui" : days === 1 ? "demain" : `J-${days}`;
              return (
                <p className={`mt-3 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${days <= 30 ? "bg-amber-100 text-amber-900" : "bg-leaf-100 text-leaf-800"}`}>
                  Date limite : {date} · {left}
                </p>
              );
            })()}

            <p className="mt-3 text-sm text-ink/75"><span className="font-medium text-ink">Causes :</span> {f.focus}</p>
            {f.why && <p className="mt-1.5 text-sm text-ink/70"><span className="font-medium text-ink">Pour nous :</span> {f.why}</p>}
            {f.howToApply && <p className="mt-1.5 text-sm text-ink/70"><span className="font-medium text-ink">Approche :</span> {f.howToApply}</p>}

            <div className="mt-3 flex flex-wrap gap-2">
              {f.website && <a href={f.website} target="_blank" rel="noopener noreferrer" className={contactLink}>{host(f.website)}</a>}
              {f.applyUrl && <a href={f.applyUrl} target="_blank" rel="noopener noreferrer" className={contactLink}>Candidater</a>}
              {f.contactEmail && <a href={`mailto:${f.contactEmail}`} className={`${contactLink} break-all`}>{f.contactEmail}</a>}
              {f.contactPhone && <a href={`tel:${f.contactPhone.replace(/[^\d+]/g, "")}`} className={contactLink}>{f.contactPhone}</a>}
              {f.contactFormUrl && <a href={f.contactFormUrl} target="_blank" rel="noopener noreferrer" className={contactLink}>Formulaire de contact</a>}
              {f.linkedinUrl && <a href={f.linkedinUrl} target="_blank" rel="noopener noreferrer" className={contactLink}>LinkedIn</a>}
            </div>

            {f.notes && <p className="mt-3 whitespace-pre-line rounded-xl bg-amber-50 px-3 py-2 text-sm text-ink/75">{f.notes}</p>}

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-ink/8 pt-3 text-xs text-ink/50">
              <span>
                {f.sourceUrl ? (
                  <>
                    Vérifié{f.verifiedAt ? ` le ${f.verifiedAt.toLocaleDateString("fr-FR", { timeZone: TZ })}` : ""} sur{" "}
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{host(f.sourceUrl)}</a>
                  </>
                ) : (
                  "Source non renseignée"
                )}
              </span>
              <Link href={`/admin/partenaires/${f.id}`} className="font-semibold text-leaf-700 underline underline-offset-4">Modifier</Link>
            </div>
          </li>
        ))}
        {failed && <li className="rounded-2xl border border-red-400/30 bg-red-500/10 p-6 text-center text-sm text-red-700">Impossible de charger les fiches pour le moment.</li>}
        {!failed && funders.length === 0 && <li className="rounded-2xl border border-ink/8 bg-mist-50 p-6 text-center text-sm text-ink/50">Aucune fiche ne correspond.</li>}
      </ul>
    </div>
  );
}
