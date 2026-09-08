"use client";

import { useEffect, useRef, useState } from "react";
// html2canvas plutôt que html-to-image : ce dernier clone le DOM dans un
// <foreignObject> SVG, une approche avec des lacunes documentées sur
// Safari/WebKit précisément pour ce que plusieurs retours réels ont signalé
// ici — text-shadow (glow "CIGIBM") et box-shadow (halo du cadre édition)
// absents du fichier téléchargé, photo parfois manquante. html2canvas
// dessine chaque élément directement sur un <canvas> via les primitives
// Canvas 2D natives (dont shadowBlur/shadowColor pour les deux types
// d'ombre), qui ne dépendent pas du rendu SVG du navigateur.
import html2canvas from "html2canvas";
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
// coin, une fois le rayon aplati par la classe .exporting ci-dessous. Cette
// constante avait été oubliée lors du rebranding vers le vert : elle servait
// alors de repli SILENCIEUX partout où le fond propre de `.badge` ne se
// rastérisait pas correctement (ex. le panneau .lower du Badge2, une zone
// plate sans rien au-dessus) — pas seulement aux quatre coins comme prévu à
// l'origine, ce qui masquait le fond vert par l'ancien vert quasi noir dans
// tout export réel.
const EXPORT_BACKGROUND = "#176813";

// html2canvas approxime la ligne de base de chaque police via une astuce DOM
// (un <span> de texte + une image 1x1 alignée en vertical-align:baseline,
// mesurés par offsetTop — voir FontMetrics.prototype.parseMetrics dans son
// bundle) plutôt que les vraies métriques de la police. Pour nos polices
// auto-hébergées (Bebas Neue, Dancing Script), cette approximation
// surestime nettement la distance haut-de-ligne -> ligne de base (jusqu'à
// ~28px pour Bebas Neue à 58px, vérifié en conditions réelles sur un
// moteur WebKit en comparant à measureText().fontBoundingBoxAscent) : le
// texte s'exporte visiblement plus bas qu'à l'écran — signalé en
// conditions réelles ("tout le contenu semble glisser vers le bas après
// téléchargement"). Impossible de corriger html2canvas lui-même (le code
// livré vient de node_modules, jamais déployé tel quel) : on reproduit ici
// son calcul pour en déduire l'excès, et on ne le compense QUE sur le
// clone qu'il construit pour l'export (voir onclone plus bas) — jamais sur
// la page réelle, qui reste inchangée.
function measureBaselineExcess(doc: Document, fontFamily: string, fontSize: string): number {
  const SAMPLE_TEXT = "Hidden Text";
  const container = doc.createElement("div");
  const img = doc.createElement("img");
  const span = doc.createElement("span");
  const body = doc.body;
  container.style.visibility = "hidden";
  container.style.fontFamily = fontFamily;
  container.style.fontSize = fontSize;
  container.style.margin = "0";
  container.style.padding = "0";
  container.style.whiteSpace = "nowrap";
  body.appendChild(container);
  img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  img.width = 1;
  img.height = 1;
  img.style.margin = "0";
  img.style.padding = "0";
  img.style.verticalAlign = "baseline";
  span.style.fontFamily = fontFamily;
  span.style.fontSize = fontSize;
  span.style.margin = "0";
  span.style.padding = "0";
  span.appendChild(doc.createTextNode(SAMPLE_TEXT));
  container.appendChild(span);
  container.appendChild(img);
  const html2canvasBaseline = img.offsetTop - span.offsetTop + 2;
  body.removeChild(container);

  let realAscent = 0;
  const canvas = doc.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.font = `normal normal 400 ${fontSize} ${fontFamily}`;
    realAscent = ctx.measureText(SAMPLE_TEXT).fontBoundingBoxAscent;
  }
  return Math.max(0, html2canvasBaseline - realAscent);
}

