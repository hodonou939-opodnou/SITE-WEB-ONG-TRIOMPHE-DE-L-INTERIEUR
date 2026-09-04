import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge2.module.css";

export default function Badge2({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.photoFull}>
        {photoUrl && <img src={photoUrl} alt="" className={styles.photoImg} />}
      </div>
      <div className={styles.topRow}>
        <span className={styles.brand}>CIGIBM</span>
        <div className={styles.seal}>
          <span className={styles.sealNum}>4e</span>
          <span className={styles.sealLbl}>Édition</span>
        </div>
      </div>
      <div className={styles.lower}>
        <p className={styles.jyserai}>
          J&apos;Y
          <br />
          SERAI
        </p>
        <span className={styles.themeBlock}>{cigibm.nextEdition.theme}</span>
        <p className={styles.nameTag}>{name.toUpperCase()}</p>
        <div className={styles.footerRow}>
          <div className={styles.details}>
            <span className={styles.date}>{cigibm.nextEdition.dates}</span>
            <span className={styles.venue}>{cigibm.nextEdition.venue}</span>
          </div>
          <div className={styles.qrCard}>
            {qrDataUrl && <img src={qrDataUrl} alt="Code QR" className={styles.qrImg} />}
          </div>
        </div>
      </div>
    </div>
  );
}
