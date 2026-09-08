import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import styles from "./Badge2.module.css";

export default function Badge2({ photoUrl, name, qrDataUrl }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      <div className={styles.photoFull}>
        {/* background-image plutôt que <img object-fit:cover> : html2canvas
            n'implémente object-fit/object-position pour aucun <img> (aucune
            trace dans son bundle, confirmé) — il dessine toujours l'image
            source entière étirée dans la boîte de destination, quel que
            soit son ratio, ce qui déformait toute photo dont le ratio ne
            correspondait pas exactement au cadre (constaté en conditions
            réelles : « la photo semble étirée »). background-size: cover
            recadre correctement, y compris à l'export — même mécanisme
            que le filigrane de Badge1.module.css, déjà vérifié. */}
        {photoUrl && <div className={styles.photoImg} style={{ backgroundImage: `url(${photoUrl})` }} />}
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
            {qrDataUrl && <img src={qrDataUrl} alt="Code QR" crossOrigin="anonymous" className={styles.qrImg} />}
          </div>
        </div>
      </div>
    </div>
  );
}
