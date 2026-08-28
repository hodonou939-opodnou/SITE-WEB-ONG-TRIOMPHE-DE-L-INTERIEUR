"use client";

import { useEffect, useState } from "react";

export default function AmbassadorSuccessPopup({
  slug,
  alreadyExists = false,
}: {
  slug: string;
  alreadyExists?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  // Ecrit après le montage plutôt que calculé directement dans le rendu :
  // window n'existe pas côté serveur, et calculer cette valeur dès le
  // premier rendu client (avant que l'hydratation n'ait fini de comparer
  // au HTML serveur) produirait un texte différent de celui rendu côté
  // serveur — exactement le mismatch d'hydratation que ce report ESLint
  // encourage en général à éviter, mais qui est ici inévitable : il n'y a
  // aucune valeur unique correcte à la fois côté serveur et côté client.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(`${window.location.origin}/cigibm-2026?ref=${slug}`);
  }, [slug]);

  function dismiss() {
    setOpen(false);
    // Retire ambassadeur=succes&ref=... de l'URL pour que le popup ne
    // réapparaisse pas si le visiteur recharge la page.
    window.history.replaceState(null, "", `${window.location.pathname}#ambassadeurs`);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Le champ reste sélectionnable/copiable manuellement si l'API
      // Clipboard n'est pas disponible (contexte non sécurisé, permission).
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ambassador-success-title"
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
          {alreadyExists ? "Déjà ambassadeur !" : "Bienvenue, ambassadeur !"}
        </p>
        <h3 id="ambassador-success-title" className="mt-2 font-display text-2xl leading-snug text-mist-50">
          {alreadyExists ? "Vous avez déjà un compte." : "Vous avez pris la bonne décision."}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-mist-100/70">
          {alreadyExists ? (
            <>
              Il semble que vous soyez déjà inscrit·e comme ambassadeur ou
              ambassadrice. Nous venons de vous renvoyer votre lien
              personnel par email — voici le même, en attendant.
            </>
          ) : (
            <>
              Voici déjà votre lien personnel. Il devient actif dès que
              notre équipe valide votre compte, généralement sous quelques
              minutes. Nous venons aussi de vous l&apos;envoyer par email.
            </>
          )}
        </p>

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-mist-50/20 bg-mist-50/10 px-3.5 py-3">
          <p className="flex-1 truncate text-sm text-mist-50">{url || "…"}</p>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 rounded-full bg-mist-50/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-mist-50 transition-colors hover:bg-mist-50/25"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 w-full rounded-full bg-azure-500 px-6 py-3.5 text-sm font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl"
        >
          Compris, merci !
        </button>
      </div>
    </div>
  );
}
