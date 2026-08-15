import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/Card";
import Button from "@/components/Button";
import StatCounter from "@/components/StatCounter";
import QuoteBlock from "@/components/QuoteBlock";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";
import {
  cigibm,
  impactStats,
  methodeRacines,
  missionPillars,
  presidentQuote,
  siteConfig,
} from "@/lib/content";
import { getGalleryImages } from "@/lib/media";

export default function Home() {
  const cigibmPhotos = getGalleryImages("cigibm");

  return (
    <>
      <Hero
        eyebrow={siteConfig.founder}
        title={siteConfig.tagline}
        description={siteConfig.homeHeroLede}
        actions={
          <>
            <Button href="/cigibm-2026" variant="primary">
              Réserver ma place au CIGIBM 2026
            </Button>
            <Button href="/nous-soutenir" variant="ghost" className="!border-mist-50/30 !text-mist-50 hover:!bg-mist-50/10">
              Nous soutenir
            </Button>
          </>
        }
      />

      {/* Bandeau CIGIBM 2026 — chemin de conversion prioritaire */}
      <div className="border-b border-ink/8 bg-mist-warm">
        <Container className="flex flex-col items-center justify-between gap-4 py-5 sm:flex-row">
          <p className="text-center text-sm leading-relaxed text-ink/75 sm:text-left">
            <span className="font-semibold text-leaf-900">
              {cigibm.nextEdition.edition} du CIGIBM
            </span>{" "}
            — « {cigibm.nextEdition.theme} », {cigibm.nextEdition.dates} à
            Cotonou. Participation gratuite.
          </p>
          <Button href="/cigibm-2026" variant="primary" className="shrink-0 !px-6 !py-3">
            Réserver ma place →
          </Button>
        </Container>
      </div>

      {/* Mission */}
      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Notre mission"
          title="Parce que personne ne devrait souffrir seul·e"
          description="Au Bénin, on apprend très tôt à serrer les dents. À tenir. À ne pas déranger avec ses états d'âme. Nous existons pour dire l'inverse : votre santé mentale n'est pas un caprice, et demander de l'aide n'a jamais été une faiblesse."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {missionPillars.map((pillar, i) => (
            <Card key={pillar.title} index={i} title={pillar.title} description={pillar.description} />
          ))}
        </div>
      </Container>

      {/* Stats */}
      <div className="bg-mist-200">
        <Container className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-3">
          {impactStats.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </Container>
      </div>

      {/* CIGIBM preview */}
      <Container className="py-24 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            {cigibmPhotos[0] ? (
              <Photo src={cigibmPhotos[0]} alt="Congrès CIGIBM" />
            ) : (
              <ImagePlaceholder label="Photo — Congrès CIGIBM" />
            )}
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
              Événement phare
            </p>
            <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
              {cigibm.acronym} — {cigibm.edition}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              Une fois par an, le {cigibm.fullName} réunit celles et ceux qui
              ont décidé de ne plus faire semblant. La dernière édition a
              rassemblé 1 100 personnes sur place et 34 200 en ligne autour du
              thème « {cigibm.theme} » — deux jours d&apos;ateliers, de
              conférences et de témoignages, entièrement gratuits.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/cigibm-2026" variant="primary">
                Réserver ma place 2026
              </Button>
              <Button href="/cigibm" variant="ghost">
                Découvrir le congrès
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Méthode R.A.C.I.N.E.S. preview */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <SectionHeading
            eyebrow="Notre approche"
            title={methodeRacines.fullTitle}
            description={methodeRacines.subtitle}
          />
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {methodeRacines.steps.map((step, i) => (
              <Reveal key={step.letter} delay={i * 0.05}>
                <div className="flex h-full flex-col items-center rounded-2xl border border-ink/8 bg-mist-50 p-4 text-center">
                  <span className="font-display text-2xl text-leaf-500">
                    {step.letter}
                  </span>
                  <p className="mt-1 text-xs font-medium text-leaf-900">
                    {step.title}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-10">
            <Button href="/methode-racines" variant="secondary">
              Comprendre la méthode
            </Button>
          </Reveal>
        </Container>
      </div>

      {/* Quote */}
      <Container className="py-24 sm:py-28">
        <QuoteBlock {...presidentQuote} />
      </Container>

      {/* Final CTA */}
      <div className="bg-leaf-950">
        <Container className="flex flex-col items-center gap-6 py-20 text-center">
          <h2 className="font-display text-3xl text-mist-50 sm:text-4xl">
            Ensemble, triomphons de l&apos;intérieur
          </h2>
          <p className="max-w-xl leading-relaxed text-mist-100/80">
            Un don, un week-end de votre temps, un partage à quelqu&apos;un qui
            en a besoin : c&apos;est ce qui nous permet de continuer à offrir
            cet accompagnement gratuitement.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button href="/nous-soutenir" variant="secondary">
              Nous soutenir
            </Button>
            <Button href="/contact" variant="ghost" className="!border-mist-50/40 !text-mist-50 hover:!bg-mist-50/10">
              Nous contacter
            </Button>
          </div>
        </Container>
      </div>
    </>
  );
}
