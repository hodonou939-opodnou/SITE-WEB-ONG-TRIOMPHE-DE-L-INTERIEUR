"use client";

import { useState } from "react";
import { cigibm } from "@/lib/content";

// Le lien officiel, volontairement SANS ?ref= : quelqu'un qui a déjà sa place
// n'est pas ambassadeur, et lui faire partager le lien de l'ambassadeur par
// lequel il est éventuellement arrivé attribuerait ses invités à quelqu'un
// d'autre. En dur plutôt que window.location.origin : cette valeur part dans
// des messages WhatsApp, elle doit toujours pointer le domaine public même si
// la page est ouverte depuis une preview Vercel.
const OFFICIAL_URL = "https://ongtriomphedelinterieur.com/cigibm-2026";

export default function AlreadyRegisteredNotice() {
  const [copied, setCopied] = useState(false);

  const shareMessage = `Je vous invite au CIGIBM ${cigibm.nextEdition.edition}, « ${cigibm.nextEdition.theme} », le ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Réservez votre place gratuite ici : ${OFFICIAL_URL}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(OFFICIAL_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le champ reste sélectionnable/copiable à la main si l'API Clipboard
      // n'est pas disponible (contexte non sécurisé, permission refusée).
    }
  }

  return (
    <div className="mb-4 rounded-2xl border border-leaf-400/30 bg-leaf-500/10 p-5">
      <p className="font-display text-lg leading-snug text-mist-50">
        Oups ! Vous avez déjà réservé votre place.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-mist-100/80">
        Partagez plutôt ce lien et invitez un proche — vous pouvez sauver une
        vie rien qu&apos;en faisant ça.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <code className="min-w-0 flex-1 truncate rounded-lg bg-mist-50/10 px-3 py-2 text-xs text-mist-100/90">
          {OFFICIAL_URL}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-lg bg-mist-50/15 px-3 py-2 text-xs font-semibold text-mist-50 transition-colors hover:bg-mist-50/25"
        >
          {copied ? "Copié !" : "Copier"}
        </button>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-[#25d366] px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Partager sur WhatsApp
      </a>
    </div>
  );
}
