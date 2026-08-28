import type { Metadata } from "next";
import Image from "next/image";
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
import AmbassadorSlider from "@/components/AmbassadorSlider";
import AmbassadorSignupForm from "@/components/AmbassadorSignupForm";
import { cigibm, foundingStory, mentalHealthStats, pressMentions } from "@/lib/content";
import { getGalleryImages, getNamedImage } from "@/lib/media";
import { pageMetadata } from "@/lib/seo";
import { listActiveAmbassadors } from "@/lib/ambassadors/public";

const ambassadorBenefits = [
  {
    title: "Un statut officiel",
    description:
      "Vous devenez Ambassadeur ou Ambassadrice CIGIBM 2026, un titre qui vous engage aux côtés de l'ONG pour toute la durée de l'édition.",
  },
  {
    title: "Un certificat de reconnaissance",
    description:
      "Un certificat officiel, à votre nom, atteste de votre contribution et vous est remis par l'ONG Triomphe de l'Intérieur.",
  },
  {
    title: "Une mise à l'honneur au congrès",
    description:
      "Vous êtes présenté·e devant l'ensemble des participants, le jour du congrès, pour ce que vous avez accompli.",
  },
  {
    title: "Une visibilité officielle",
    description:
      "Votre nom et votre photo apparaissent sur le site et les canaux officiels du CIGIBM, une fois votre compte validé.",
  },
];

export const metadata: Metadata = pageMetadata({
  title: "CIGIBM",
  description:
    "Le Congrès International de Guérison Intérieure et de Bien-être Mental (CIGIBM), organisé par l'ONG Triomphe de l'Intérieur. Trois éditions, plus de 58 000 personnes touchées.",
  path: "/cigibm",
  image: { url: "/images/cigibm-featured.jpg", alt: "Congrès CIGIBM" },
});

export default async function CigibmPage({
  searchParams,
}: {
  searchParams: Promise<{ ambassadeur?: string }>;
}) {
  const { ambassadeur } = await searchParams;
  const featured = getNamedImage("cigibm-featured") ?? getGalleryImages("cigibm")[0];
  const poster = getNamedImage("cigibm-poster");
  const nextEditionPhotos = getGalleryImages(`cigibm-${cigibm.nextEdition.id}`);
  const featuredSpeakers = cigibm.nextEdition.speakers.filter((s) => s.featured);
  const otherSpeakers = cigibm.nextEdition.speakers.filter((s) => !s.featured);

  let activeAmbassadors: Awaited<ReturnType<typeof listActiveAmbassadors>> = [];
  try {
    activeAmbassadors = await listActiveAmbassadors();
  } catch (err) {
    // Ne doit jamais faire tomber la page /cigibm : une base indisponible
    // dégrade simplement vers l'état "aucun ambassadeur" (même garde que
    // /cigibm-2026 avant ce déplacement — cf. Finding 3 de la revue finale
    // de l'Ambassador Program).
    console.error("listActiveAmbassadors failed", err);
  }

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
              Inscris-toi maintenant
            </Button>
            <p className="text-sm font-medium text-leaf-700">
              Seulement quelques places restantes
            </p>
          </Reveal>
        </Container>
      </div>

      {/* Programme Ambassadeurs */}
      <div className="bg-leaf-950">
        <Container className="py-24 sm:py-28">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Programme Ambassadeurs
            </p>
            <h2 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl">
              {activeAmbassadors.length > 0
                ? "Ils et elles relèvent déjà le défi"
                : "Relevez le défi CIGIBM 2026"}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mist-100/75">
              Chaque ambassadeur invite son entourage grâce à un lien unique.
              Celui ou celle qui obtient le plus d&apos;inscriptions valides
              remporte le trophée officiel de l&apos;édition.
            </p>
          </Reveal>

          <Reveal
            delay={0.08}
            className="mx-auto mt-10 flex max-w-xs flex-col items-center rounded-2xl border border-leaf-400/25 bg-mist-50/5 px-8 py-6 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf-300">
              Objectif
            </p>
            <p className="mt-2 font-display text-5xl text-mist-50">500+</p>
            <p className="mt-1 text-sm text-mist-100/70">inscriptions valides</p>
          </Reveal>

          <div className="mt-16 grid gap-6 sm:grid-cols-2">
            {ambassadorBenefits.map((item, i) => (
              <Reveal key={item.title} delay={i * 0.06}>
                <div className="h-full rounded-2xl border border-mist-50/10 bg-mist-50/5 p-7 transition-colors duration-300 hover:border-leaf-400/30">
                  <span className="font-display text-2xl text-leaf-300">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-3 font-display text-xl leading-snug text-mist-50">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-mist-100/70">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-16 grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <Photo
                src="/images/ambassadors/ambassadrice-2025.jpg"
                alt="Ambassadrice CIGIBM 2025, récompensée pour ses inscriptions"
                ratio="aspect-[4/5]"
              />
            </Reveal>
            <Reveal delay={0.1}>
              <p className="text-xs font-semibold uppercase tracking-wide text-leaf-300">
                Édition 2025
              </p>
              <p className="mt-3 font-display text-2xl leading-snug text-mist-50">
                Le trophée a déjà un visage.
              </p>
              <p className="mt-4 text-base leading-relaxed text-mist-100/70">
                Ambassadrice CIGIBM 2025, récompensée pour le plus grand
                nombre d&apos;inscriptions valides et mise à l&apos;honneur
                devant tout le congrès. La 4ème édition cherche déjà celui ou
                celle qui prendra sa suite.
              </p>
            </Reveal>
          </div>

          {activeAmbassadors.length > 0 && (
            <div className="mt-16">
              <p className="mb-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-leaf-300">
                Ambassadeurs de l&apos;édition 2026
              </p>
              <AmbassadorSlider ambassadors={activeAmbassadors} />
            </div>
          )}

          <div className="mx-auto mt-16 max-w-md">
            {ambassadeur === "succes" && (
              <p className="mb-5 rounded-xl border border-leaf-400/30 bg-leaf-500/10 px-4 py-3 text-center text-sm text-leaf-200">
                Votre compte ambassadeur a bien été créé. Vous allez recevoir
                un email avec votre lien personnel dès qu&apos;il sera validé
                par notre équipe.
              </p>
            )}
            {ambassadeur === "erreur" && (
              <p className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
                Une erreur est survenue, votre inscription n&apos;a pas pu
                être enregistrée. Réessayez, ou appelez le{" "}
                {cigibm.nextEdition.registrationPhones[0]}.
              </p>
            )}
            <AmbassadorSignupForm />
          </div>
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
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/8 bg-mist-warm transition-all duration-300 hover:-translate-y-1 hover:border-leaf-200 hover:shadow-lg hover:shadow-ink/8"
                  >
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <Image
                        src={mention.image}
                        alt={mention.title}
                        fill
                        sizes="(min-width: 1024px) 33vw, 100vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute left-4 top-4 rounded-full bg-mist-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-leaf-900">
                        {mention.outlet}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="font-display text-lg leading-snug text-leaf-900">
                          {mention.title}
                        </h3>
                        <span
                          aria-hidden
                          className="mt-1 shrink-0 text-leaf-600 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        >
                          ↗
                        </span>
                      </div>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
                        {mention.excerpt}
                      </p>
                      <p className="mt-4 text-xs text-ink/45">{mention.date}</p>
                    </div>
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
