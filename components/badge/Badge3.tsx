import { cigibm } from "@/lib/content";
import type { BadgeTemplateProps } from "./Badge1";
import { coverImageStyle } from "./coverImageStyle";
import styles from "./Badge3.module.css";

// Cadre carré (1:1) : voir .photoFrame dans Badge3.module.css (168px x 168px).
const FRAME_ASPECT = 1;
// Biais vers le haut (8%, pas 50%) : même valeur que Badge2 (voir son
// commentaire) — un centrage neutre rognait le haut de la tête.
const BIAS_Y = 8;

export default function Badge3({ photoUrl, name, qrDataUrl, photoAspect }: BadgeTemplateProps) {
  return (
    <div className={styles.badge}>
      {/* Le nudge va sur un <span> interne, jamais sur .ribbon lui-même :
          .ribbon porte déjà position:absolute + transform:rotate(40deg)
          pour son placement en coin — fixBaselineDrift écraserait cette
          position en position:relative (voir son commentaire). */}
      <div className={styles.ribbon}>
        <span data-baseline-nudge="">ÉDITION 4</span>
      </div>
      <p className={styles.masthead}>ONG Triomphe de l&apos;Intérieur</p>
      <p className={styles.neon}>CIGIBM</p>
      <p className={styles.motto} data-baseline-nudge="">
        {cigibm.nextEdition.theme}
      </p>
      <div className={styles.photoGlow}>
        <div className={styles.photoFrame}>
          <div className={styles.photoBox}>
            {/* Voir coverImageStyle.ts pour le détail complet. */}
            {photoUrl && <img src={photoUrl} alt="" crossOrigin="anonymous" style={coverImageStyle(photoAspect, FRAME_ASPECT, BIAS_Y)} />}
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
