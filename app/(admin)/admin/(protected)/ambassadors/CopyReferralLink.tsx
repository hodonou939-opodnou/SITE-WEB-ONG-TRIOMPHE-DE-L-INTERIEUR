"use client";

import { useState } from "react";

export default function CopyReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-full border border-leaf-600 px-3 py-1 text-xs font-semibold text-leaf-700 transition-colors hover:bg-leaf-50"
    >
      {copied ? "Copié !" : "Copier le lien"}
    </button>
  );
}
