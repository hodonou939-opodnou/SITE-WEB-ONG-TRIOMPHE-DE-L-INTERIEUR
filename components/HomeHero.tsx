import type { ReactNode } from "react";
import Container from "./Container";
import HeroPhoto from "./HeroPhoto";
import { frenchSpacing } from "@/lib/typography";

// Accueil : le texte d'abord (affiché instantanément, c'est lui que le téléphone
// peint en premier), la photo ensuite. Sur ordinateur, la photo occupe un grand
// panneau qui court jusqu'au bord droit de l'écran, avec un seul angle arrondi.
export default function HomeHero({
  title,
  lede,
  proof,
  actions,
  photoAlt,
  photoCaption,
}: {
  title: string;
  lede: string;
  proof: string;
  actions: ReactNode;
  photoAlt: string;
  photoCaption: string;
}) {
  return (
    <section className="relative overflow-hidden bg-leaf-950 text-mist-50">
      <div aria-hidden className="pointer-events-none absolute -left-40 top-1/3 h-[28rem] w-[28rem] rounded-full bg-leaf-700/25 blur-3xl" />
      <Container className="relative z-10 pb-12 pt-14 sm:pb-16 sm:pt-20 lg:flex lg:min-h-[min(86vh,800px)] lg:items-center lg:py-24">
        <div className="max-w-xl lg:max-w-[44%]">
          <h1 className="text-balance font-display text-[2.6rem] leading-[1.04] sm:text-6xl lg:text-[4.1rem]">{frenchSpacing(title)}</h1>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-mist-100/80 sm:text-lg">{frenchSpacing(lede)}</p>
          <div className="mt-9 flex flex-wrap gap-3">{actions}</div>
          <p className="mt-10 max-w-md border-t border-mist-50/12 pt-5 text-sm leading-relaxed text-mist-100/60">{frenchSpacing(proof)}</p>
        </div>
      </Container>

      <figure className="relative mx-4 aspect-[4/3] overflow-hidden rounded-t-[2rem] sm:mx-8 sm:aspect-[16/9] lg:absolute lg:inset-y-0 lg:right-0 lg:mx-0 lg:aspect-auto lg:w-[48vw] lg:rounded-none lg:rounded-bl-[9rem]">
        <HeroPhoto alt={photoAlt} />
        {/* Fond qui se fond dans le vert du bandeau, côté texte, sur ordinateur. */}
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-leaf-950/70 to-transparent lg:block" />
        <figcaption className="absolute bottom-3 left-3 rounded-full bg-leaf-950/60 px-3 py-1.5 text-xs text-mist-50/85 backdrop-blur lg:bottom-6 lg:left-auto lg:right-6">
          {photoCaption}
        </figcaption>
      </figure>
    </section>
  );
}
