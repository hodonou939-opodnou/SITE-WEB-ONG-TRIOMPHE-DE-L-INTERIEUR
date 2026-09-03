"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import type { PublicAmbassador } from "@/lib/ambassadors/public";

const AUTO_ADVANCE_MS = 3800;

export default function AmbassadorSlider({ ambassadors }: { ambassadors: PublicAmbassador[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 300;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  // Défilement automatique doux, en boucle — pausé au survol/toucher et
  // désactivé si l'utilisateur préfère moins de mouvement à l'écran.
  useEffect(() => {
    if (isPaused || ambassadors.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        scrollBy(1);
      }
    }, AUTO_ADVANCE_MS);

    return () => window.clearInterval(id);
  }, [isPaused, ambassadors.length]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ambassadors.map((a) => (
          <div
            key={a.id}
            data-card
            className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-mist-50/10 bg-mist-50 shadow-lg shadow-black/10 transition-transform duration-300 sm:w-[280px]"
          >
            <div className="relative aspect-square w-full overflow-hidden">
              {a.photoUrl ? (
                <Image src={a.photoUrl} alt={a.fullName} fill sizes="280px" className="object-cover" />
              ) : (
                <ImagePlaceholder label={a.fullName} ratio="aspect-square" />
              )}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg text-leaf-900">{a.fullName}</h3>
              {a.bio && <p className="mt-2 text-sm leading-relaxed text-ink/70">{a.bio}</p>}
              {a.referredCount > 0 && (
                <p className="mt-3 text-xs font-semibold text-leaf-600">
                  {a.referredCount} personne{a.referredCount !== 1 ? "s" : ""} inscrite{a.referredCount !== 1 ? "s" : ""} grâce à {a.fullName.split(" ")[0]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ambassadeur précédent"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-mist-50/20 text-mist-50 transition-colors hover:border-leaf-300 hover:bg-mist-50/10"
        >
          ‹
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ambassadeur suivant"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-mist-50/20 text-mist-50 transition-colors hover:border-leaf-300 hover:bg-mist-50/10"
        >
          ›
        </button>
      </div>
    </div>
  );
}
