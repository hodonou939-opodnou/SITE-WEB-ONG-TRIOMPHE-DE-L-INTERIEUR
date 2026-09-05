"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { compressPhoto } from "@/lib/client/compressImage";
import { generateQrDataUrl } from "@/lib/qr";
import Badge1 from "./Badge1";
import Badge2 from "./Badge2";
import Badge3 from "./Badge3";
import styles from "./BadgeGenerator.module.css";

const TEMPLATES = [
  { id: 1, label: "Certificat", file: "certificat", Component: Badge1 },
  { id: 2, label: "Affiche TV", file: "affiche-tv", Component: Badge2 },
  { id: 3, label: "Poster", file: "poster", Component: Badge3 },
] as const;

type TemplateId = (typeof TEMPLATES)[number]["id"];

// Le fond des trois gabarits (voir `.badge` dans Badge1/2/3.module.css) —
// filet de sécurité passé à toPng pour les pixels d'anticrénelage en bord de
// coin, une fois le rayon aplati par la classe .exporting ci-dessous.
const EXPORT_BACKGROUND = "#0e2118";

export default function BadgeGenerator({ fullName, attendanceToken }: { fullName: string; attendanceToken: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<TemplateId | null>(null);
  const [errorId, setErrorId] = useState<TemplateId | null>(null);
  const cardRefs = useRef<Partial<Record<TemplateId, HTMLDivElement | null>>>({});

  useEffect(() => {
    let cancelled = false;
    generateQrDataUrl(attendanceToken)
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch((err) => {
        // Un badge sans QR a l'air normal mais est inscannable à l'entrée :
        // on bloque le téléchargement plutôt que de laisser passer un badge
        // muet (voir le rendu conditionnel plus bas).
        console.error("QR code generation failed", err);
        if (!cancelled) setQrError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [attendanceToken]);

  // Révoque l'URL objet précédente à chaque changement de photo et au
  // démontage, pour ne pas fuiter des blob: URLs si le visiteur essaie
  // plusieurs photos avant de télécharger.
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

  async function handleDownload(id: TemplateId, filenameSlug: string) {
    const wrapper = cardRefs.current[id];
    if (!wrapper) return;
    // On capture `.badge` lui-même — premier et unique enfant du wrapper —
    // plutôt que le wrapper : ce dernier n'a ni bordure ni fond propres, donc
    // le capturer directement écarte toute possibilité qu'un espace introduit
    // par le wrapper (arrondi de flex, futur changement de mise en page…)
    // agrandisse la boîte capturée au-delà de ce que `.badge` peint réellement.
    const badgeNode = wrapper.firstElementChild as HTMLElement | null;
    if (!badgeNode) return;
    // Exclusif : un seul export à la fois. Le navigateur refuse de toute
    // façon un second navigator.share() concurrent (InvalidStateError), donc
    // on empêche l'état plutôt que d'essayer de s'en remettre après coup —
    // voir le disabled des boutons plus bas, qui bloque les deux autres tant
    // que celui-ci tourne.
    if (downloadingId !== null) return;

    setErrorId(null);
    setDownloadingId(id);
    // Aplatit les coins arrondis le temps de la capture : les quatre coins de
    // `.badge` (border-radius: 18px) tombent hors de la zone peinte et
    // s'exportent transparents, que les viewers compositent ensuite sur du
    // blanc. Retiré dans le `finally`, même si toPng lève une exception. La
    // classe s'applique ici directement sur `.badge` (la cible de capture),
    // pas sur le wrapper : voir `.exporting` dans BadgeGenerator.module.css.
    badgeNode.classList.add(styles.exporting);
    try {
      // Mesure la boîte réellement peinte de `.badge` (border-box ; le
      // box-shadow n'entre jamais dans getBoundingClientRect) et la passe
      // explicitement à toPng : le canvas exporté ne peut alors pas dépasser
      // ce que `.badge` peint, quelle que soit la mesure que toPng aurait
      // faite par défaut.
      const rect = badgeNode.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const dataUrl = await toPng(badgeNode, {
        width,
        height,
        pixelRatio: 3,
        backgroundColor: EXPORT_BACKGROUND,
      });
      const filename = `jy-serai-cigibm-2026-${filenameSlug}.png`;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          // L'utilisateur a fermé la feuille de partage : ce n'est pas une
          // erreur, on ne remonte rien à l'écran.
          if ((err as { name?: string })?.name !== "AbortError") throw err;
        }
        return;
      }

      // Repli desktop : <a download> ne fonctionne pas sur iOS Safari, mais
      // reste la voie la plus simple là où le partage de fichiers n'existe
      // pas (Web Share API absente ou sans support des fichiers).
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.click();
      // Révoquer tout de suite après click() coupe l'URL avant que certains
      // navigateurs n'aient commencé à lire le blob : le téléchargement
      // échoue silencieusement. On laisse le click() être consommé d'abord.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (err) {
      console.error("Badge export failed", err);
      setErrorId(id);
    } finally {
      badgeNode.classList.remove(styles.exporting);
      setDownloadingId(null);
    }
  }

  const downloadHint = !qrDataUrl
    ? qrError
      ? "Le code QR n'a pas pu être généré. Rechargez la page pour réessayer."
      : "Préparation du code QR…"
    : !photoUrl
      ? "Ajoutez votre photo pour activer le téléchargement."
      : null;

  return (
    <div className="flex flex-col items-center gap-10">
      <label className={styles.uploadCta}>
        <span className={styles.ctaScript}>J&apos;y serai</span>
        <span className={styles.ctaLabel}>{photoUrl ? "Changer ma photo" : "Ajoutez votre photo"}</span>
        <input type="file" accept="image/*" onChange={handlePhotoChange} className="sr-only" />
      </label>
      {downloadHint && (
        <p aria-live="polite" className="max-w-[260px] text-center text-xs text-mist-100/60">
          {downloadHint}
        </p>
      )}

      <div className="flex w-full flex-col items-center gap-12">
        {TEMPLATES.map(({ id, label, file, Component }) => (
          <div key={id} className="flex w-full flex-col items-center gap-3">
            <p className="text-sm text-mist-100/70">{label}</p>
            <div
              ref={(node) => {
                cardRefs.current[id] = node;
              }}
            >
              <Component photoUrl={photoUrl} name={fullName} qrDataUrl={qrDataUrl} />
            </div>
            <button
              type="button"
              onClick={() => handleDownload(id, file)}
              disabled={!photoUrl || !qrDataUrl || downloadingId !== null}
              className="rounded-full border border-mist-50/25 px-6 py-2.5 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10 disabled:pointer-events-none disabled:opacity-40"
            >
              {downloadingId === id ? "Préparation…" : "Télécharger"}
            </button>
            {errorId === id && (
              <p aria-live="assertive" className="max-w-[260px] text-center text-xs text-red-300">
                Le téléchargement a échoué. Réessayez.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
