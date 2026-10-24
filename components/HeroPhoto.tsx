"use client";

import Image from "next/image";
import { useState } from "react";

// Miniature de la photo (24 px de large, moins de 300 octets) intégrée à la page :
// c'est le « voile » flou affiché d'emblée. Il se lève une fois la vraie photo
// chargée, ce qui est le propos de l'accueil : rendre visible ce qu'on ne voit pas.
// Seule l'opacité du voile s'anime (coût quasi nul pour un téléphone). Filet de
// sécurité CSS (.hero-veil) : il se lève quand même au bout de 4 s si le JavaScript
// ne tourne pas, et il est retiré d'emblée si l'appareil demande moins d'animations.
const VEIL =
  "data:image/webp;base64,UklGRhYBAABXRUJQVlA4IAoBAACwBgCdASoYABIAPtFepE6oJSMiKAqpABoJbACdMzQ7TvHhD/1UjQJVY3dDYGGopL5kp2A5HlTlKil4NnarKAD+0WEHBdcCdKPaEbuQdixh6uRRe0b+MXqM4ryUYTvNj6w0G+AUMJT5HeU6lCE/TA7ynHopxgWsDceOFg4hhyxdt5oLFhEAJAE4ruCGhQjO+pPV1WrThHNhG4pAE2ooxcGgi42YhrY4DSVVxOZ04nU9qnCntog8bYTf8GwMbsLoZ5TU+aWS2/5criBxFmR7sPTSwYpu1kzzme1aVWYXKdA9DMMWO6PUlQzw93yn7e5OXs+kfb77pzrgmjKKX59ooIsUzZadF8rz2VoAAA==";

const POSITION = "42% 38%";

export default function HeroPhoto({ alt }: { alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <>
      <Image
        src="/images/home/hero-cigibm-public.jpg"
        alt={alt}
        fill
        // Pas de préchargement prioritaire : sur téléphone, le texte s'affiche en
        // premier et la photo ne doit pas lui disputer la bande passante.
        loading="eager"
        quality={75}
        sizes="(min-width: 1024px) 48vw, 100vw"
        className="object-cover"
        style={{ objectPosition: POSITION }}
        onLoad={() => setLoaded(true)}
      />
      <div
        aria-hidden
        className={`hero-veil pointer-events-none absolute inset-0 scale-110 bg-cover blur-xl transition-opacity duration-[1600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${loaded ? "opacity-0" : "opacity-100"}`}
        style={{ backgroundImage: `url(${VEIL})`, backgroundPosition: POSITION }}
      />
    </>
  );
}
