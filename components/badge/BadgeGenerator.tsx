"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { compressPhoto } from "@/lib/client/compressImage";
import { generateQrDataUrl } from "@/lib/qr";
import Badge1 from "./Badge1";
import Badge2 from "./Badge2";
import Badge3 from "./Badge3";

const TEMPLATES = [
  { id: 1, label: "Certificat", Component: Badge1 },
  { id: 2, label: "Affiche TV", Component: Badge2 },
  { id: 3, label: "Poster", Component: Badge3 },
] as const;

export default function BadgeGenerator({ fullName, attendanceToken }: { fullName: string; attendanceToken: string }) {
  const [templateId, setTemplateId] = useState<(typeof TEMPLATES)[number]["id"]>(1);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    generateQrDataUrl(attendanceToken).then(setQrDataUrl);
  }, [attendanceToken]);

  // Revoke the previous object URL whenever the photo changes or the
  // component unmounts, so we don't leak blob: URLs as visitors try
  // multiple photos before downloading.
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    };
  }, [photoUrl]);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressPhoto(file);
    setPhotoUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(compressed);
    });
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "jy-serai-cigibm-2026.png";
      link.click();
    } finally {
      setDownloading(false);
    }
  }

  const ActiveTemplate = TEMPLATES.find((t) => t.id === templateId)!.Component;

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTemplateId(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              t.id === templateId ? "bg-leaf-500 text-leaf-950" : "bg-mist-50/10 text-mist-50/70 hover:bg-mist-50/20"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div ref={cardRef}>
        <ActiveTemplate photoUrl={photoUrl} name={fullName} qrDataUrl={qrDataUrl} />
      </div>

      <label className="cursor-pointer rounded-full border border-mist-50/25 px-6 py-3 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10">
        {photoUrl ? "Changer la photo" : "Ajouter ma photo"}
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </label>

      <button
        type="button"
        onClick={handleDownload}
        disabled={!photoUrl || downloading}
        className="rounded-full bg-leaf-500 px-8 py-3.5 text-sm font-semibold text-leaf-950 transition-opacity disabled:opacity-40"
      >
        {downloading ? "Préparation…" : "Télécharger mon badge"}
      </button>
    </div>
  );
}
