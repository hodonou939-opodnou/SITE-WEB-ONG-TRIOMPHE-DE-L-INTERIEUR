import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import QuoteBlock from "@/components/QuoteBlock";
import StatCounter from "@/components/StatCounter";
import RegistrationForm from "@/components/RegistrationForm";
import RegistrationPopup from "@/components/RegistrationPopup";
import { cigibm, impactStats, presidentQuote } from "@/lib/content";
import { getNamedImage } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `CIGIBM 2026 — ${cigibm.nextEdition.theme}`,
  description: `Réservez votre place gratuite au CIGIBM 2026, les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Participation gratuite, sur inscription.`,
  path: "/cigibm-2026",
  image: { url: "/images/cigibm-poster.jpg", alt: `Affiche CIGIBM 2026 — ${cigibm.nextEdition.theme}` },
});

const painPoints = [
  "Vous tenez debout pour tout le monde. Personne ne demande qui vous tient, vous.",
  "Vous répondez « ça va » depuis si longtemps que vous ne savez plus ce que ça voulait dire.",
  "Vous avez lu, prié, encaissé, recommencé — et la même douleur revient toujours au même endroit.",
  "Vous voudriez en parler. Mais à qui, sans craindre le regard, le jugement, ou la pitié ?",
];

const approach = [
  {
    title: "On nomme ce qui fait mal",
    description:
      "Pas de discours abstrait sur le bonheur. On met des mots précis sur des blessures précises — parce qu'on ne guérit pas ce qu'on n'arrive pas à nommer.",
  },
  {
    title: "On comprend d'où ça vient",
    description:
      "La Méthode R.A.C.I.N.E.S., construite sur plus de six ans de terrain, remonte au mécanisme plutôt qu'au symptôme. Vous repartez en comprenant votre propre fonctionnement.",
  },
  {
    title: "On repart avec des outils, pas des intentions",
    description:
      "Des pratiques concrètes de régulation émotionnelle, applicables dès le lundi matin — chez vous, au travail, dans vos relations.",
  },
  {
    title: "On ne vous laisse pas repartir seul·e",
    description:
      "Vous rejoignez plusieurs milliers de personnes qui avancent dans la même direction. C'est ce lien, plus que le week-end lui-même, qui tient dans la durée.",
  },
];

const valueStack = [
  "Deux jours complets de conférences et d'ateliers au Palais des Congrès de Cotonou",
  "Des ateliers pratiques en petit format, pour travailler sur votre situation réelle",
  "L'accès direct à des professionnels de la santé mentale et de l'accompagnement",
  "Des témoignages de personnes qui ont traversé ce que vous traversez",
  "Des temps de méditation et de recueillement, respectueux de vos convictions",
  "Une communauté qui continue après le congrès",
];

const faqs = [
  {
    q: "La participation est-elle vraiment gratuite ?",
    a: "Oui, entièrement. Aucun frais d'inscription, aucun paiement sur place. L'ONG prend en charge l'organisation pour que le coût ne soit jamais la raison qui vous empêche de venir. L'inscription sert uniquement à réserver votre place et préparer l'accueil.",
  },
  {
    q: "Dois-je avoir un diagnostic, ou une raison « assez grave » pour venir ?",
    a: "Non. Le CIGIBM s'adresse à toute personne qui veut mieux comprendre son équilibre émotionnel : que vous traversiez une épreuve, que vous accompagniez un proche, ou que vous vouliez simplement prendre soin de votre santé mentale avant que ça n'aille mal.",
  },
  {
    q: "Est-ce que je vais devoir parler devant tout le monde ?",
    a: "Jamais sans le vouloir. Vous pouvez traverser les deux jours en observateur·rice silencieux·se. Les temps de partage sont proposés, jamais imposés — l'écoute sans jugement vaut aussi pour votre droit au silence.",
  },
  {
    q: "Et si je ne peux venir qu'une seule journée ?",
    a: "Venez quand même. Chaque journée a sa cohérence propre. Précisez-le simplement lors de votre inscription pour que nous puissions vous orienter vers le programme le plus utile.",
  },
  {
    q: "Est-ce un événement religieux ?",
    a: "Non. Des temps de méditation et de prière sont proposés dans le respect des sensibilités de chacun, et restent facultatifs. Le congrès accueille toutes les convictions.",
  },
  {
    q: "Comment je m'inscris concrètement ?",
    a: "Remplissez le formulaire sur cette page — il prend moins d'une minute. Si vous préférez parler à quelqu'un, appelez l'un des deux numéros indiqués : une inscription par téléphone suffit à réserver votre place.",
  },
];

