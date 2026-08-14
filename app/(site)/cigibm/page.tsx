import type { Metadata } from "next";
import Image from "next/image";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Card from "@/components/Card";
import Button from "@/components/Button";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import Photo from "@/components/Photo";
import Reveal from "@/components/Reveal";
import { cigibm } from "@/lib/content";
import { getGalleryImages, getNamedImage } from "@/lib/media";

export const metadata: Metadata = {
  title: "CIGIBM",
  description:
    "Le Congrès International de Guérison Intérieure et de Bien-être Mental (CIGIBM), organisé par l'ONG Triomphe de l'Intérieur.",
};

export default function CigibmPage() {
  const photos = getGalleryImages("cigibm");
  const featured = getNamedImage("cigibm-featured") ?? photos[0];
  const rest = getNamedImage("cigibm-featured") ? photos : photos.slice(1);
  const poster = getNamedImage("cigibm-poster");
  const featuredSpeakers = cigibm.nextEdition.speakers.filter((s) => s.featured);
  const otherSpeakers = cigibm.nextEdition.speakers.filter((s) => !s.featured);

  return (
    <>
      <Hero
        compact
        eyebrow={cigibm.edition}
        title={`${cigibm.acronym} — Thème « ${cigibm.theme} »`}
        description={`Deux jours pour déposer ce que vous portez seul·e depuis trop longtemps. Le ${cigibm.fullName} rassemble celles et ceux qui ont décidé de ne plus subir leurs blessures — mais de les traverser.`}
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
            <p className="mt-2 font-display text-xl text-azure-900">{cigibm.dates}</p>
          </Reveal>
          <Reveal delay={0.08} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Lieux</p>
            <ul className="mt-2 space-y-1">
              {cigibm.venues.map((v) => (
                <li key={v} className="font-display text-base text-azure-900">
                  {v}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.16} className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">Parrain</p>
            <p className="mt-2 font-display text-xl text-azure-900">{cigibm.sponsor}</p>
          </Reveal>
        </div>
      </Container>

      {/* Objective */}
      <div className="bg-azure-50">
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
              <h2 className="font-display text-3xl leading-tight text-azure-900 sm:text-4xl">
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
          description="Le CIGIBM alterne temps collectifs et espaces plus intimistes, pour que chacun trouve la forme d'accompagnement qui lui correspond."
        />
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {cigibm.programme.map((item, i) => (
            <Card key={item.title} index={i} title={item.title} description={item.description} />
          ))}
        </div>
      </Container>

      {/* Gallery */}
      {rest.length > 0 && (
        <div className="bg-mist-50">
          <Container className="py-24 sm:py-28">
            <SectionHeading eyebrow="En images" title="Retour sur nos éditions" />
            <div className="mt-10 columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
              {rest.map((src, i) => (
                <Reveal key={src} delay={(i % 6) * 0.05} className="break-inside-avoid">
                  <div className="overflow-hidden rounded-2xl">
                    <Image
                      src={src}
                      alt="Photo — Congrès CIGIBM"
                      width={600}
                      height={800}
                      sizes="(min-width: 640px) 33vw, 50vw"
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </Reveal>
              ))}
            </div>
          </Container>
        </div>
      )}

      {/* Past editions */}
      <div className="bg-mist-200">
        <Container className="py-24 sm:py-28">
          <SectionHeading eyebrow="Historique" title="Les éditions précédentes" />
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {cigibm.pastEditions.map((edition, i) => (
              <Reveal key={edition.edition} delay={i * 0.08}>
                <div className="flex h-full flex-col rounded-2xl border border-ink/8 bg-mist-50 p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">
                    {edition.year}
                  </p>
                  <h3 className="mt-2 font-display text-lg text-azure-900">
                    {edition.edition}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-ink/80">
                    Thème : « {edition.theme} »
                  </p>
                  <p className="mt-1 text-xs text-ink/50">{edition.location}</p>
                  <p className="mt-3 text-sm font-medium text-azure-700">
                    {edition.attendance}
                  </p>
                  <p className="mt-3 flex-1 text-xs leading-relaxed text-ink/60">
                    {edition.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </div>

      {/* Next edition */}
      <div className="bg-azure-900">
        <Container className="py-24 sm:py-28">
          <div className={`grid items-center gap-12 ${poster ? "lg:grid-cols-2" : ""}`}>
            {poster && (
              <Reveal>
                <Photo src={poster} alt="Affiche — 4ème édition du CIGIBM" ratio="aspect-[4/5]" />
              </Reveal>
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
                    <h3 className="font-display text-xl text-azure-900">{speaker.name}</h3>
                    <p className="mt-1 text-sm font-medium text-leaf-600">{speaker.role}</p>
                    {speaker.bio && (
                      <p className="mt-4 text-sm leading-relaxed text-ink/70">{speaker.bio}</p>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          )}

          {otherSpeakers.length > 0 && (
            <Reveal delay={0.15} className="mt-8 flex flex-wrap gap-3">
              {otherSpeakers.map((speaker) => (
                <span
                  key={speaker.name}
                  className="rounded-full border border-ink/12 bg-mist-100 px-4 py-2 text-sm text-ink/75"
                >
                  <span className="font-medium text-azure-900">{speaker.name}</span>
                  {" — "}
                  {speaker.role}
                </span>
              ))}
            </Reveal>
          )}
        </Container>
      </div>
    </>
  );
}
