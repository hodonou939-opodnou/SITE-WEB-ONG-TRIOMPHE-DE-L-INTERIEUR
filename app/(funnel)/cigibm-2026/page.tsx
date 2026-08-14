import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import Photo from "@/components/Photo";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import QuoteBlock from "@/components/QuoteBlock";
import StatCounter from "@/components/StatCounter";
import { cigibm, impactStats, presidentQuote, siteConfig } from "@/lib/content";
import { getNamedImage } from "@/lib/media";

export const metadata: Metadata = {
  title: `CIGIBM 2026 — ${cigibm.nextEdition.theme}`,
  description: `Réservez votre place gratuite au CIGIBM 2026, les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}.`,
};

const painPoints = [
  "Vous souriez à l'extérieur, mais à l'intérieur, vous vous sentez vide.",
  "Vous portez seul·e le poids d'une blessure que personne ne voit.",
  "Vous avez l'impression d'avoir tout essayé, sans jamais vraiment aller mieux.",
  "Vous voulez avancer, mais vous ne savez plus par où commencer.",
];

const experience = [
  {
    title: "Vous êtes écouté·e, sans jugement",
    description: "Un espace sûr où déposer ce que vous portez depuis trop longtemps.",
  },
  {
    title: "Vous repartez avec des outils concrets",
    description: "Des clés issues d'ateliers pratiques, applicables dès le lendemain.",
  },
  {
    title: "Vous rencontrez des intervenants d'exception",
    description: "Des experts et des figures inspirantes qui ont fait de leur épreuve une force.",
  },
  {
    title: "Vous n'êtes plus seul·e",
    description: "Une communauté de plusieurs milliers de personnes qui avancent avec vous.",
  },
];

const faqs = [
  {
    q: "La participation est-elle vraiment gratuite ?",
    a: "Oui. La participation au CIGIBM 2026 est entièrement gratuite, sur inscription préalable au téléphone.",
  },
  {
    q: "Dois-je avoir un diagnostic ou une raison particulière pour venir ?",
    a: "Non. Le CIGIBM s'adresse à toute personne qui souhaite mieux comprendre son équilibre émotionnel — que vous traversiez une épreuve, accompagniez un proche, ou soyez simplement curieux·se.",
  },
  {
    q: "Comment je m'inscris concrètement ?",
    a: "Appelez l'un des deux numéros d'inscription affichés sur cette page. Une inscription par téléphone suffit à réserver votre place.",
  },
  {
    q: "J'ai une autre question, qui puis-je contacter ?",
    a: "Écrivez-nous à tout moment via notre page de contact — nous vous répondons rapidement.",
  },
];

