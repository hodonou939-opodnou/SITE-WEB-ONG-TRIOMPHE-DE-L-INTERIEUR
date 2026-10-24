import type { Metadata } from "next";
import Link from "next/link";
import HomeHero from "@/components/HomeHero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import StatCounter from "@/components/StatCounter";
import QuoteBlock from "@/components/QuoteBlock";
import MediaCoverageSlider from "@/components/MediaCoverageSlider";
import Photo from "@/components/Photo";
import RacinesWord from "@/components/RacinesWord";
import Reveal from "@/components/Reveal";
import { Cigibm5Strip, OptInButton } from "@/components/Cigibm5Teaser";
import {
  cigibm,
  impactStats,
  mentalHealthStats,
  methodeRacines,
  missionPillars,
  presidentQuote,
  siteConfig,
} from "@/lib/content";
import { getNamedImage } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: siteConfig.tagline,
  description: siteConfig.description,
  path: "/",
});

const missionIcons = [
  // Mains qui portent un cœur : l'humanitaire
  <svg key="h" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-9 w-9">
    <path d="M24 31s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 32 20c0 6-8 11-8 11Z" />
    <path d="M5 33h6l7 5h11l9-5c1.5-.9 3-.2 3.4 1.2-.1.9-.6 1.7-1.4 2.2L30 43H17l-6-3H5" />
  </svg>,
  // Papillon / esprit qui s'ouvre : la guérison intérieure
  <svg key="g" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-9 w-9">
    <path d="M24 14v22" />
    <path d="M24 20c-3-8-11-9-15-6 0 8 5 11 15 6Z" />
    <path d="M24 20c3-8 11-9 15-6 0 8-5 11-15 6Z" />
    <path d="M24 28c-3 6-9 8-12 6 .5-6 5-9 12-6Z" />
    <path d="M24 28c3 6 9 8 12 6-.5-6-5-9-12-6Z" />
  </svg>,
  // Marches qui montent : l'autonomisation
  <svg key="a" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-9 w-9">
    <path d="M6 40h9v-8h9v-8h9v-8h9" />
    <path d="M30 8h12v12" />
    <path d="m42 8-14 14" />
  </svg>,
];

// Fiche « ONG » pour les moteurs de recherche : nom, mission, siège, fondatrice, réseaux.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "NGO",
  name: siteConfig.name,
  url: "https://ongtriomphedelinterieur.com",
  logo: "https://ongtriomphedelinterieur.com/images/logo-mark.png",
  description: siteConfig.description,
  slogan: siteConfig.tagline,
  email: siteConfig.email,
  telephone: siteConfig.phoneHref.replace("tel:", ""),
  address: { "@type": "PostalAddress", addressLocality: "Cotonou", addressCountry: "BJ", streetAddress: "Cadjèhoun-Gare" },
  founder: { "@type": "Person", name: siteConfig.founder },
  areaServed: { "@type": "Country", name: "Bénin" },
  sameAs: Object.values(siteConfig.social),
};

