import { cigibm } from "@/lib/content";
import styles from "./Badge1.module.css";

export type BadgeTemplateProps = {
  photoUrl: string | null;
  name: string;
  qrDataUrl: string | null;
};

export default function Badge1({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
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
              {/* <img> + repro manuelle d'object-fit: cover en CSS (voir
                  .photoImg dans Badge1.module.css), ni object-fit (ignoré
                  par html2canvas, photo étirée) ni background-image (passe
                  par createPattern, rastérisé à la taille CSS avant le
                  scale:3 de l'export, photo visiblement floue) — les deux
                  constatés en conditions réelles. */}
              {photoUrl && <img src={photoUrl} alt="" crossOrigin="anonymous" className={styles.photoImg} />}
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
