"use client";

import { useState } from "react";
import { sendBadgeLinkAction } from "./actions";

// En dur plutôt que window.location.origin, comme OFFICIAL_URL dans
// AlreadyRegisteredNotice.tsx : ce lien part vers WhatsApp/SMS, il doit
// toujours pointer le domaine public même si l'admin travaille depuis une
// preview Vercel.
const SITE_URL = "https://ongtriomphedelinterieur.com";

type SendState = "idle" | "sending" | "sent" | "error";

export default function ParticipantActions({
  participantId,
  attendanceToken,
  hasEmail,
}: {
  participantId: string;
  attendanceToken: string;
  hasEmail: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [sendState, setSendState] = useState<SendState>("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  const badgeUrl = `${SITE_URL}/cigibm-2026/badge/${attendanceToken}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(badgeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Rien à afficher : sur un navigateur sans API Clipboard (contexte non
      // sécurisé, permission refusée), l'admin peut toujours copier le lien
      // à la main depuis /admin/participants ouvert en HTTPS normal.
    }
  }

  async function sendEmail() {
    setSendState("sending");
    setSendError(null);
    const result = await sendBadgeLinkAction(participantId);
    if (result.ok) {
      setSendState("sent");
    } else {
      setSendState("error");
      setSendError(result.error);
    }
    setTimeout(() => {
      setSendState("idle");
      setSendError(null);
    }, 3000);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={copyLink}
        title="Copier le lien du badge « J'y serai »"
        className="flex h-9 items-center gap-1.5 rounded-lg border border-ink/15 px-3 text-xs font-medium text-ink/70 transition-colors hover:bg-ink/5 active:bg-ink/10"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="h-4 w-4 shrink-0">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
        {copied ? "Copié !" : "Copier"}
      </button>

      <button
        type="button"
        onClick={sendEmail}
        disabled={!hasEmail || sendState === "sending"}
        title={hasEmail ? "Envoyer le badge par email" : "Aucun email enregistré pour ce participant"}
        className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
          sendState === "sent"
            ? "border-leaf-300 bg-leaf-50 text-leaf-700"
            : sendState === "error"
              ? "border-red-300 bg-red-50 text-red-600"
              : "border-ink/15 text-ink/70 hover:bg-ink/5 active:bg-ink/10"
        }`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden className="h-4 w-4 shrink-0">
          <path d="m3 6 8.5 6L20 6" />
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
        {sendState === "sending" ? "Envoi…" : sendState === "sent" ? "Envoyé !" : sendState === "error" ? "Échec" : "Envoyer"}
      </button>
      {sendError && <p className="w-full text-xs text-red-600">{sendError}</p>}
    </div>
  );
}
