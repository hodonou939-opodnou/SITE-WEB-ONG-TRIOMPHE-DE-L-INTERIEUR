"use client";

import { useState } from "react";

const MAX_UNCOMPRESSED_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Les photos prises directement au téléphone dépassent très souvent la
// limite dure de 4.5 Mo imposée par les Serverless Functions Vercel pour le
// corps d'une requête (non configurable, contrairement à l'ancienne
// bodyParser.sizeLimit des Pages API) — la quasi-totalité des ambassadeurs
// qui choisissaient une vraie photo de téléphone se heurtait donc à un 413
// avant même que le code de la route ne s'exécute. On compresse donc côté
// navigateur avant l'envoi plutôt que de dépendre d'une limite serveur
// qu'on ne peut pas relever.
async function compressPhoto(file: File): Promise<File> {
  if (file.size <= MAX_UNCOMPRESSED_BYTES) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (err) {
    console.error("Photo compression failed, submitting the original file", err);
    return file;
  }
}

export default function AmbassadorSignupForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-mist-50 px-4 py-3.5 text-sm text-leaf-950 placeholder:text-ink/35 outline-none transition-colors focus:border-leaf-400";

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

    try {
      const response = await fetch("/api/ambassador-signup", { method: "POST", body: formData });
      window.location.href = response.url || "/cigibm-2026?ambassadeur=succes#ambassadeurs";
    } catch (err) {
      console.error("Ambassador signup request failed", err);
      window.location.href = "/cigibm-2026?ambassadeur=erreur#ambassadeurs";
    }
  }

  return (
    <div className="rounded-3xl border border-ink/8 bg-mist-50 p-6 sm:p-8">
      <h3 className="font-display text-2xl leading-snug text-leaf-900">
        Devenir ambassadeur ou ambassadrice
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/70">
        Créez votre lien personnel en une minute. Nous vous l&apos;envoyons
        par email dès que votre compte est validé par notre équipe.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="amb-photo"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
          >
            Votre photo (optionnel, mais recommandé)
          </label>
          <input
            id="amb-photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-leaf-100 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-leaf-700 hover:file:bg-leaf-200"
          />
        </div>

        <div>
          <label
            htmlFor="amb-fullname"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
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
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
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
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/50"
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
            className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-leaf-500"
          />
          <span className="text-xs leading-relaxed text-ink/60">
            J&apos;accepte que mon nom et ma photo (si j&apos;en fournis une)
            apparaissent publiquement sur le site une fois mon compte
            ambassadeur validé.
          </span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-leaf-600 px-6 py-4 text-base font-semibold tracking-wide text-mist-50 shadow-lg shadow-leaf-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-leaf-700 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
        >
          {isSubmitting ? "Création en cours..." : "Créer mon lien d'ambassadeur"}
        </button>
      </form>
    </div>
  );
}