export default function Cigibm2026Page() {
  const poster = getNamedImage("cigibm-poster");
  const featuredSpeaker = cigibm.nextEdition.speakers.find((s) => s.featured);
  const otherSpeakers = cigibm.nextEdition.speakers.filter((s) => !s.featured);
  const phones = cigibm.nextEdition.registrationPhones;
  const primaryPhoneHref = `tel:${phones[0].replace(/\s+/g, "")}`;

  return (
    <>
      <RegistrationPopup />

      {/* Hero */}
      <section className="relative overflow-hidden bg-leaf-950">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-leaf-500/20 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-azure-400/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <Reveal scale>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-leaf-300">
              {cigibm.nextEdition.edition} · {cigibm.nextEdition.dates}
            </p>
            <h1 className="font-display text-4xl leading-[1.1] text-mist-50 sm:text-5xl md:text-6xl">
              {cigibm.nextEdition.theme}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-mist-100/85">
              Deux jours pour déposer ce que vous portez seul·e depuis trop
              longtemps — et repartir avec de quoi tenir debout autrement.
            </p>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-mist-100/60">
              {cigibm.nextEdition.venue} · Participation gratuite, sur
              inscription.
            </p>

            <div className="mt-9 max-w-md rounded-2xl border-l-2 border-leaf-400 bg-mist-50/5 py-4 pl-5 pr-4">
              <p className="font-display text-lg leading-snug text-mist-50">
                Vous méritez ces deux jours. Ne les laissez pas filer.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#inscription"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-azure-500 px-8 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
              >
                Je réserve ma place gratuite →
              </a>
              <a
                href={primaryPhoneHref}
                className="text-sm font-semibold text-leaf-300 underline underline-offset-4 transition-colors hover:text-leaf-200"
              >
                Ou appelez le {phones[0]}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.1} scale>
            {poster ? (
              <Photo src={poster} alt="Affiche — CIGIBM 2026" ratio="aspect-[4/5]" />
            ) : (
              <ImagePlaceholder label="Affiche — CIGIBM 2026" ratio="aspect-[4/5]" />
            )}
          </Reveal>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-mist-warm py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl leading-snug text-leaf-900 sm:text-4xl">
              Est-ce que ça vous parle ?
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {painPoints.map((point, i) => (
              <Reveal key={point} delay={i * 0.06}>
                <div className="rounded-2xl border border-ink/8 bg-mist-50 px-6 py-5">
                  <p className="text-base leading-relaxed text-ink/80">{point}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.25} className="mt-10 text-center">
            <p className="mx-auto max-w-xl font-display text-xl leading-snug text-leaf-900">
              Si vous avez reconnu ne serait-ce qu&apos;une seule de ces
              phrases, le CIGIBM 2026 a été construit pour vous.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Approach */}
      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
              Notre approche
            </p>
            <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
              Pourquoi ces deux jours changent quelque chose
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70">
              Trois éditions, des milliers de participants, et une conviction
              qui n&apos;a pas bougé : on ne guérit pas en écoutant de belles
              phrases, mais en comprenant ce qui se joue en soi.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {approach.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-ink/8 bg-mist-50 p-7 transition-all duration-300 hover:-translate-y-1 hover:border-leaf-200 hover:shadow-lg hover:shadow-ink/8">
                  <span className="font-display text-2xl text-leaf-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-xl leading-snug text-leaf-900">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-ink/70">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="bg-mist-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-6 py-16 sm:grid-cols-3 sm:px-8">
          {impactStats.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </div>
      </div>

      {/* Value stack + registration */}
      <section id="inscription" className="scroll-mt-4 bg-leaf-950 py-20 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 sm:px-8 lg:grid-cols-[1fr_0.85fr] lg:items-start">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Ce que comprend votre place
            </p>
            <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">
              Tout cela, sans avoir à payer quoi que ce soit
            </h2>
            <ul className="mt-8 space-y-4">
              {valueStack.map((item, i) => (
                <Reveal key={item} delay={i * 0.05}>
                  <li className="flex items-start gap-3.5">
                    <span
                      aria-hidden
                      className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-500/20 text-xs font-bold text-leaf-300"
                    >
                      ✓
                    </span>
                    <span className="text-base leading-relaxed text-mist-100/85">
                      {item}
                    </span>
                  </li>
                </Reveal>
              ))}
            </ul>
            <Reveal delay={0.3}>
              <p className="mt-8 border-l-2 border-leaf-400 py-2 pl-5 text-base leading-relaxed text-mist-100/70">
                La seule chose que nous vous demandons, c&apos;est de réserver
                votre place — pour que nous sachions vous accueillir
                correctement.
              </p>
            </Reveal>
          </Reveal>

          <Reveal delay={0.12} scale>
            <RegistrationForm />
          </Reveal>
        </div>
      </section>

      {/* Speakers */}
      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl px-6 sm:px-8">
          <Reveal className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
              Qui vous accueille
            </p>
            <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
              Celles et ceux qui prendront la parole
            </h2>
          </Reveal>

          {featuredSpeaker && (
            <Reveal delay={0.1} className="mt-10">
              <div className="rounded-3xl border border-ink/8 bg-mist-50 p-7 sm:p-9">
                <h3 className="font-display text-2xl text-leaf-900">
                  {featuredSpeaker.name}
                </h3>
                <p className="mt-1 text-sm font-semibold text-leaf-600">
                  {featuredSpeaker.role}
                </p>
                {featuredSpeaker.bio && (
                  <p className="mt-4 text-sm leading-relaxed text-ink/70">
                    {featuredSpeaker.bio}
                  </p>
                )}
              </div>
            </Reveal>
          )}

          {otherSpeakers.length > 0 && (
            <Reveal delay={0.18} className="mt-6 flex flex-wrap justify-center gap-2.5">
              {otherSpeakers.map((speaker) => (
                <span
                  key={speaker.name}
                  className="rounded-full border border-ink/12 bg-mist-50 px-4 py-2 text-sm text-ink/75"
                >
                  <span className="font-medium text-leaf-900">{speaker.name}</span>
                  {" — "}
                  {speaker.role}
                </span>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {/* President quote */}
      <div className="bg-mist-warm">
        <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
          <QuoteBlock {...presidentQuote} />
        </div>
      </div>

      {/* FAQ */}
      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 sm:px-8">
          <Reveal>
            <h2 className="text-center font-display text-3xl text-leaf-900 sm:text-4xl">
              Ce que vous vous demandez peut-être
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.05}>
                <details className="group rounded-2xl border border-ink/8 bg-mist-50 p-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-leaf-900">
                    {item.q}
                    <span className="shrink-0 text-xl leading-none text-leaf-600 transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-leaf-950 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-2xl px-6 sm:px-8">
          <Reveal>
            <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">
              Vous avez déjà attendu assez longtemps
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-mist-100/75">
              {cigibm.nextEdition.dates} · {cigibm.nextEdition.venue}. Deux
              jours, gratuits, pour ne plus porter ça tout seul·e.
            </p>
            <div className="mt-9 flex flex-col items-center gap-4">
              <a
                href="#inscription"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-azure-500 px-8 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
              >
                Je réserve ma place gratuite →
              </a>
              <a
                href={primaryPhoneHref}
                className="text-sm font-semibold text-leaf-300 underline underline-offset-4 transition-colors hover:text-leaf-200"
              >
                Ou appelez le {phones[0]}
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-mist-50/95 p-3 backdrop-blur lg:hidden">
        <a
          href="#inscription"
          className="flex items-center justify-center gap-2 rounded-full bg-azure-500 px-6 py-3.5 text-sm font-semibold tracking-wide text-mist-50 shadow-sm"
        >
          Je réserve ma place gratuite →
        </a>
      </div>
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}
