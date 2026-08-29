"use client";

import { useState, type ChangeEvent } from "react";
import { useFormStatus } from "react-dom";
import { compressPhoto } from "@/lib/client/compressImage";

type AmbassadorFormProps = {
  ambassador?: {
    fullName: string;
    phone: string;
    whatsappNumber: string | null;
    email: string | null;
    photoUrl: string | null;
    bio: string | null;
    active: boolean;
  };
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  showActiveToggle: boolean;
};

// Séparé du formulaire : useFormStatus() ne lit l'état du <form> englobant
// que depuis un composant rendu à l'intérieur de celui-ci, pas depuis le
// composant qui rend le <form> lui-même.
function SubmitButton({ submitLabel }: { submitLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Enregistrement…" : submitLabel}
    </button>
  );
}

const inputClass = "w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm";

export default function AmbassadorForm({ ambassador, action, submitLabel, showActiveToggle }: AmbassadorFormProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(ambassador?.photoUrl ?? null);
  const [isCompressing, setIsCompressing] = useState(false);

  // Compression au moment du choix du fichier, pas à la soumission : ce
  // formulaire est lié à une Server Action native (action={action}), pas
  // intercepté en JS — remplacer le fichier de l'input via DataTransfer dès
  // onChange évite de toucher au mécanisme de soumission lui-même. Même
  // contrainte que le formulaire public (limite Vercel de 4.5 Mo par
  // requête, non configurable).
  async function handlePhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const compressed = await compressPhoto(file);
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(compressed);
      event.target.files = dataTransfer.files;
      setPreviewUrl(URL.createObjectURL(compressed));
    } finally {
      setIsCompressing(false);
    }
  }

  return (
    <form action={action} encType="multipart/form-data" className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Nom complet</label>
        <input name="fullName" required defaultValue={ambassador?.fullName} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Téléphone</label>
        <input
          name="phone"
          required
          defaultValue={ambassador?.phone}
          placeholder="0196966501"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Numéro WhatsApp (optionnel, sinon le téléphone ci-dessus est utilisé)
        </label>
        <input name="whatsappNumber" defaultValue={ambassador?.whatsappNumber ?? ""} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Email (optionnel)</label>
        <input name="email" type="email" defaultValue={ambassador?.email ?? ""} className={inputClass} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Photo</label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink/10 bg-mist-100">
            {previewUrl ? (
              // Aperçu local (URL blob:) ou photo déjà en ligne — next/image
              // exige des dimensions connues à l'avance, inadapté à un blob
              // temporaire choisi à l'instant par l'utilisateur.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Aperçu de la photo" className="h-full w-full object-cover" />
            ) : (
              <span className="text-center text-[10px] uppercase tracking-wide text-ink/40">Aucune photo</span>
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="block w-full text-sm text-ink/70 file:mr-3 file:rounded-full file:border-0 file:bg-leaf-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-leaf-700 hover:file:bg-leaf-100"
            />
            {isCompressing && <p className="mt-1.5 text-xs text-ink/50">Compression de l&apos;image…</p>}
          </div>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Ou URL de la photo (utilisée seulement si aucun fichier n&apos;est choisi ci-dessus) — un
          chemin local comme <code>/images/ambassadors/prenom-nom.jpg</code> ou une URL
          complète fonctionnent tous les deux
        </label>
        <input
          name="photoUrl"
          type="text"
          defaultValue={ambassador?.photoUrl ?? ""}
          placeholder="/images/ambassadors/prenom-nom.jpg"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Courte présentation (optionnel, pour la section publique du site)
        </label>
        <textarea name="bio" rows={3} defaultValue={ambassador?.bio ?? ""} className={inputClass} />
      </div>
      {showActiveToggle && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={ambassador?.active ?? true} />
          Actif (visible dans la section publique du site)
        </label>
      )}
      <SubmitButton submitLabel={submitLabel} />
    </form>
  );
}