// Appliqué via l'option onclone de html2canvas : ne touche que le document
// cloné servant au rendu, jamais la page affichée à l'utilisateur. `top`
// (avec position:relative) plutôt que margin-top ou transform : ne change
// pas l'espace réservé dans le flux (pas de chevauchement avec la photo ou
// le bloc du dessus) et ne casse pas le transform:skewX() déjà posé sur
// .script/.jyserai via leur classe CSS.
function fixBaselineDrift(clonedDoc: Document) {
  const view = clonedDoc.defaultView;
  if (!view) return;
  clonedDoc.querySelectorAll<HTMLElement>("[data-baseline-nudge]").forEach((el) => {
    const style = view.getComputedStyle(el);
    // Garde-fou : `position: relative` écraserait un positionnement
    // absolute/fixed/sticky déjà posé pour autre chose (ex. .ribbon dans
    // Badge3, placé en coin par position:absolute + transform:rotate) —
    // un tel élément doit porter le nudge sur un <span> interne dédié,
    // pas directement lui-même. On l'ignore ici plutôt que de risquer de
    // casser sa mise en page.
    if (style.position !== "static") return;
    const excess = measureBaselineExcess(clonedDoc, style.fontFamily, style.fontSize);
    if (excess > 0) {
      el.style.position = "relative";
      el.style.top = `-${excess}px`;
    }
  });
}

