"use client";

import { useRef } from "react";
import Image from "next/image";
import ImagePlaceholder from "@/components/ImagePlaceholder";
import type { PublicAmbassador } from "@/lib/ambassadors/public";

export default function AmbassadorSlider({ ambassadors }: { ambassadors: PublicAmbassador[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 300;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ambassadors.map((a) => (
          <div
            key={a.id}
            data-card
            className="flex w-[260px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-ink/8 bg-mist-50 shadow-sm sm:w-[280px]"
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
              <p className="mt-3 text-xs font-semibold text-leaf-600">
                {a.referredCount} personne{a.referredCount !== 1 ? "s" : ""} inscrite{a.referredCount !== 1 ? "s" : ""} grâce à {a.fullName.split(" ")[0]}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Ambassadeur précédent"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Ambassadeur suivant"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
