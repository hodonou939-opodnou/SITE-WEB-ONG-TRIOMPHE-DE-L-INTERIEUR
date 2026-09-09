"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ComposeForm() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  // "badge-link" force le canal email (ce gabarit n'existe pas en SMS) et
  // se passe du champ Message libre : buildBadgeReminderEmail compose son
  // propre sujet + lien de badge personnel à chaque destinataire, voir
  // /api/admin/messages/send.
  const [template, setTemplate] = useState<"custom" | "badge-link">("custom");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/admin/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          template,
          channel: template === "badge-link" ? "email" : form.get("channel"),
          editionNumber: Number(form.get("editionNumber")),
          onlyNonAttendees: form.get("onlyNonAttendees") === "on",
          message: form.get("message"),
          batchLabel: form.get("batchLabel"),
        }),
      });

      if (!res.ok) {
        const errorJson = await res.json().catch(() => null);
        setResult(errorJson?.error ?? "L'envoi a échoué. Merci de réessayer.");
        return;
      }

      const json = await res.json();
      setResult(`Envoyé à ${json.sentCount} / ${json.totalRecipients} destinataires.`);
      router.refresh();
    } catch {
      setResult("L'envoi a échoué : connexion interrompue ou session expirée. Merci de réessayer.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Modèle</label>
        <select
          value={template}
          onChange={(e) => setTemplate(e.target.value as "custom" | "badge-link")}
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
        >
          <option value="custom">Message libre</option>
          <option value="badge-link">Lien du badge « J&apos;y serai » (email, branded)</option>
        </select>
        {template === "badge-link" && (
          <p className="mt-1.5 text-xs text-ink/60">
            Email uniquement. Chaque destinataire reçoit son propre lien de badge, dans le gabarit de marque déjà
            utilisé pour les renvois individuels.
          </p>
        )}
      </div>
      {template === "custom" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Canal</label>
          <select name="channel" defaultValue="email" className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm">
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="whatsapp" disabled>WhatsApp (non configuré)</option>
          </select>
        </div>
      )}
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Édition</label>
        <select name="editionNumber" defaultValue="4" className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm">
          <option value="4">Édition 4</option>
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="onlyNonAttendees" />
        Uniquement les personnes non présentes
      </label>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Nom de l&apos;envoi</label>
        <input
          name="batchLabel"
          required
          className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm"
          placeholder={template === "badge-link" ? "Envoi du lien de badge" : "Rappel CIGIBM 2026"}
        />
      </div>
      {template === "custom" && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Message</label>
          <textarea name="message" required rows={5} className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm" />
        </div>
      )}
      <button type="submit" disabled={sending} className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 disabled:opacity-60">
        {sending ? "Envoi..." : "Envoyer"}
      </button>
      {result && <p className="text-sm text-ink/70">{result}</p>}
    </form>
  );
}
