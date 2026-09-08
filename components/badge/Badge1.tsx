import { cigibm } from "@/lib/content";
import { coverImageStyle } from "./coverImageStyle";
import styles from "./Badge1.module.css";

export type BadgeTemplateProps = {
  photoUrl: string | null;
  name: string;
  qrDataUrl: string | null;
  // Ratio largeur/hauteur intrinsèque de la photo, connu dès son décodage
  // (voir handlePhotoChange dans BadgeGenerator.tsx) — permet à chaque
  // gabarit de reproduire object-fit: cover sans jamais s'en remettre à
  // object-fit lui-même (ignoré par html2canvas) ni à background-image
  // (rastérisé en basse résolution par html2canvas). Voir coverImageStyle.ts.
  photoAspect: number | null;
};

// Cadre carré (1:1) : voir .photoGlow dans Badge1.module.css (182px x 182px).
const FRAME_ASPECT = 1;

export default function Badge1({ photoUrl, name, qrDataUrl, photoAspect }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.watermarkFull} />
      <div className={styles.overlay} />
      <div className={styles.sheen} />
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <p className={styles.masthead}>
            ONG Triomphe de l&apos;Intérieur <span className={styles.cigibm}>· CIGIBM</span>
          </p>
          <div className={styles.seal}>
            <span className={styles.sealNum}>
              4<span className={styles.sealOrd}>e</span>
            </span>
            <span className={styles.sealLbl}>Édition</span>
          </div>
        </div>
        <p className={styles.motto} data-baseline-nudge="">
          {cigibm.nextEdition.theme}
        </p>
        <div className={styles.photoGlow}>
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              {/* Voir coverImageStyle.ts pour le détail complet (ni
                  object-fit ni background-image ne survivent
                  correctement à l'export réel). */}
              {photoUrl && (
                <img src={photoUrl} alt="" crossOrigin="anonymous" style={coverImageStyle(photoAspect, FRAME_ASPECT)} />
              )}
            </div>
          </div>
        </div>
        <div className={styles.panelBottom}>
          <p className={styles.script} data-baseline-nudge="">
            J&apos;y serai
          </p>
          <div className={styles.footerRow}>
            <div className={styles.details}>
              <span className={styles.name}>{name}</span>
              <span className={styles.date}>{cigibm.nextEdition.dates}</span>
              <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
            </div>
            <div className={styles.qrCard}>
              {qrDataUrl && <img src={qrDataUrl} alt="Code QR" crossOrigin="anonymous" className={styles.qrImg} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
