"use client";

import { useFormStatus } from "react-dom";

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
      className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Enregistrement…" : submitLabel}
    </button>
  );
}

export default function AmbassadorForm({ ambassador, action, submitLabel, showActiveToggle }: AmbassadorFormProps) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Nom complet</label>
        <input
          name="fullName"
          required
          defaultValue={ambassador?.fullName}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Téléphone</label>
        <input
          name="phone"
          required
          defaultValue={ambassador?.phone}
          placeholder="0196966501"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Numéro WhatsApp (optionnel, sinon le téléphone ci-dessus est utilisé)
        </label>
        <input
          name="whatsappNumber"
          defaultValue={ambassador?.whatsappNumber ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Email (optionnel)</label>
        <input
          name="email"
          type="email"
          defaultValue={ambassador?.email ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          URL de la photo (optionnel, pour la section publique du site) — un chemin
          local comme <code>/images/ambassadors/prenom-nom.jpg</code> ou une URL
          complète (<code>https://...</code>) fonctionnent tous les deux
        </label>
        <input
          name="photoUrl"
          type="text"
          defaultValue={ambassador?.photoUrl ?? ""}
          placeholder="/images/ambassadors/prenom-nom.jpg"
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">
          Courte présentation (optionnel, pour la section publique du site)
        </label>
        <textarea
          name="bio"
          rows={3}
          defaultValue={ambassador?.bio ?? ""}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        />
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
