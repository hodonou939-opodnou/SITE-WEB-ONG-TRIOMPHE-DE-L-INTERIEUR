"use client";

import { useState } from "react";
import { compressPhoto } from "@/lib/client/compressImage";

export default function AmbassadorSignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass =
    "w-full rounded-xl border border-mist-50/20 bg-mist-50/10 px-4 py-3.5 text-sm text-mist-50 placeholder:text-mist-100/40 outline-none transition-colors focus:border-azure-400 focus:bg-mist-50/15";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const photo = formData.get("photo");
    if (photo instanceof File && photo.size > 0) {
      formData.set("photo", await compressPhoto(photo));
    }

    // Navigation en dur plutôt que router.push() : cohérent avec le reste
    // du site, où RegistrationForm et toutes les autres pages de ce tunnel
    // reposent sur une vraie soumission de formulaire + redirection navigateur
    // plutôt que sur une transition client-side. La seule raison pour
    // laquelle celui-ci passe par fetch() est la compression de la photo
    // avant l'envoi (cf. compressPhoto ci-dessus) — la navigation finale
    // doit se comporter de façon identique aux autres formulaires du site.
    try {
      const response = await fetch("/api/ambassador-signup", { method: "POST", body: formData });
      // fetch() suit les redirections lui-même : response.redirected/.ok
      // ne sont fiables ici que si le serveur a effectivement répondu par
      // une redirection 303 (comportement normal de cette route). Un 500
      // brut sans Location laisserait response.url pointer vers l'URL de
      // la requête d'origine — sans ce garde, la navigation finale
      // atterrirait sur du 404/405 plutôt que sur l'état d'erreur normal
      // de la page.
      if (response.redirected && response.ok) {
        window.location.href = response.url;
      } else {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- voir le commentaire au-dessus du bloc try
        window.location.href = "/cigibm?ambassadeur=erreur#ambassadeurs";
      }
    } catch (err) {
      console.error("Ambassador signup request failed", err);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- voir le commentaire ci-dessus
      window.location.href = "/cigibm?ambassadeur=erreur#ambassadeurs";
    }
  }

  return (
    <div className="rounded-3xl border border-mist-50/12 bg-leaf-900/60 p-6 backdrop-blur sm:p-8">
      <h3 className="font-display text-2xl leading-snug text-mist-50">
        Devenir ambassadeur ou ambassadrice
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-mist-100/70">
        Créez votre lien personnel en une minute. Nous vous l&apos;envoyons
        par email dès que votre compte est validé par notre équipe.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="amb-photo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Votre photo (optionnel, mais recommandé)
          </label>
          <input
            id="amb-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-mist-100/70 file:mr-3 file:rounded-full file:border-0 file:bg-leaf-500/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-leaf-300 hover:file:bg-leaf-500/30"
          />
        </div>

        <div>
          <label
            htmlFor="amb-fullname"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Prénom & nom
          </label>
          <input
            id="amb-fullname"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className={inputClass}
            placeholder="Votre nom complet"
          />
        </div>

        <div>
          <label
            htmlFor="amb-phone"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Téléphone (WhatsApp de préférence)
          </label>
          <input
            id="amb-phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            className={inputClass}
            placeholder="+229 ..."
          />
        </div>

        <div>
          <label
            htmlFor="amb-email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-mist-100/60"
          >
            Email
          </label>
          <input
            id="amb-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={inputClass}
            placeholder="vous@exemple.com"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3 pt-1">
          <input
            type="checkbox"
            name="consent"
            value="1"
            required
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-leaf-400"
          />
          <span className="text-xs leading-relaxed text-mist-100/60">
            J&apos;accepte que mon nom et ma photo (si j&apos;en fournis une)
            apparaissent publiquement sur le site une fois mon compte
            ambassadeur validé.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-azure-500 px-6 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-azure-900/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-azure-600 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Création en cours..." : "Créer mon lien d'ambassadeur"}
        </button>
      </form>
    </div>
  );
}
