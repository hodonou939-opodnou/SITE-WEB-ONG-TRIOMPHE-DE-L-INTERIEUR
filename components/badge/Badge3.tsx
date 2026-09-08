import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge3.module.css";

export default function Badge3({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.ribbon}>ÉDITION 4</div>
      <p className={styles.masthead}>ONG Triomphe de l&apos;Intérieur</p>
      <p className={styles.neon}>CIGIBM</p>
      <p className={styles.motto}>{cigibm.nextEdition.theme}</p>
      <div className={styles.photoGlow}>
        <div className={styles.photoFrame}>
          <div className={styles.photoBox}>
            {/* background-image plutôt que <img object-fit:cover> : voir
                Badge2.tsx — html2canvas étire toujours l'image source
                entière dans la boîte, ignorant object-fit/object-position. */}
            {photoUrl && <div className={styles.photoImg} style={{ backgroundImage: `url(${photoUrl})` }} />}
          </div>
        </div>
      </div>
      <p className={styles.script}>J&apos;y serai</p>
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
