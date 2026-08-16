import type { Metadata } from "next";
import Avatar from "@/components/Avatar";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Photo from "@/components/Photo";
import PhotoCarousel from "@/components/PhotoCarousel";
import Reveal from "@/components/Reveal";
import { cigibm, foundingStory, mentalHealthStats, pressMentions } from "@/lib/content";
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
        eyebrow={`${cigibm.nextEdition.edition} · ${cigibm.nextEdition.dates}`}
        title={`${cigibm.acronym}, Thème « ${cigibm.nextEdition.theme} »`}
        description={`Une fois par an, le ${cigibm.fullName} rassemble celles et ceux qui ont décidé de ne plus subir leurs blessures, mais de les traverser. Trois éditions déjà tenues, plus de 58 000 personnes touchées, et toujours la même règle : c'est gratuit.`}
        actions={
          <Button href="/cigibm-2026" variant="primary">
            Réserver ma place, édition 2026
          </Button>
        }
      />

      {/* Key facts */}
      <Container className="py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          <Reveal className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Dates</p>
            <p className="mt-2 font-display text-xl text-leaf-900">{cigibm.nextEdition.dates}</p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Lieu</p>
            <p className="mt-2 font-display text-base text-leaf-900">{cigibm.nextEdition.venue}</p>
          </Reveal>
          <Reveal delay={0.16} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Participation</p>
            <p className="mt-2 font-display text-xl text-leaf-900">Gratuite, sur inscription</p>
          </Reveal>
        </div>
      </Container>

      {/* Founding story */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <div className="mx-auto max-w-3xl">
            <Reveal>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
                {foundingStory.eyebrow}
              </p>
              <h2 className="font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
                {foundingStory.title}
              </h2>
            </Reveal>
            <div className="mt-8 space-y-5">
              {foundingStory.paragraphs.map((p, i) => (
                <Reveal key={i} delay={0.06 + i * 0.08}>
                  <p className="text-base leading-relaxed text-ink/75 sm:text-lg">{p}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </div>

      {/* Why it matters, mental health data */}
      <div className="bg-leaf-950">
        <Container className="py-20 sm:py-24">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Pourquoi c'est urgent
            </p>
            <h2 className="font-display text-2xl leading-snug text-mist-50 sm:text-3xl">
              Le silence a un coût, humain et économique
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {mentalHealthStats.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-mist-50/10 bg-mist-50/5 p-6 text-center">
                  <span className="font-display text-3xl text-leaf-300">{stat.value}</span>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-mist-100/80">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-xs text-mist-100/45">{stat.source}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* Objective */}
      <div className="bg-mist-warm">
        <Container className="py-24 sm:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              {featured ? (
                <Photo src={featured} alt="Congrès CIGIBM" ratio="aspect-[4/3]" />
              ) : (
                <ImagePlaceholder label="Photo, Édition 2025" />
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
          description="Le congrès alterne grands temps collectifs et formats plus intimes, pour que chacun trouve la porte d'entrée qui lui convient, qu'on ait envie de parler ou seulement d'écouter."
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
                  <Photo src={poster} alt="Affiche, 4ème édition du CIGIBM" ratio="aspect-[4/5]" />
                </Reveal>
                {nextEditionPhotos.length > 0 && (
                  <Reveal delay={0.06}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-leaf-300">
                      Aperçu des préparatifs
                    </p>
                    <PhotoCarousel
                      images={nextEditionPhotos}
                      alt="Photo, préparatifs de la 4ème édition du CIGIBM"
                      ratio="aspect-[4/5]"
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
                {cigibm.nextEdition.edition}, « {cigibm.nextEdition.theme} »
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
                    <div className="flex items-center gap-4">
                      <Avatar slug={speaker.slug} name={speaker.name} size={64} />
                      <div>
                        <h3 className="font-display text-xl text-leaf-900">{speaker.name}</h3>
                        <p className="mt-1 text-sm font-semibold text-leaf-600">{speaker.role}</p>
                      </div>
                    </div>
                    {speaker.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-ink/70">{speaker.bio}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {otherSpeakers.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {otherSpeakers.map((speaker, i) => (
                <Reveal key={speaker.name} delay={0.1 + i * 0.05}>
                  <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-mist-100 p-4">
                    <Avatar slug={speaker.slug} name={speaker.name} size={48} />
                    <div>
                      <p className="font-medium text-leaf-900">{speaker.name}</p>
                      <p className="text-xs text-ink/60">{speaker.role}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          <Reveal delay={0.2} className="mt-14 flex flex-col items-center gap-3 text-center">
            <Button href="/cigibm-2026" variant="primary" className="!px-8 !py-4 !text-base">
              Inscris-toi maintenant →
            </Button>
            <p className="text-sm font-medium text-leaf-700">
              Seulement quelques places restantes
            </p>
          </Reveal>
        </Container>
      </div>

      {/* Past editions, ordre antéchronologique : la plus récente d'abord,
          une section complète par édition plutôt que des cartes serrées */}
      <div>
        <Container className="pt-24 sm:pt-28">
          <SectionHeading eyebrow="Historique" title="Les éditions précédentes" />
        </Container>

        {[...cigibm.pastEditions].reverse().map((edition, i) => {
          const editionPhotos = getGalleryImages(`cigibm-${edition.id}`);
          const editionBg = i % 2 === 0 ? "bg-mist-200" : "bg-mist-warm";
          const imageFirst = i % 2 === 0;

          return (
            <div key={edition.edition} className={editionBg}>
              <Container className="py-16 sm:py-20">
                <div className="grid items-center gap-12 lg:grid-cols-2">
                  <Reveal className={imageFirst ? "lg:order-1" : "lg:order-2"}>
                    {editionPhotos.length > 0 ? (
                      <PhotoCarousel
                        images={editionPhotos}
                        alt={`Photo, ${edition.edition} du CIGIBM`}
                        ratio="aspect-[4/3]"
                        className="rounded-[2rem]"
                      />
                    ) : (
                      <ImagePlaceholder label={`Photos, ${edition.edition}`} ratio="aspect-[4/3]" />
                    )}
                  </Reveal>
                  <Reveal delay={0.08} className={imageFirst ? "lg:order-2" : "lg:order-1"}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">
                      {edition.year} · {edition.location}
                    </p>
                    <h3 className="mt-2 font-display text-3xl leading-tight text-leaf-900 sm:text-4xl">
                      {edition.edition}
                    </h3>
                    <p className="mt-3 text-lg font-medium text-ink/80">
                      Thème : « {edition.theme} »
                    </p>
                    <p className="mt-4 text-base font-semibold text-leaf-700">
                      {edition.attendance}
                    </p>
                    <p className="mt-4 max-w-xl text-base leading-relaxed text-ink/70">
                      {edition.description}
                    </p>
                  </Reveal>
                </div>
              </Container>
            </div>
          );
        })}
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
