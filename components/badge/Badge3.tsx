import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge3.module.css";

export default function Badge3({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.ribbon}>ÉDITION 4</div>
      <p className={styles.masthead}>ONG Triomphe de l&apos;Intérieur</p>
      <p className={styles.neon}>CIGIBM</p>
      <p className={styles.motto} data-baseline-nudge="">
        {cigibm.nextEdition.theme}
      </p>
      <div className={styles.photoGlow}>
        <div className={styles.photoFrame}>
          <div className={styles.photoBox}>
            {/* <img> + repro manuelle d'object-fit: cover — voir
                Badge1.tsx pour le détail. */}
            {photoUrl && <img src={photoUrl} alt="" crossOrigin="anonymous" className={styles.photoImg} />}
          </div>
        </div>
      </div>
      <p className={styles.script} data-baseline-nudge="">
        J&apos;y serai
      </p>
      <div className={styles.footerRow}>
        <div className={styles.qrCard}>
          {qrDataUrl && <img src={qrDataUrl} alt="Code QR" crossOrigin="anonymous" className={styles.qrImg} />}
        </div>
        <div className={styles.details}>
          <span className={styles.nameTag}>{name.toUpperCase()}</span>
          <span className={styles.date}>{cigibm.nextEdition.dates}</span>
          <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
        </div>
      </div>
    </div>
  );
}
