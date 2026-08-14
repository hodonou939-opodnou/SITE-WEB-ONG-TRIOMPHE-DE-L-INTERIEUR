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
            <Button href="/cigibm" variant="primary">
              Découvrir le CIGIBM
            </Button>
            <Button href="/nous-soutenir" variant="ghost" className="!border-mist-50/30 !text-mist-50 hover:!bg-mist-50/10">
              Nous soutenir
            </Button>
          </>
        }
      />

      {/* Mission */}
      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Notre mission"
          title="Parce que personne ne devrait souffrir seul·e"
          description="La guérison intérieure n'est pas un luxe réservé à quelques-uns. C'est un droit, une nécessité, un chemin que nous voulons rendre accessible à chaque femme, chaque jeune, chaque famille béninoise."
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
            <h2 className="font-display text-3xl leading-tight text-azure-900 sm:text-4xl">
              {cigibm.acronym} — {cigibm.edition}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              Le {cigibm.fullName} a réuni 1 100 participants en présentiel
              et 34 200 personnes en ligne les {cigibm.dates}, autour du
              thème « {cigibm.theme} ». Deux jours d&apos;ateliers, de
              conférences et de témoignages pour sortir de la prison
              émotionnelle et sentimentale.
            </p>
            <div className="mt-8">
              <Button href="/cigibm" variant="primary">
                En savoir plus sur le CIGIBM
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Méthode R.A.C.I.N.E.S. preview */}
      <div className="bg-azure-50">
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
                  <p className="mt-1 text-xs font-medium text-azure-900">
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
      <div className="bg-leaf-600">
        <Container className="flex flex-col items-center gap-6 py-20 text-center">
          <h2 className="font-display text-3xl text-mist-50 sm:text-4xl">
            Ensemble, triomphons de l&apos;intérieur
          </h2>
          <p className="max-w-xl text-mist-50/85">
            Un don, une heure de votre temps, un simple message : chaque geste
            compte et nous rapproche d&apos;un Bénin où la santé mentale n&apos;est
            plus taboue.
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
