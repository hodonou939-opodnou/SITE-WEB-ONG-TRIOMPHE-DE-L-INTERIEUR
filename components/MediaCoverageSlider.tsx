"use client";

import { useRef } from "react";
import Image from "next/image";
import { pressMentions } from "@/lib/content";

export default function MediaCoverageSlider() {
  const trackRef = useRef<HTMLDivElement>(null);

  function scrollBy(direction: 1 | -1) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector("[data-card]") as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : 340;
    track.scrollBy({ left: step * direction, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {pressMentions.map((mention) => (
          <a
            key={mention.url}
            data-card
            href={mention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl bg-leaf-950 shadow-lg shadow-ink/10 transition-transform duration-300 hover:-translate-y-1 sm:w-[340px]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={mention.image}
                alt={mention.title}
                fill
                sizes="340px"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-leaf-950 via-leaf-950/20 to-transparent" />
              <span className="absolute left-4 top-4 rounded-full bg-mist-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-leaf-900">
                {mention.outlet}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-lg leading-snug text-mist-50 transition-colors group-hover:text-leaf-300">
                {mention.title}
              </h3>
              <div className="mt-4 flex items-center justify-between text-xs text-mist-100/50">
                <span>{mention.date}</span>
                <span className="inline-flex items-center gap-1 font-semibold text-leaf-300">
                  Lire l&apos;article
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Article précédent"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Article suivant"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/12 text-leaf-700 transition-colors hover:border-leaf-400 hover:bg-leaf-50"
        >
          →
        </button>
      </div>
    </div>
  );
}