export default function BadgeGenerator({ fullName, attendanceToken }: { fullName: string; attendanceToken: string }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  // Ratio largeur/hauteur intrinsèque de la photo — voir coverImageStyle.ts,
  // chaque gabarit en a besoin pour reproduire object-fit: cover lui-même
  // (ignoré par html2canvas à l'export).
  const [photoAspect, setPhotoAspect] = useState<number | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState(false);
  const [downloadingId, setDownloadingId] = useState<TemplateId | null>(null);
  const [errorId, setErrorId] = useState<TemplateId | null>(null);
  // Affiché tel quel sous le message d'échec : la seule fenêtre qu'on ait
  // sur une erreur réelle d'un visiteur est ce qu'il peut nous relire ou
  // capturer à l'écran — la console du navigateur ne nous est jamais
  // accessible à distance.
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  // Repli de dernier recours quand navigator.share() échoue pour une raison
  // qui n'est pas une annulation (ex. NotAllowedError constaté en conditions
  // réelles sur iPhone/Chrome iOS : l'« activation utilisateur » du clic
  // d'origine peut expirer pendant que html2canvas rend le canvas, avant
  // même l'appel à share()). <a download> n'est pas un filet de sécurité
  // fiable ici : WebKit (Safari ET Chrome iOS, même moteur) le fait parfois
  // échouer en silence, sans la moindre erreur mais sans rien enregistrer
  // non plus — pire qu'un échec visible. Afficher l'image directement sur
  // la page pour un enregistrement manuel (appui long) ne dépend d'aucune
  // API fragile : juste une image affichée et le geste natif de l'OS.
  const [manualSaveDataUrl, setManualSaveDataUrl] = useState<string | null>(null);
  // Fichier déjà rendu, en attente d'un second appui pour le partager.
  // navigator.share() a échoué de façon répétée en conditions réelles
  // (NotAllowedError) même après le correctif crossOrigin — cause la plus
  // probable : l'« activation utilisateur » du clic d'origine ne survit pas
  // aux passages de tâche internes à html2canvas pendant le rendu (pas
  // vraiment une question de lenteur absolue, WebKit peut la perdre même
  // sur un rendu rapide). Le seul contournement fiable : appeler share()
  // depuis un tap frais, sans le moindre await entre le clic et l'appel —
  // d'où ce second bouton, qui ne fait QUE ça.
  const [preparedShare, setPreparedShare] = useState<{ id: TemplateId; file: File } | null>(null);
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

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoReady(false);
    setPhotoError(false);
    // Un export déjà préparé (en attente de partage) ou l'aperçu de secours
    // affiché correspondent à l'ancienne photo — les garder périmerait ce
    // que l'utilisateur partagerait/enregistrerait ensuite sans le savoir.
    setPreparedShare(null);
    setManualSaveDataUrl(null);
    // Options bien plus généreuses que le défaut de compressPhoto (pensé
    // pour un upload serveur, limite de taille de requête oblige) : cette
    // photo ne quitte jamais le navigateur, tout se joue jusqu'au canvas
    // d'export. Signalé en conditions réelles : la photo perdait en
    // netteté après téléchargement quand cette fonction recompressait
    // agressivement une photo de téléphone typique (souvent > 1.5 Mo).
    const compressed = await compressPhoto(file, {
      maxUncompressedBytes: 8 * 1024 * 1024,
      maxDimension: 2800,
      jpegQuality: 0.92,
    });

    // data: plutôt que URL.createObjectURL() : un canvas qui dessine une
    // image issue d'une blob: URL peut se retrouver "tainted" sur iOS
    // Safari (particulièrement en navigation privée), ce qui fait échouer
    // canvas.toDataURL() avec SecurityError — constaté en conditions
    // réelles (téléchargement en échec, message générique, reproductible
    // sur trois gabarits différents partageant tous la même photo). Une
    // data: URI ne peut jamais tainter un canvas, quel que soit le
    // navigateur.
    const nextUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(compressed);
    });

    // toPng()/html2canvas rastérisent ce que le navigateur a déjà peint :
    // si le <img> n'a pas fini de décoder au moment du clic sur
    // Télécharger, cette zone du badge s'exporte vide. Constaté en
    // conditions réelles (photo manquante, pas systématique — course avec
    // le décodage asynchrone). On attend ici le décodage réel avant
    // d'activer le téléchargement.
    const preload = new Image();
    preload.src = nextUrl;
    try {
      await preload.decode();
      setPhotoAspect(preload.naturalWidth / preload.naturalHeight);
    } catch (err) {
      console.error("Photo decode failed", err);
      setPhotoError(true);
    }

    setPhotoUrl(nextUrl);
    setPhotoReady(true);
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
      // Mesure la boîte réellement peinte de `.badge` (border-box) et la
      // passe explicitement : le canvas exporté ne peut alors pas dépasser
      // ce que `.badge` peint, quelle que soit la mesure que html2canvas
      // aurait faite par défaut.
      const rect = badgeNode.getBoundingClientRect();
      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const canvas = await html2canvas(badgeNode, {
        width,
        height,
        // 4 -> 6 : nettement plus net (ex. 1920x2400 pour Certificat/
        // Poster, contre 1280x1600), suite à un retour signalant la photo
        // pas assez définie. Vérifié directement (canvas.toDataURL) qu'un
        // canvas réel de cette taille, et même bien au-delà (3840x4800),
        // s'exporte sans erreur sous un vrai moteur WebKit — donc pas une
        // histoire de plafond de l'API canvas. Reste un multiplicateur
        // bien plus élevé (un vrai "4K", ~9.6x ici) délibérément écarté :
        // la mémoire réellement disponible sur un appareil bas de gamme au
        // moment du rendu ne se laisse pas vérifier depuis ce poste, et un
        // échec de rendu serait pire qu'une image un peu moins définie —
        // précisément la fiabilité qui a posé problème jusqu'ici.
        scale: 6,
        backgroundColor: EXPORT_BACKGROUND,
        useCORS: true,
        onclone: fixBaselineDrift,
      });
      // WebP : sensiblement plus léger que PNG à qualité égale pour une
      // photo, utile vu la résolution relevée ci-dessus. Repli automatique
      // garanti par la spec (HTMLCanvasElement.toDataURL) : un navigateur
      // qui ne sait pas encoder en WebP renvoie silencieusement un PNG à la
      // place plutôt que d'échouer — on lit le type réellement obtenu
      // plutôt que de le supposer, pour nommer le fichier en conséquence.
      const dataUrl = canvas.toDataURL("image/webp", 0.92);
      const isWebp = dataUrl.startsWith("data:image/webp");
      const extension = isWebp ? "webp" : "png";
      const mimeType = isWebp ? "image/webp" : "image/png";
      const filename = `jy-serai-cigibm-2026-${filenameSlug}.${extension}`;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: mimeType });

      if (navigator.canShare?.({ files: [file] })) {
        // Ne PAS appeler share() ici : on vient de traverser plusieurs
        // await (html2canvas, fetch/blob), largement assez pour perdre
        // l'activation utilisateur sur WebKit. On prépare le fichier et on
        // attend un second tap dédié (confirmShare ci-dessous), qui
        // n'aura, lui, aucun await avant l'appel à share().
        setPreparedShare({ id, file });
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
      const name = err instanceof Error ? err.name : typeof err;
      const message = err instanceof Error ? err.message : String(err);
      setErrorDetail(`${name}: ${message}`);
    } finally {
      badgeNode.classList.remove(styles.exporting);
      setDownloadingId(null);
    }
  }

  // Déclenché par un second tap dédié (bouton "Partager"), sans le moindre
  // await avant l'appel à share() lui-même — voir le commentaire sur
  // preparedShare plus haut pour pourquoi ce découpage existe.
  async function confirmShare() {
    if (!preparedShare) return;
    const { file } = preparedShare;
    try {
      await navigator.share({ files: [file] });
    } catch (err) {
      // L'utilisateur a fermé la feuille de partage : ce n'est pas une
      // erreur, on ne remonte rien à l'écran et on ne tente rien d'autre.
      if ((err as { name?: string })?.name !== "AbortError") {
        console.error("Web Share failed, falling back to manual save", err);
        // Relit le fichier déjà rendu en data: URL pour l'aperçu de secours
        // — rapide (juste de la mémoire, pas un nouveau rendu) et sans
        // enjeu de timing, l'échec de share() a déjà eu lieu à ce stade.
        const reader = new FileReader();
        reader.onload = () => setManualSaveDataUrl(reader.result as string);
        reader.readAsDataURL(file);
      }
    } finally {
      setPreparedShare(null);
    }
  }

  const downloadHint = !qrDataUrl
    ? qrError
      ? "Le code QR n'a pas pu être généré. Rechargez la page pour réessayer."
      : "Préparation du code QR…"
    : !photoUrl
      ? "Ajoutez votre photo pour activer le téléchargement."
      : photoError
        ? "Cette photo n'a pas pu être chargée. Essayez-en une autre."
        : !photoReady
          ? "Préparation de votre photo…"
          : null;

  return (
    <div className="flex flex-col items-center gap-10">
      {manualSaveDataUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enregistrer votre badge"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-leaf-950/95 p-6"
        >
          <img
            src={manualSaveDataUrl}
            alt="Votre badge « J'y serai », prêt à enregistrer"
            className="max-h-[65vh] w-auto max-w-full rounded-2xl shadow-2xl"
          />
          <p className="max-w-xs text-center text-sm font-semibold text-mist-50">
            Le partage automatique n&apos;a pas fonctionné. Appuyez et maintenez sur l&apos;image ci-dessus, choisissez « Ajouter aux photos », puis partagez-la depuis votre galerie.
          </p>
          <button
            type="button"
            onClick={() => setManualSaveDataUrl(null)}
            className="rounded-full border border-mist-50/25 px-6 py-2.5 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10"
          >
            Fermer
          </button>
        </div>
      )}

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
              <Component photoUrl={photoUrl} name={fullName} qrDataUrl={qrDataUrl} photoAspect={photoAspect} />
            </div>
            {preparedShare?.id === id ? (
              // Bouton distinct (rempli, pas juste contouré) : un second tap
              // qu'on ne demanderait pas si le premier avait suffi — voir
              // confirmShare plus haut. Se déclenche ici, sans le moindre
              // await avant l'appel à share() dans confirmShare lui-même.
              <button
                type="button"
                onClick={confirmShare}
                className="animate-pulse rounded-full bg-leaf-500 px-6 py-2.5 text-sm font-semibold text-leaf-950 transition-colors hover:bg-leaf-400"
              >
                Partager / Enregistrer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleDownload(id, file)}
                disabled={!photoUrl || !photoReady || photoError || !qrDataUrl || downloadingId !== null}
                className="rounded-full border border-mist-50/25 px-6 py-2.5 text-sm font-semibold text-mist-50 transition-colors hover:bg-mist-50/10 disabled:pointer-events-none disabled:opacity-40"
              >
                {downloadingId === id ? "Préparation…" : "Télécharger"}
              </button>
            )}
            {errorId === id && (
              <div aria-live="assertive" className="max-w-[260px] text-center text-xs text-red-300">
                <p>Le téléchargement a échoué. Réessayez.</p>
                {errorDetail && <p className="mt-1 break-words text-red-300/70">{errorDetail}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
