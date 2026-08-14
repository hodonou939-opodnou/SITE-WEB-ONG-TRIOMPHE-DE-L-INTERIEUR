import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";
import { methodeRacines, siteConfig } from "@/lib/content";

export const metadata: Metadata = {
  title: "Méthode R.A.C.I.N.E.S.",
  description:
    "Découvrez la Méthode R.A.C.I.N.E.S., le cadre méthodologique de l'ONG Triomphe de l'Intérieur pour la guérison intérieure et le renforcement de la résilience.",
};

export default function MethodeRacinesPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="Notre approche"
        title={methodeRacines.fullTitle}
        description={methodeRacines.subtitle}
      />

      {/* Intro / origin */}
      <Container className="py-24 sm:py-28">
        <div className="mx-auto max-w-3xl space-y-6">
          <Reveal>
            <p className="text-base leading-relaxed text-ink/80 sm:text-lg">
              {methodeRacines.intro}
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <p className="text-base leading-relaxed text-ink/70">
              {methodeRacines.origin}
            </p>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-base leading-relaxed text-ink/70">
              {methodeRacines.observation}
            </p>
          </Reveal>
        </div>
      </Container>

      {/* The 7 steps */}
      <div className="bg-azure-50">
        <Container className="py-24 sm:py-28">
          <SectionHeading
            eyebrow={methodeRacines.acronym}
            title="Sept étapes vers la transformation"
            description="Chaque lettre de R.A.C.I.N.E.S. correspond à une étape du parcours d'accompagnement."
          />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {methodeRacines.steps.map((step, i) => (
              <Reveal key={step.letter} delay={i * 0.06}>
                <div className="flex h-full flex-col rounded-2xl border border-ink/8 bg-mist-50 p-6">
                  <span className="font-display text-3xl text-leaf-500">
                    {step.letter}
                  </span>
                  <h3 className="mt-3 font-display text-lg text-azure-900">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">
                    {step.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* Vision */}
      <Container className="py-24 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <SectionHeading eyebrow="Notre vision" title="Pourquoi cette méthode" align="left" />
          <Reveal delay={0.08} className="mt-8 space-y-5">
            <p className="text-base leading-relaxed text-ink/80 sm:text-lg">
              {methodeRacines.vision.intro}
            </p>
            {methodeRacines.vision.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-base leading-relaxed text-ink/70">
                {p}
              </p>
            ))}
            <p className="font-display text-xl leading-snug text-azure-900">
              {methodeRacines.vision.closing}
            </p>
          </Reveal>
          <Reveal delay={0.16} className="mt-8 border-t border-ink/8 pt-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-leaf-600">
              {siteConfig.founder}
            </p>
            <p className="text-sm text-ink/60">{siteConfig.founderTitle}</p>
          </Reveal>
        </div>
      </Container>

      {/* Principles */}
      <div className="bg-mist-200">
        <Container className="py-24 sm:py-28">
          <SectionHeading eyebrow="Nos principes" title="Ce qui guide chaque accompagnement" />
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {methodeRacines.principles.map((principle, i) => (
              <Reveal key={principle.slice(0, 24)} delay={i * 0.05}>
                <div className="flex items-start gap-3 rounded-xl bg-mist-50 p-4">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-xs font-semibold text-leaf-700">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-ink/75">{principle}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* Domains */}
      <Container className="py-24 sm:py-28">
        <SectionHeading eyebrow="Champs d'application" title="Où la méthode s'applique" />
        <Reveal delay={0.1} className="mt-8 flex flex-wrap gap-3">
          {methodeRacines.domains.map((domain) => (
            <span
              key={domain}
              className="rounded-full border border-ink/12 bg-mist-50 px-4 py-2 text-sm text-ink/75"
            >
              {domain}
            </span>
          ))}
        </Reveal>
      </Container>

      {/* Evolution + CTA */}
      <div className="bg-azure-900">
        <Container className="py-24 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Une méthode en évolution continue
            </p>
            <p className="text-base leading-relaxed text-mist-100/80">
              {methodeRacines.evolution}
            </p>
            <div className="mt-8">
              <Button href="/contact" variant="primary">
                Échanger avec l&apos;équipe
              </Button>
            </div>
          </Reveal>
        </Container>
      </div>
    </>
  );
}