export default function Cigibm2026Page() {
  const poster = getNamedImage("cigibm-poster");
  const featuredSpeaker = cigibm.nextEdition.speakers.find((s) => s.featured);
  const phones = cigibm.nextEdition.registrationPhones;
  const primaryPhoneHref = `tel:${phones[0].replace(/\s+/g, "")}`;

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-azure-900">
        <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-leaf-500/30 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-azure-400/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-leaf-300">
              {cigibm.nextEdition.dates} · {cigibm.nextEdition.venue}
            </p>
            <h1 className="font-display text-4xl leading-tight text-mist-50 sm:text-5xl md:text-6xl">
              {cigibm.nextEdition.theme}
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mist-100/80 sm:text-lg">
              Deux jours pour déposer ce que vous portez seul·e depuis trop
              longtemps, et repartir avec les outils pour avancer. Réservez
              dès maintenant votre place — {cigibm.nextEdition.note.toLowerCase()}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={primaryPhoneHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-leaf-600 px-7 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-sm shadow-leaf-900/20 transition-colors hover:bg-leaf-700"
              >
                Réserver ma place gratuite
              </a>
              <a
                href={siteConfig.social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-mist-50/30 px-7 py-4 text-base font-medium tracking-wide text-mist-50 transition-colors hover:bg-mist-50/10"
              >
                Suivre l&apos;actualité
              </a>
            </div>
            <p className="mt-4 text-xs text-mist-100/50">
              Inscription au {phones.join(" · ")}
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            {poster ? (
              <Photo src={poster} alt="Affiche — CIGIBM 2026" ratio="aspect-[4/5]" />
            ) : (
              <ImagePlaceholder label="Affiche — CIGIBM 2026" ratio="aspect-[4/5]" />
            )}
          </Reveal>
        </div>
      </section>

      {/* Pain points */}
      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl px-6 sm:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl leading-snug text-azure-900 sm:text-3xl">
              Vous reconnaissez-vous ?
            </h2>
          </Reveal>
          <div className="mt-10 space-y-4">
            {painPoints.map((point, i) => (
              <Reveal key={point} delay={i * 0.08}>
                <div className="flex items-start gap-3 rounded-xl bg-mist-50 p-4 shadow-sm shadow-ink/5">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-azure-100 text-xs font-semibold text-azure-700">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink/80 sm:text-base">{point}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.3} className="mt-8 text-center">
            <p className="text-base font-medium text-azure-900">
              Le CIGIBM 2026 a été pensé pour vous.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Experience / promise */}
      <section className="bg-azure-50 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
              Ce qui vous attend
            </p>
            <h2 className="font-display text-3xl leading-tight text-azure-900 sm:text-4xl">
              Ce que vous vivrez au CIGIBM 2026
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {experience.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.08}>
                <div className="flex items-start gap-4 rounded-2xl bg-mist-50 p-6">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-500 font-display text-lg text-mist-50">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-lg text-azure-900">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-ink/70">{item.description}</p>
                  </div>
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

      {/* Featured speaker */}
      {featuredSpeaker && (
        <section className="bg-mist-100 py-20 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 sm:px-8">
            <Reveal>
              <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                Intervenante à l&apos;honneur
              </p>
              <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6 text-center sm:p-10">
                <h3 className="font-display text-2xl text-azure-900">{featuredSpeaker.name}</h3>
                <p className="mt-1 text-sm font-medium text-leaf-600">{featuredSpeaker.role}</p>
                {featuredSpeaker.bio && (
                  <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ink/70">
                    {featuredSpeaker.bio}
                  </p>
                )}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* President quote */}
      <div className="mx-auto max-w-6xl px-6 py-20 sm:px-8 sm:py-24">
        <QuoteBlock {...presidentQuote} />
      </div>

      {/* Practical info */}
      <section className="bg-azure-900 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 text-center sm:px-8">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Informations pratiques
            </p>
            <h2 className="font-display text-3xl text-mist-50 sm:text-4xl">
              {cigibm.nextEdition.dates}
            </h2>
            <p className="mt-3 text-base text-mist-100/80">{cigibm.nextEdition.venue}</p>
            <p className="mt-2 text-sm text-mist-100/60">{cigibm.nextEdition.note}</p>
            <div className="mt-8 flex flex-col items-center gap-3">
              {phones.map((phone) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/\s+/g, "")}`}
                  className="text-lg font-semibold text-mist-50 underline underline-offset-4"
                >
                  {phone}
                </a>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist-100 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl px-6 sm:px-8">
          <Reveal>
            <h2 className="text-center font-display text-2xl text-azure-900 sm:text-3xl">
              Questions fréquentes
            </h2>
          </Reveal>
          <div className="mt-10 space-y-3">
            {faqs.map((item, i) => (
              <Reveal key={item.q} delay={i * 0.06}>
                <details className="group rounded-xl border border-ink/8 bg-mist-50 p-5 open:shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-azure-900 sm:text-base">
                    {item.q}
                    <span className="shrink-0 text-leaf-600 transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-leaf-600 py-20 text-center sm:py-24">
        <div className="mx-auto max-w-xl px-6 sm:px-8">
          <h2 className="font-display text-3xl text-mist-50 sm:text-4xl">
            Votre place vous attend
          </h2>
          <p className="mt-4 text-mist-50/85">
            {cigibm.nextEdition.dates} · {cigibm.nextEdition.venue} ·{" "}
            {cigibm.nextEdition.note}
          </p>
          <a
            href={primaryPhoneHref}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-mist-50 px-8 py-4 text-base font-semibold tracking-wide text-leaf-700 shadow-sm transition-colors hover:bg-mist-100"
          >
            Réserver ma place gratuite
          </a>
        </div>
      </section>

      {/* Sticky mobile CTA */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-mist-50/95 p-3 backdrop-blur lg:hidden">
        <a
          href={primaryPhoneHref}
          className="flex items-center justify-center gap-2 rounded-full bg-leaf-600 px-6 py-3.5 text-sm font-semibold tracking-wide text-mist-50 shadow-sm"
        >
          Réserver ma place gratuite — Appeler
        </a>
      </div>
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}
