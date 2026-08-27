"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ComposeForm() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setResult(null);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/admin/messages/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: form.get("channel"),
        editionNumber: Number(form.get("editionNumber")),
        onlyNonAttendees: form.get("onlyNonAttendees") === "on",
        message: form.get("message"),
        batchLabel: form.get("batchLabel"),
      }),
    });

    const json = await res.json();
    setSending(false);
    setResult(`Envoyé à ${json.sentCount} / ${json.totalRecipients} destinataires.`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Canal</label>
        <select name="channel" defaultValue="email" className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm">
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="whatsapp" disabled>WhatsApp (non configuré)</option>
        </select>
      </div>
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
        <input name="batchLabel" required className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm" placeholder="Rappel CIGIBM 2026" />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink/60">Message</label>
        <textarea name="message" required rows={5} className="w-full rounded-xl border border-ink/15 bg-mist-50 px-4 py-3 text-sm" />
      </div>
      <button type="submit" disabled={sending} className="rounded-full bg-leaf-600 px-6 py-3 text-sm font-semibold text-mist-50 disabled:opacity-60">
        {sending ? "Envoi..." : "Envoyer"}
      </button>
      {result && <p className="text-sm text-ink/70">{result}</p>}
    </form>
  );
}
