"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GalleryPhoto } from "@/lib/cigibm-gallery-4";

type Day = {
  day: 1 | 2;
  label: string;
  date: string;
  place: string;
  moments: { key: string; label: string }[];
};

const PAGE = 12;

// Galerie d'une édition : un onglet par jour, des filtres par moment, une grille
// qui ne charge les photos qu'au défilement, et une visionneuse plein écran
// (flèches, Échap, balayage au doigt) avec le crédit du photographe.
export default function EditionGallery({ days, photos }: { days: Day[]; photos: GalleryPhoto[] }) {
  const [day, setDay] = useState<1 | 2>(days[0].day);
  const [moment, setMoment] = useState<string>("all");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState<number | null>(null);

  const current = days.find((d) => d.day === day)!;
  const filtered = useMemo(
    () => photos.filter((p) => p.day === day && (moment === "all" || p.moment === moment)),
    [photos, day, moment],
  );
  const visible = filtered.slice(0, shown);
  const momentLabel = (key: string) => current.moments.find((m) => m.key === key)?.label ?? "";

  function chooseDay(d: 1 | 2) {
    setDay(d);
    setMoment("all");
    setShown(PAGE);
  }

  return (
    <div>
      {/* Jours */}
      <div role="tablist" aria-label="Choisir le jour" className="grid gap-3 sm:grid-cols-2">
        {days.map((d) => {
          const active = d.day === day;
          const count = photos.filter((p) => p.day === d.day).length;
          return (
            <button
              key={d.day}
              role="tab"
              aria-selected={active}
              onClick={() => chooseDay(d.day)}
              className={`rounded-2xl border p-4 text-left transition-colors sm:p-5 ${
                active ? "border-leaf-700 bg-leaf-900 text-mist-50" : "border-ink/10 bg-mist-50 text-ink hover:border-leaf-300"
              }`}
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-xl">{d.label}</span>
                <span className={`text-xs ${active ? "text-mist-50/70" : "text-ink/50"}`}>{count} photos</span>
              </span>
              <span className={`mt-1 block text-sm ${active ? "text-mist-50/85" : "text-ink/70"}`}>{d.date}</span>
              <span className={`block text-sm ${active ? "text-leaf-200" : "text-leaf-700"}`}>{d.place}</span>
            </button>
          );
        })}
      </div>

      {/* Moments */}
      <div className="-mx-6 mt-5 flex gap-2 overflow-x-auto px-6 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filtrer par moment">
        {[{ key: "all", label: "Tout" }, ...current.moments].map((m) => {
          const count = m.key === "all" ? photos.filter((p) => p.day === day).length : photos.filter((p) => p.day === day && p.moment === m.key).length;
          const active = moment === m.key;
          return (
            <button
              key={m.key}
              onClick={() => {
                setMoment(m.key);
                setShown(PAGE);
              }}
              aria-pressed={active}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm ${
                active ? "border-leaf-700 bg-leaf-700 font-semibold text-mist-50" : "border-ink/12 bg-mist-50 text-ink/75 hover:border-leaf-300"
              }`}
            >
              {m.label}
              <span className={active ? "text-mist-50/70" : "text-ink/40"}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grille */}
      <ul className="mt-6 columns-2 gap-3 sm:columns-3 lg:columns-4">
        {visible.map((p) => {
          const i = filtered.indexOf(p);
          return (
            <li key={p.src} className="mb-3 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative block w-full overflow-hidden rounded-xl bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf-600"
                aria-label={`Agrandir : ${p.alt}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </button>
            </li>
          );
        })}
      </ul>

      {filtered.length > shown && (
        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setShown((s) => s + PAGE)}
            className="inline-flex min-h-12 items-center rounded-full border border-leaf-600 px-6 text-sm font-bold text-leaf-700 hover:bg-leaf-50"
          >
            Voir {Math.min(PAGE, filtered.length - shown)} photos de plus ({filtered.length - shown} restantes)
          </button>
        </div>
      )}

      {open !== null && (
        <Lightbox
          photos={filtered}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
          label={(p) => `${current.label}, ${momentLabel(p.moment).toLowerCase()}`}
        />
      )}
    </div>
  );
}

function Lightbox({
  photos,
  index,
  onIndex,
  onClose,
  label,
}: {
  photos: GalleryPhoto[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  label: (p: GalleryPhoto) => string;
}) {
  const photo = photos[index];
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const prev = useCallback(() => onIndex((index - 1 + photos.length) % photos.length), [index, photos.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % photos.length), [index, photos.length, onIndex]);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      before?.focus();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next]);

  const nav = "absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-mist-50/10 text-2xl text-mist-50 backdrop-blur hover:bg-mist-50/20";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse de photos"
      className="fixed inset-0 z-[60] flex flex-col bg-leaf-950"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-sm text-mist-50/80">
        <span>
          {index + 1} / {photos.length}
        </span>
        <button ref={closeRef} type="button" onClick={onClose} className="inline-flex min-h-11 items-center rounded-full px-4 font-semibold text-mist-50 hover:bg-mist-50/10">
          Fermer
        </button>
      </div>
      <div className="relative min-h-0 flex-1">
        <Image key={photo.src} src={photo.src} alt={photo.alt} fill sizes="100vw" quality={75} className="object-contain" />
        {photos.length > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Photo précédente" className={`${nav} left-3`}>
              ‹
            </button>
            <button type="button" onClick={next} aria-label="Photo suivante" className={`${nav} right-3`}>
              ›
            </button>
          </>
        )}
      </div>
      <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 text-center">
        <p className="text-sm text-mist-50">{photo.alt}</p>
        <p className="mt-1 text-xs text-mist-50/60">
          {label(photo)}. Photo : {photo.credit}
        </p>
      </div>
    </div>
  );
}
