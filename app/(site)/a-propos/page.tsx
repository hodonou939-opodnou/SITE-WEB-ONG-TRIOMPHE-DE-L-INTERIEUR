import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/Card";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";
import { missionPillars, siteConfig, values } from "@/lib/content";
import { getNamedImage } from "@/lib/media";

export const metadata: Metadata = {
  title: "À propos",
  description:
    "Découvrez l'ONG Triomphe de l'Intérieur, sa mission et sa présidente-fondatrice Christelle Eugénie Gnimassou.",
};

export default function AProposPage() {
  const founderPhoto = getNamedImage("presidente");

  return (
    <>
      <Hero
        compact
        eyebrow="À propos"
        title="Une ONG née d'une conviction : la guérison intérieure change tout"
        description="L'ONG Triomphe de l'Intérieur agit au Bénin pour que la santé mentale devienne un sujet accessible, partagé et sans tabou."
      />

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Notre mission"
          title="Pourquoi nous existons"
          description="Nous existons pour celles et ceux qui portent un poids invisible. Nous accompagnons les individus et les communautés dans la reconnaissance, la compréhension et la régulation de leur vécu émotionnel."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {missionPillars.map((pillar, i) => (
            <Card key={pillar.title} index={i} title={pillar.title} description={pillar.description} />
          ))}
        </div>
      </Container>

      {/* Founder */}
      <div className="bg-azure-50">
        <Container className="py-24 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              {founderPhoto ? (
                <Photo src={founderPhoto} alt={siteConfig.founder} ratio="aspect-[3/4]" />
              ) : (
                <ImagePlaceholder label="Photo — Christelle Eugénie Gnimassou" ratio="aspect-[3/4]" />
              )}
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                La fondatrice
              </p>
              <h2 className="font-display text-3xl leading-tight text-azure-900 sm:text-4xl">
                {siteConfig.founder}
              </h2>
              <p className="mt-1 text-sm font-medium text-ink/60">
                {siteConfig.founderTitle}
              </p>
              <p className="mt-6 text-base leading-relaxed text-ink/70 sm:text-lg">
                Coach et présidente-fondatrice de l&apos;ONG Triomphe de
                l&apos;Intérieur, Christelle Eugénie Gnimassou porte une
                conviction qui a déjà changé des milliers de vies : personne,
                peu importe sa force apparente, n&apos;est à l&apos;abri du
                déséquilibre émotionnel. De cette conviction est né un espace
                d&apos;écoute sans jugement — et le Congrès International de
                Guérison Intérieure et de Bien-être Mental (CIGIBM), qui
                réunit aujourd&apos;hui des milliers de participants autour
                d&apos;un même objectif : sortir de sa prison émotionnelle
                pour respirer à nouveau.
              </p>
            </Reveal>
          </div>
        </Container>
      </div>

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Nos valeurs"
          title="Ce qui guide chacune de nos actions"
          align="center"
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, i) => (
            <Card key={value.title} index={i} title={value.title} description={value.description} />
          ))}
        </div>
      </Container>
    </>
  );
}
