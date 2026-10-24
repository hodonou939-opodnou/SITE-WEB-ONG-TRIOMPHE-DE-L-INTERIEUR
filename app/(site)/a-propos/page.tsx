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
  title: "Notre histoire",
  description:
    "L'ONG Triomphe de l'Intérieur accompagne les femmes et les jeunes vers le bien-être mental et l'autonomie, et soutient les personnes vulnérables au Bénin. Son histoire, sa fondatrice, ce qu'elle est et ce qu'elle n'est pas.",
  path: "/a-propos",
});

// Positionnement (note de repositionnement) : une structure de proximité, non
// clinique, en complément de l'État et des professionnels de santé.
const weAre = [
  "Une plateforme de prévention ancrée dans les communautés",
  "Un espace d'écoute, d'ateliers et d'accompagnement, sans jugement",
  "Un relais qui oriente vers les professionnels de santé quand c'est nécessaire",
  "Une ONG qui agit sur trois fronts liés : humanitaire, bien-être mental, autonomisation",
];
const weAreNot = [
  "Un hôpital, un cabinet médical ou un service public",
  "Un lieu de diagnostic ou de traitement",
  "Une structure qui promet de « guérir la dépression »",
  "Une réponse toute faite : chaque personne avance à son rythme",
];

export default function AProposPage() {
  const founderPhoto = getNamedImage("presidente");

  return (
    <>
      <Hero
        compact
        eyebrow="Notre histoire"
        title="Née d'un vécu, au service des femmes et des jeunes"
        description="Au Bénin comme ailleurs, on apprend à tenir et à ne pas déranger. Nous faisons l'inverse : depuis plus de six ans, nous écoutons, nous accompagnons et nous donnons des outils aux femmes et aux jeunes qui portent seuls ce qui pèse trop lourd, et nous soutenons concrètement les orphelins, les veuves et les enfants en difficulté."
      />

      {/* Fondatrice : l'histoire d'où tout part */}
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
              <p className="mb-3 text-sm font-semibold text-leaf-600">La fondatrice</p>
              <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">{siteConfig.founder}</h2>
              <p className="mt-1 text-sm font-medium text-ink/60">{siteConfig.founderTitle}</p>
              <p className="mt-6 text-base leading-relaxed text-ink/70 sm:text-lg">
                Pour elle, la santé mentale n&apos;est pas une théorie, c&apos;est un vécu. Après avoir survécu à deux
                tentatives de suicide, elle a fait un choix : plus jamais quelqu&apos;un d&apos;autre ne devrait porter
                seul·e le silence qui avait failli lui coûter la vie.
              </p>
              <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
                De cette décision sont nés un espace d&apos;écoute sans jugement, la Méthode R.A.C.I.N.E.S., issue de
                plus de six ans de terrain, et le CIGIBM, le rendez-vous annuel de la guérison intérieure et du
                bien-être mental. Avec une conviction : personne, quelle que soit sa force apparente, n&apos;est à
                l&apos;abri du déséquilibre émotionnel.
              </p>
            </Reveal>
          </div>
        </Container>
      </div>

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Nos missions"
          title="Trois missions qui se tiennent"
          description="Soutenir concrètement les personnes vulnérables, accompagner les femmes et les jeunes vers la guérison intérieure et le bien-être mental, favoriser leur autonomie."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {missionPillars.map((pillar, i) => (
            <Card key={pillar.title} index={i} title={pillar.title} description={pillar.description} />
          ))}
        </div>
      </Container>

      {/* Positionnement */}
      <div className="bg-leaf-950">
        <Container className="py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">À côté des institutions, jamais à leur place</h2>
            <p className="mt-4 text-base leading-relaxed text-mist-100/75">
              Nous agissons en amont, au plus près des gens, en complément de l&apos;État et des professionnels de santé.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { title: "Ce que nous sommes", items: weAre, mark: "✓", tone: "bg-leaf-300 text-leaf-950" },
              { title: "Ce que nous ne sommes pas", items: weAreNot, mark: "✕", tone: "bg-mist-50/15 text-mist-50" },
            ].map((col, i) => (
              <Reveal key={col.title} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-mist-50/12 bg-mist-50/5 p-6 sm:p-7">
                  <h3 className="font-display text-xl text-mist-50">{col.title}</h3>
                  <ul className="mt-5 space-y-3.5">
                    {col.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-mist-100/85">
                        <span aria-hidden className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${col.tone}`}>
                          {col.mark}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
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
