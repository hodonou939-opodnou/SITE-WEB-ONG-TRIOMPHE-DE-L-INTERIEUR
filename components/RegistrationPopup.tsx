"use client";

import { useEffect, useState } from "react";
import { cigibm } from "@/lib/content";

const SHOWN_KEY = "cigibm2026-popup-shown";
const TRIGGER_SCROLL_RATIO = 0.35;
const TRIGGER_DELAY_MS = 8000;

export default function RegistrationPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SHOWN_KEY)) return;

    let shown = false;
    const show = () => {
      if (shown) return;
      shown = true;
      setOpen(true);
      sessionStorage.setItem(SHOWN_KEY, "1");
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(timer);
    };

    const onScroll = () => {
      const ratio =
        window.scrollY / (document.body.scrollHeight - window.innerHeight || 1);
      if (ratio >= TRIGGER_SCROLL_RATIO) show();
    };

    // Exit-intent : la souris quitte la fenêtre par le haut (barre d'adresse,
    // onglets), signe classique qu'on s'apprête à partir.
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) show();
    };

    const timer = setTimeout(show, TRIGGER_DELAY_MS);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("mouseleave", onMouseLeave);
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    setOpen(false);
  }

  if (!open) return null;

  const inputClass =
    "w-full rounded-xl border border-mist-50/20 bg-mist-50/10 px-3.5 py-3 text-sm text-mist-50 placeholder:text-mist-100/40 outline-none transition-colors focus:border-azure-400 focus:bg-mist-50/15";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="relative w-full max-w-md rounded-t-3xl border border-mist-50/12 bg-leaf-950 p-6 shadow-2xl sm:rounded-3xl sm:p-8">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-mist-100/60 transition-colors hover:bg-mist-50/10 hover:text-mist-50"
        >
          ✕
        </button>

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf-300">
          Avant de partir
        </p>
        <h3 id="popup-title" className="mt-2 font-display text-2xl leading-snug text-mist-50">
          Vous lisez depuis un moment. Ne repartez pas sans votre place.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mist-100/70">
          {cigibm.nextEdition.dates} · {cigibm.nextEdition.venue}. Gratuit,
          sur inscription, ça prend moins d&apos;une minute.
        </p>

        <form action="/api/cigibm-register" method="POST" className="mt-5 space-y-3">
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Votre nom complet"
            aria-label="Prénom et nom"
            className={inputClass}
          />
          <input
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="+229 ..."
            aria-label="Téléphone"
            className={inputClass}
          />
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.com"
            aria-label="Email"
            className={inputClass}
          />

          <label className="flex cursor-pointer items-start gap-2.5 pt-0.5">
            <input
              type="checkbox"
              name="consent"
              value="1"
              required
              className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-azure-500"
            />
            <span className="text-xs leading-relaxed text-mist-100/60">
              J&apos;accepte de recevoir par email et téléphone les
              informations liées à mon inscription au CIGIBM 2026.
            </span>
          </label>

          <button
            type="submit"
            className="w-full rounded-full bg-azure-500 px-6 py-3.5 text-sm font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
          >
            Je réserve ma place gratuite →
          </button>
        </form>

        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full text-center text-xs text-mist-100/50 underline underline-offset-4 hover:text-mist-100/70"
        >
          Non merci, plus tard
        </button>
      </div>
    </div>
  );
}
