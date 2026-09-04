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
        <p className={styles.motto}>{cigibm.nextEdition.theme}</p>
        <div className={styles.photoGlow}>
          <div className={styles.photoFrame}>
            <div className={styles.photoBox}>
              {photoUrl && <img src={photoUrl} alt="" className={styles.photoImg} />}
            </div>
          </div>
        </div>
        <div className={styles.panelBottom}>
          <p className={styles.script}>J&apos;y serai</p>
          <p className={styles.name}>{name}</p>
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
    </div>
  );
}
