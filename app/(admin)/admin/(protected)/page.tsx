import Link from "next/link";
import { db } from "@/lib/db";
import { countLeadsToContact } from "@/lib/admin/leads";
import { countFunders, listUpcomingDeadlines } from "@/lib/admin/funders";
import { deadlineDays } from "@/lib/funders-meta";
import { getEditionHub, getScannerSummary, listEditions, pickDefaultEdition } from "@/lib/admin/cigibm";
import { cigibmHref, editionPhase, hasPreparation, type Insight } from "@/lib/cigibm-hub";
import PhasePill from "./evenements/PhasePill";

const TZ = "Africa/Porto-Novo";
const ordinal = (n: number) => (n === 1 ? "1ère" : `${n}ème`);

function TodoItem({ item }: { item: Insight }) {
  const dot = { alert: "bg-amber-500", info: "bg-ink/30", good: "bg-leaf-500" }[item.level];
  const body = (
    <>
      <span aria-hidden className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-leaf-900">{item.title}</span>
        <span className="mt-0.5 block text-sm text-ink/60">{item.detail}</span>
      </span>
      {item.href && <span aria-hidden className="shrink-0 self-center text-xl text-ink/30">›</span>}
    </>
  );
  return (
    <li>
      {item.href ? (
        <Link href={item.href} className="flex items-start gap-3 px-4 py-3.5 active:bg-leaf-50 sm:hover:bg-leaf-50/60">{body}</Link>
      ) : (
        <div className="flex items-start gap-3 px-4 py-3.5">{body}</div>
      )}
    </li>
  );
}

