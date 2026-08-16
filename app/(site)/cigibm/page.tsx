import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Photo from "@/components/Photo";
import PhotoCarousel from "@/components/PhotoCarousel";
import Reveal from "@/components/Reveal";
import { cigibm, pressMentions } from "@/lib/content";
import { getGalleryImages, getNamedImage } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "CIGIBM",
  description:
    "Le Congrès International de Guérison Intérieure et de Bien-être Mental (CIGIBM), organisé par l'ONG Triomphe de l'Intérieur. Trois éditions, plus de 58 000 personnes touchées.",
  path: "/cigibm",
  image: { url: "/images/cigibm-featured.jpg", alt: "Congrès CIGIBM" },
});

export default function CigibmPage() {
  const featured = getNamedImage("cigibm-featured") ?? getGalleryImages("cigibm")[0];
  const poster = getNamedImage("cigibm-poster");
  const nextEditionPhotos = getGalleryImages(`cigibm-${cigibm.nextEdition.id}`);
  const featuredSpeakers = cigibm.nextEdition.speakers.filter((s) => s.featured);
  const otherSpeakers = cigibm.nextEdition.speakers.filter((s) => !s.featured);

  return (
    <>
      <Hero
        compact
        eyebrow={cigibm.edition}
        title={`${cigibm.acronym} — Thème « ${cigibm.theme} »`}
        description={`Une fois par an, le ${cigibm.fullName} rassemble celles et ceux qui ont décidé de ne plus subir leurs blessures, mais de les traverser. Trois éditions, plus de 58 000 personnes touchées, et toujours la même règle : c'est gratuit.`}
        actions={
          <Button href="/cigibm-2026" variant="primary">
            Réserver ma place — édition 2026
          </Button>
        }
      />

      {/* Key facts */}
      <Container className="py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <Reveal className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Dates</p>
            <p className="mt-2 font-display text-xl text-leaf-900">{cigibm.dates}</p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Lieux</p>
            <ul className="mt-2 space-y-1">
              {cigibm.venues.map((v) => (
                <li key={v} className="font-display text-base text-leaf-900">
                  {v}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.16} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Parrain</p>
            <p className="mt-2 font-display text-xl text-leaf-900">{cigibm.sponsor}</p>
          </Reveal>
        </div>
      </Container>

      {/* Objective */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              {featured ? (
                <Photo src={featured} alt="Congrès CIGIBM" ratio="aspect-[4/3]" />
              ) : (
                <ImagePlaceholder label="Photo — Édition 2025" />
              )}
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                Notre objectif
              </p>
              <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
                Sortir de la prison émotionnelle et sentimentale
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
                {cigibm.objective}
              </p>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* Programme */}
      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Programme"
          title="Deux jours pour se reconnecter à soi"
          description="Le congrès alterne grands temps collectifs et formats plus intimes — pour que chacun trouve la porte d'entrée qui lui convient, qu'on ait envie de parler ou seulement d'écouter."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {cigibm.programme.map((item, i) => (
            <Card key={item.title} index={i} title={item.title} description={item.description} />
          ))}
        </div>
      </Container>

      {/* Next edition */}
      <div className="bg-leaf-950">
        <Container className="py-24 sm:py-28">
          <div className={`grid items-start gap-12 ${poster ? "lg:grid-cols-2" : ""}`}>
            {poster && (
              <div className="space-y-6">
                <Reveal>
                  <Photo src={poster} alt="Affiche — 4ème édition du CIGIBM" ratio="aspect-[4/5]" />
                </Reveal>
                {nextEditionPhotos.length > 0 && (
                  <Reveal delay={0.06}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-leaf-300">
                      Aperçu des préparatifs
                    </p>
                    <PhotoCarousel
                      images={nextEditionPhotos}
                      alt="Photo — préparatifs de la 4ème édition du CIGIBM"
                      ratio="aspect-[16/10]"
                      className="rounded-2xl"
                    />
                  </Reveal>
                )}
              </div>
            )}
            <Reveal delay={poster ? 0.1 : 0} className={poster ? "" : "mx-auto max-w-2xl text-center"}>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
                À venir
              </p>
              <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">
                {cigibm.nextEdition.edition} — « {cigibm.nextEdition.theme} »
              </h2>
              <p className="mt-5 text-base text-mist-100/80">
                {cigibm.nextEdition.dates} · {cigibm.nextEdition.venue}
              </p>
              <p className="mt-2 text-sm text-mist-100/60">
                {cigibm.nextEdition.note}
              </p>
              <div className="mt-8">
                <Button href="/cigibm-2026" variant="primary">
                  Réserver ma place gratuite
                </Button>
              </div>
            </Reveal>
          </div>
        </Container>
      </div>

      {/* Speakers */}
      <div className="bg-mist-50">
        <Container className="py-24 sm:py-28">
          <SectionHeading
            eyebrow={cigibm.nextEdition.edition}
            title="Intervenants confirmés"
            description="Des personnalités d'exception réunies autour d'une conviction commune : la guérison intérieure comme levier de transformation individuelle, familiale et sociétale."
          />

          {featuredSpeakers.length > 0 && (
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {featuredSpeakers.map((speaker, i) => (
                <Reveal key={speaker.name} delay={i * 0.1}>
                  <div className="flex h-full flex-col rounded-2xl border border-ink/8 bg-mist-100 p-6 sm:p-8">
                    <h3 className="font-display text-xl text-leaf-900">{speaker.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-leaf-600">{speaker.role}</p>
                    {speaker.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-ink/70">{speaker.bio}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {otherSpeakers.length > 0 && (
            <Reveal delay={0.15} className="mt-8 flex flex-wrap justify-center gap-2.5">
              {otherSpeakers.map((speaker) => (
                <span
                  key={speaker.name}
                  className="rounded-full border border-ink/12 bg-mist-100 px-4 py-2 text-sm text-ink/75"
                >
                  <span className="font-medium text-leaf-900">{speaker.name}</span>
                  {" — "}
                  {speaker.role}
                </span>
              ))}
            </Reveal>
          )}
        </Container>
      </div>

      {/* Past editions — ordre antéchronologique : la plus récente d'abord */}
      <div className="bg-mist-200">
        <Container className="py-24 sm:py-28">
          <SectionHeading eyebrow="Historique" title="Les éditions précédentes" />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[...cigibm.pastEditions].reverse().map((edition, i) => {
              const editionPhotos = getGalleryImages(`cigibm-${edition.id}`);
              return (
                <Reveal key={edition.edition} delay={i * 0.08}>
                  <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-ink/8 bg-mist-50">
                    {editionPhotos.length > 0 ? (
                      <PhotoCarousel
                        images={editionPhotos}
                        alt={`Photo — ${edition.edition} du CIGIBM`}
                        ratio="aspect-[4/3]"
                      />
                    ) : (
                      <ImagePlaceholder label={`Photos — ${edition.edition}`} ratio="aspect-[4/3]" />
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">
                        {edition.year}
                      </p>
                      <h3 className="mt-2 font-display text-lg text-leaf-900">
                        {edition.edition}
                      </h3>
                      <p className="mt-2 text-sm font-medium text-ink/80">
                        Thème : « {edition.theme} »
                      </p>
                      <p className="mt-1 text-xs text-ink/50">{edition.location}</p>
                      <p className="mt-3 text-sm font-medium text-leaf-700">
                        {edition.attendance}
                      </p>
                      <p className="mt-3 flex-1 text-xs leading-relaxed text-ink/60">
                        {edition.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </Container>
      </div>

      {/* Press */}
      {pressMentions.length > 0 && (
        <div className="bg-mist-50">
          <Container className="py-24 sm:py-28">
            <SectionHeading eyebrow="Presse" title="Ils parlent de nous" />
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {pressMentions.map((mention, i) => (
                <Reveal key={mention.url} delay={i * 0.08}>
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col rounded-2xl border border-ink/8 bg-mist-warm p-6 transition-all duration-300 hover:-translate-y-1 hover:border-leaf-200 hover:shadow-lg hover:shadow-ink/8"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">
                        {mention.outlet}
                      </p>
                      <span
                        aria-hidden
                        className="shrink-0 text-leaf-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      >
                        ↗
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-lg leading-snug text-leaf-900">
                      {mention.title}
                    </h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
                      {mention.excerpt}
                    </p>
                    <p className="mt-4 text-xs text-ink/45">{mention.date}</p>
                  </a>
                </Reveal>
              ))}
            </div>
          </Container>
        </div>
      )}
    </>
  );
}
