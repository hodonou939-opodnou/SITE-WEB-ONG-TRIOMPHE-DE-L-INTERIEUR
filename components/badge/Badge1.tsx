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
              {/* background-image plutôt que <img object-fit:cover> : voir
                  Badge2.tsx — html2canvas étire toujours l'image source
                  entière dans la boîte de destination, ignorant
                  object-fit/object-position (aucune trace de leur gestion
                  dans son bundle), déformant toute photo dont le ratio ne
                  correspond pas exactement au cadre. background-size: cover
                  recadre correctement, y compris à l'export. */}
              {photoUrl && <div className={styles.photoImg} style={{ backgroundImage: `url(${photoUrl})` }} />}
            </div>
          </div>
        </div>
        <div className={styles.panelBottom}>
          <p className={styles.script}>J&apos;y serai</p>
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
