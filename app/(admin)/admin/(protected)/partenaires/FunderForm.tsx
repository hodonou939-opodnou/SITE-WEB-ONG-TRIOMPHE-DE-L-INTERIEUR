"use client";

import { useActionState } from "react";
import { FUNDER_KINDS, FUNDER_KIND_LABELS, RELEVANCE_LABELS } from "@/lib/funders-meta";
import type { FunderFormState } from "./actions";

type Initial = Partial<Record<
  "name" | "kind" | "country" | "scope" | "focus" | "relevance" | "why" | "howToApply" | "deadline" | "website" | "applyUrl" | "contactEmail" | "contactPhone" | "contactFormUrl" | "linkedinUrl" | "sourceUrl" | "notes",
  string
>>;

const input = "w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-base outline-none focus:border-leaf-500 sm:text-sm";
const label = "mb-1.5 block text-xs font-medium text-ink/60";

export default function FunderForm({
  action,
  initial = {},
  submitLabel,
}: {
  action: (prev: FunderFormState, formData: FormData) => Promise<FunderFormState>;
  initial?: Initial;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, null);
  const v = (k: keyof Initial, fallback = "") => state?.values?.[k] ?? initial[k] ?? fallback;
  const field = (k: keyof Initial, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={k} className={label}>{text}</label>
      <input id={k} name={k} defaultValue={v(k)} className={input} {...props} />
    </div>
  );

  return (
    <form action={formAction} className="mt-6 max-w-3xl space-y-6">
      {state?.error && <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">{state.error}</p>}

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-leaf-900">Organisation</legend>
        {field("name", "Nom", { required: true, maxLength: 160 })}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="kind" className={label}>Type</label>
            <select id="kind" name="kind" defaultValue={v("kind", "fondation")} className={input}>
              {FUNDER_KINDS.map((k) => <option key={k} value={k}>{FUNDER_KIND_LABELS[k]}</option>)}
            </select>
          </div>
          {field("country", "Pays (siège)", { required: true, maxLength: 80 })}
          <div>
            <label htmlFor="relevance" className={label}>Pertinence pour l&apos;ONG</label>
            <select id="relevance" name="relevance" defaultValue={v("relevance", "2")} className={input}>
              {[3, 2, 1].map((r) => <option key={r} value={r}>{RELEVANCE_LABELS[r]}</option>)}
            </select>
          </div>
        </div>
        {field("scope", "Zone d'intervention", { placeholder: "Ex. Afrique de l'Ouest, monde", maxLength: 200 })}
        {field("focus", "Causes soutenues", { required: true, placeholder: "Ex. santé mentale, femmes, jeunesse", maxLength: 300 })}
        <div>
          <label htmlFor="why" className={label}>Pourquoi c&apos;est pertinent pour nous</label>
          <textarea id="why" name="why" rows={3} defaultValue={v("why")} className={input} />
        </div>
        <div>
          <label htmlFor="howToApply" className={label}>Comment les approcher</label>
          <textarea id="howToApply" name="howToApply" rows={3} defaultValue={v("howToApply")} className={input} />
        </div>
        <div className="sm:w-1/2">
          {field("deadline", "Prochaine date limite (appel en cours)", { type: "date" })}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="font-display text-lg text-leaf-900">Coordonnées officielles</legend>
        <p className="text-xs text-ink/55">Uniquement des coordonnées publiées par l&apos;organisation elle-même, jamais d&apos;email ou de numéro personnel.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("website", "Site web", { type: "url", placeholder: "https://…" })}
          {field("applyUrl", "Page de candidature ou d'appels à projets", { type: "url", placeholder: "https://…" })}
          {field("contactEmail", "Email officiel", { type: "email" })}
          {field("contactPhone", "Téléphone officiel")}
          {field("contactFormUrl", "Formulaire de contact", { type: "url", placeholder: "https://…" })}
          {field("linkedinUrl", "Page LinkedIn", { type: "url", placeholder: "https://www.linkedin.com/company/…" })}
        </div>
        {field("sourceUrl", "Page où ces coordonnées ont été vérifiées", { type: "url", placeholder: "https://…" })}
      </fieldset>

      <div>
        <label htmlFor="notes" className={label}>Notes de suivi</label>
        <textarea id="notes" name="notes" rows={4} defaultValue={v("notes")} className={input} />
      </div>

      <button type="submit" disabled={pending} className="min-h-14 w-full rounded-full bg-leaf-600 px-6 text-base font-bold text-mist-50 disabled:opacity-60 sm:w-auto">
        {pending ? "Enregistrement…" : submitLabel}
      </button>
    </form>
  );
}