export default function Home() {
  const cigibmPhoto = getNamedImage("cigibm-featured") ?? "/images/cigibm/Cover CIGIBM1 2026.png";
  const urgencyStats = mentalHealthStats.slice(1, 4);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      <HomeHero
        title="Prendre soin de ce qu'on ne voit pas."
        lede={siteConfig.homeHeroLede}
        proof={siteConfig.homeProof}
        photoAlt="Le public du CIGIBM 2024 applaudit : au premier plan, deux femmes souriantes, dont l'une se tourne vers sa voisine"
        photoCaption="CIGIBM 2024 à Godomey. Photo : Erick Savi"
        actions={
          <>
            <Button href="#missions" variant="primary">
              Découvrir nos missions
            </Button>
            <Button href="/nous-soutenir" variant="ghost" className="!border-mist-50/30 !text-mist-50 hover:!bg-mist-50/10">
              Nous soutenir
            </Button>
          </>
        }
      />

      <Cigibm5Strip />

      {/* Missions */}
      <Container className="scroll-mt-24 py-24 sm:py-28">
        <div id="missions" className="scroll-mt-24" />
        <SectionHeading
          eyebrow="Nos missions"
          title="Aider à tenir debout, et soutenir ceux qui en ont le plus besoin"
          description="Trois missions qui se tiennent : agir pour les plus vulnérables, accompagner les femmes et les jeunes vers le bien-être mental, leur donner les outils de l'autonomie."
        />
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {missionPillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 0.08}>
              <article className="group flex h-full flex-col rounded-3xl border border-ink/8 bg-mist-50 p-7 shadow-sm shadow-ink/5 transition-all duration-300 hover:-translate-y-1 hover:border-leaf-200 hover:shadow-xl hover:shadow-ink/10 sm:p-8">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100 text-leaf-700 transition-colors duration-300 group-hover:bg-leaf-600 group-hover:text-mist-50">
                  {missionIcons[i]}
                </span>
                <h3 className="mt-6 font-display text-2xl leading-snug text-leaf-900">{pillar.title}</h3>
                <p className="mt-2 text-base font-semibold text-leaf-700">{pillar.punchline}</p>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{pillar.description}</p>
                <ul className="mt-5 space-y-2.5">
                  {pillar.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/80">
                      <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-500" />
                      {point}
                    </li>
                  ))}
                </ul>
                <Link
                  href={pillar.href}
                  className="mt-auto pt-7 text-sm font-semibold text-leaf-700 underline decoration-leaf-300 underline-offset-4 transition-colors hover:text-leaf-900"
                >
                  {pillar.cta} →
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Pourquoi c'est urgent */}
      <div className="bg-leaf-950">
        <Container className="py-20 sm:py-24">
          <Reveal className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">Pourquoi on fait ça</p>
            <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">
              Parce que les chiffres ne mentent pas, et qu&apos;ils sont durs.
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {urgencyStats.map((stat, i) => (
              <Reveal key={stat.value} delay={i * 0.08}>
                <div className="h-full rounded-2xl border border-mist-50/12 bg-mist-50/5 p-6">
                  <p className="font-display text-4xl text-leaf-300">{stat.value}</p>
                  <p className="mt-3 text-sm leading-relaxed text-mist-100/85">{stat.label}</p>
                  <p className="mt-4 text-xs text-mist-100/45">{stat.source}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2} className="mt-10">
            <p className="max-w-2xl text-base leading-relaxed text-mist-100/75">
              Face à ça, on ne peut pas attendre que les choses s&apos;arrangent toutes seules. Nous agissons en amont,
              avant la crise, au plus près des gens. Nous ne remplaçons ni l&apos;hôpital ni les professionnels de
              santé : nous écoutons, nous accompagnons, et nous orientons vers eux quand c&apos;est nécessaire.
            </p>
          </Reveal>
        </Container>
      </div>

      {/* Chiffres de preuve */}
      <div className="bg-mist-200">
        <Container className="grid grid-cols-1 gap-10 py-16 sm:grid-cols-3">
          {impactStats.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </Container>
      </div>

      {/* Méthode */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <SectionHeading
            eyebrow="Notre façon de faire"
            title={methodeRacines.fullTitle}
            description="Un cadre simple, né de six ans de terrain : comprendre d'où ça vient, puis reconstruire, étape par étape. Sept lettres, sept pas."
          />
          <div className="mt-12">
            <RacinesWord steps={methodeRacines.steps} />
          </div>
          <Reveal delay={0.2} className="mt-10">
            <Button href="/methode-racines" variant="secondary">
              Comprendre la méthode
            </Button>
          </Reveal>
        </Container>
      </div>

      {/* CIGIBM */}
      <Container className="py-24 sm:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <Photo src={cigibmPhoto} alt="Christelle Gnimassou et deux invitées lors du lancement de la 4ème édition du CIGIBM" />
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">Notre événement phare</p>
            <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
              {cigibm.acronym} : le rendez-vous annuel de la guérison intérieure et du bien-être mental
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
              Organisé chaque année par l&apos;ONG, le {cigibm.fullName} réunit sur place et en ligne celles et ceux qui
              ne veulent plus faire semblant, autour d&apos;une idée simple : on a le droit d&apos;aller mal, et le droit
              de s&apos;en sortir. La 4ème édition s&apos;est tenue les 17 et 18 octobre 2026 à Cotonou. La 5ème se
              prépare : date et lieu arrivent bientôt.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button href="/cigibm" variant="primary">
                Découvrir le congrès
              </Button>
              <Button href="/cigibm#retour-4e-edition" variant="ghost">
                Revivre la 4ème édition
              </Button>
            </div>
          </Reveal>
        </div>
      </Container>

      {/* Presse */}
      <div className="bg-mist-200">
        <Container className="py-24 sm:py-28">
          <SectionHeading
            eyebrow="Couverture médiatique"
            title="Ils en parlent"
            description="La presse béninoise relaie notre travail. Un signe que le sujet avance."
          />
          <div className="mt-12">
            <MediaCoverageSlider />
          </div>
        </Container>
      </div>

      {/* Citation */}
      <Container className="py-24 sm:py-28">
        <QuoteBlock {...presidentQuote} />
      </Container>

      {/* Comment nous rejoindre */}
      <div className="bg-leaf-950">
        <Container className="py-20 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl text-mist-50 sm:text-4xl">Ensemble, triomphons de l&apos;intérieur</h2>
            <p className="mt-4 leading-relaxed text-mist-100/80">
              Trois façons simples d&apos;avancer avec nous. Choisissez celle qui vous ressemble.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {[
              {
                title: "J'ai besoin d'en parler",
                text: "Écrivez-nous, sans pression. Un premier échange, c'est déjà un premier pas.",
                action: <Button href="/contact" variant="secondary">Nous écrire</Button>,
              },
              {
                title: "Je veux aider",
                text: "Un don, du temps, un partage : tout ce qui nous permet de rester gratuits pour ceux qui en ont besoin.",
                action: <Button href="/nous-soutenir" variant="secondary">Nous soutenir</Button>,
              },
              {
                title: "Je veux rester informé(e)",
                text: "Nos événements, les nouvelles du CIGIBM et des astuces bien-être, par WhatsApp ou par email.",
                action: (
                  <OptInButton className="inline-flex min-h-12 items-center justify-center rounded-full border border-mist-50/40 px-6 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10">
                    Être prévenu(e)
                  </OptInButton>
                ),
              },
            ].map((card, i) => (
              <Reveal key={card.title} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-mist-50/12 bg-mist-50/5 p-6 text-center">
                  <h3 className="font-display text-xl text-mist-50">{card.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-mist-100/75">{card.text}</p>
                  <div className="mt-6 flex justify-center">{card.action}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>
    </>
  );
}