export default async function AdminDashboardPage() {
  const now = new Date();
  const editions = await listEditions();
  const currentNumber = pickDefaultEdition(editions, now);
  const [hub, scanner, leads, activitiesTotal, activitiesPublished, resources, team, funders, deadlines] = await Promise.all([
    currentNumber ? getEditionHub(currentNumber, now) : null,
    currentNumber ? getScannerSummary(currentNumber, now) : null,
    countLeadsToContact(),
    db.activity.count(),
    db.activity.count({ where: { published: true } }),
    db.resource.count(),
    db.adminProfile.count({ where: { suspendedAt: null } }),
    countFunders(),
    listUpcomingDeadlines(now),
  ]);

  // Édition terminée depuis moins de 30 jours (autre que celle mise en avant) : ses
  // actions de bilan (relance des absents…) restent à traiter.
  const recent = editions
    .filter((e) => e.number !== currentNumber && e.eventDate)
    .map((e) => ({ e, phase: editionPhase(e.eventDate, now) }))
    .find(({ phase }) => phase.kind === "past" && phase.days <= 30);
  const recentHub = recent ? await getEditionHub(recent.e.number, now) : null;

  // À traiter : les alertes de l'événement mis en avant (contacts à rappeler compris),
  // celles du bilan de l'édition récente, puis ce qui reste à publier sur le site.
  const todo: Insight[] = (hub?.insights ?? []).filter((i) => i.level !== "good");
  for (const i of recentHub?.insights ?? []) {
    if (i.level === "good" || todo.some((t) => t.title === i.title)) continue;
    todo.push({ ...i, title: `Édition ${recentHub!.edition.number} : ${i.title.charAt(0).toLowerCase()}${i.title.slice(1)}` });
  }
  if (deadlines.length > 0) {
    const next = deadlines[0];
    const days = deadlineDays(next.deadline, now)!;
    const date = next.deadline!.toLocaleDateString("fr-FR", { timeZone: TZ, day: "numeric", month: "long" });
    const n = deadlines.length;
    todo.unshift({
      level: "alert",
      title: n > 1 ? `${n} appels à projets à boucler` : "Un appel à projets à boucler",
      detail: `${next.name} : date limite le ${date} (${days === 0 ? "aujourd'hui" : `J-${days}`}).`,
      href: "/admin/partenaires",
    });
  }
  if (activitiesTotal > 0 && activitiesPublished === 0) {
    todo.push({ level: "info", title: `${activitiesTotal} activités en brouillon`, detail: "Aucune n'est encore publiée sur le site : relisez-les et publiez celles qui sont validées.", href: "/admin/activities" });
  }
  const eventToday = hub?.phase.kind === "today";
  const held = editions.filter((e) => editionPhase(e.eventDate, now).kind === "past").length;
  const preparing = editions.filter((e) => hasPreparation(editionPhase(e.eventDate, now))).map((e) => e.number);
  const eventsNote = `CIGIBM : ${held} édition${held > 1 ? "s" : ""} tenue${held > 1 ? "s" : ""}${preparing.length ? `, la ${ordinal(Math.max(...preparing))} en préparation` : ""}`;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-leaf-900 sm:text-3xl">Tableau de bord</h1>
      <p className="mt-1 text-sm text-ink/55 first-letter:uppercase">{now.toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>

      {/* ---------- Événement à la une ---------- */}
      {hub && (
        <section className="mt-6 rounded-3xl bg-leaf-900 p-5 text-mist-50 sm:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <p className="text-sm font-medium text-leaf-200">CIGIBM, {ordinal(hub.edition.number)} édition</p>
            <PhasePill phase={hub.phase} dark />
          </div>
          <p className="mt-3 font-display text-2xl leading-tight sm:text-3xl">{hub.edition.theme}</p>
          <p className="mt-1.5 text-sm text-mist-50/70">{hub.edition.dates}, {hub.edition.venue}</p>

          <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-mist-50/10 pt-4">
            <div>
              <dt className="text-xs text-mist-50/60">{eventToday ? "Entrées du jour" : "Inscrits"}</dt>
              <dd className="font-display text-2xl">{eventToday ? scanner?.today ?? 0 : hub.stats.participants}</dd>
            </div>
            <div>
              <dt className="text-xs text-mist-50/60">Présents</dt>
              <dd className="font-display text-2xl">{hub.stats.attended}</dd>
            </div>
            {hasPreparation(hub.phase) ? (
              <div>
                <dt className="text-xs text-mist-50/60">Préparation</dt>
                <dd className={`font-display ${hub.tasks.length ? "text-2xl" : "whitespace-nowrap pt-1.5 text-lg"}`}>{hub.tasks.length ? `${Math.round((hub.tasksDone / hub.tasks.length) * 100)} %` : "À lancer"}</dd>
              </div>
            ) : (
              <div>
                <dt className="text-xs text-mist-50/60">Présence</dt>
                <dd className="font-display text-2xl">{hub.stats.attendanceRate} %</dd>
              </div>
            )}
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {eventToday && (
              <Link href="/admin/scan" className="inline-flex min-h-12 items-center rounded-full bg-amber-400 px-5 text-sm font-bold text-leaf-950">Ouvrir le scanner</Link>
            )}
            <Link href={cigibmHref(hub.edition.number)} className="inline-flex min-h-12 items-center rounded-full bg-mist-50 px-5 text-sm font-bold text-leaf-900">Ouvrir l&apos;espace CIGIBM</Link>
          </div>
        </section>
      )}

      {/* ---------- À traiter ---------- */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-leaf-900">À traiter</h2>
        {todo.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-leaf-200 bg-leaf-50 px-4 py-3.5 text-sm text-leaf-900">Rien d&apos;urgent pour le moment.</p>
        ) : (
          <ul className="mt-3 divide-y divide-ink/6 overflow-hidden rounded-2xl border border-ink/8 bg-mist-50">
            {todo.slice(0, 6).map((t) => <TodoItem key={t.title} item={t} />)}
          </ul>
        )}
      </section>

      {/* ---------- Rubriques ---------- */}
      <section className="mt-8">
        <h2 className="font-display text-xl text-leaf-900">Rubriques</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {[
            { href: "/admin/evenements", label: "Événements", note: eventsNote },
            { href: "/admin/activities", label: "Activités", note: `${activitiesPublished} publiées sur ${activitiesTotal}` },
            { href: "/admin/leads", label: "Contacts à rappeler", note: leads.total === 0 ? "Personne en attente" : `${leads.total} en attente` },
            { href: "/admin/partenaires", label: "Bailleurs et partenaires", note: `${funders.total} fiche${funders.total > 1 ? "s" : ""}${funders.followed ? `, ${funders.followed} en suivi` : ""}` },
            { href: "/admin/resources", label: "Dossier ressources", note: `${resources} document${resources > 1 ? "s" : ""}` },
            { href: "/admin/team", label: "Équipe", note: `${team} compte${team > 1 ? "s" : ""} actif${team > 1 ? "s" : ""}` },
          ].map((r) => (
            <Link key={r.href} href={r.href} className="rounded-2xl border border-ink/8 bg-mist-50 p-4 active:bg-leaf-50 sm:hover:border-leaf-300">
              <span className="block font-semibold text-leaf-900">{r.label}</span>
              <span className="mt-0.5 block text-xs text-ink/55">{r.note}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
