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
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "À propos",
  description:
    "Découvrez l'ONG Triomphe de l'Intérieur, sa mission et sa présidente-fondatrice Christelle Eugénie Gnimassou.",
  path: "/a-propos",
});

export default function AProposPage() {
  const founderPhoto = getNamedImage("presidente");

  return (
    <>
      <Hero
        compact
        eyebrow="À propos"
        title="Une ONG née d'une conviction : la guérison intérieure change tout"
        description="Nous agissons au Bénin pour que la santé mentale cesse d'être un sujet qu'on murmure, et devienne un sujet qu'on traite."
      />

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Notre mission"
          title="Pourquoi nous existons"
          description="Pour celles et ceux qui portent un poids que personne ne voit. Nous les accompagnons à reconnaître ce qu'ils vivent, à en comprendre l'origine, et à reprendre la main dessus."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {missionPillars.map((pillar, i) => (
            <Card key={pillar.title} index={i} title={pillar.title} description={pillar.description} />
          ))}
        </div>
      </Container>

      {/* Founder */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              {founderPhoto ? (
                <Photo src={founderPhoto} alt={siteConfig.founder} ratio="aspect-[3/4]" />
              ) : (
                <ImagePlaceholder label="Photo, Christelle Eugénie Gnimassou" ratio="aspect-[3/4]" />
              )}
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                La fondatrice
              </p>
              <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
                {siteConfig.founder}
              </h2>
              <p className="mt-1 text-sm font-medium text-ink/60">
                {siteConfig.founderTitle}
              </p>
              <p className="mt-6 text-base leading-relaxed text-ink/70 sm:text-lg">
                Coach et présidente-fondatrice de l&apos;ONG, Christelle
                Eugénie Gnimassou part d&apos;un constat que peu de gens osent
                formuler : personne, quelle que soit sa force apparente,
                n&apos;est à l&apos;abri du déséquilibre émotionnel. Ni les
                plus croyants, ni les plus solides, ni ceux à qui tout semble
                réussir.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
                De cette conviction sont nés un espace d&apos;écoute sans
                jugement, la Méthode R.A.C.I.N.E.S. issue de plus de six ans
                de terrain, et le CIGIBM, un congrès qui réunit chaque année
                des milliers de personnes autour du même objectif : sortir de
                sa prison émotionnelle et respirer à nouveau.
              </p>
            </Reveal>
          </div>
        </Container>
      </div>

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Nos valeurs"
          title="Ce qui guide chacune de nos actions"
          description="Quatre principes qui ne sont pas décoratifs : ils décident concrètement de la façon dont nous accueillons chaque personne."
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
