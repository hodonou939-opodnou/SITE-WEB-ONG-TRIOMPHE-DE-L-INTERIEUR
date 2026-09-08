import type { CSSProperties } from "react";

// Repro manuelle d'object-fit: cover, PAS object-fit lui-même ni
// background-image — voir le commentaire sur .photoImg dans
// Badge1.module.css pour le pourquoi (les deux échouent en conditions
// réelles à l'export html2canvas : l'un étire la photo, l'autre la
// rastérise en basse résolution).
//
// Une première version utilisait `min-width/min-height: 100%` + `width/
// height: auto` simultanés sur un <img> en position absolue — la technique
// CSS "cover" classique pré-object-fit. Vérifié en conditions réelles
// (mesure directe de getBoundingClientRect ET du calcul interne de
// html2canvas, qui concordaient) : pour un <img> positionné en absolu, ces
// deux min- combinés ne contraignent PAS la taille rendue, qui reste celle,
// intrinsèque, de l'image — sans rapport avec le cadre. Résultat : la photo
// entière (souvent bien plus grande que le cadre) se dessine centrée puis
// recadrée par overflow:hidden, ce qui zoome énormément sur un minuscule
// fragment du centre — exactement le symptôme signalé ("photo zoomée à
// l'extrême, on ne reconnaît plus rien").
//
// Cette version calcule donc explicitement, en JS, quel côté (largeur OU
// hauteur) doit valoir 100% du cadre — UNE seule dimension explicite,
// l'autre restant "auto" (dérivée du ratio intrinsèque par le navigateur,
// un calcul basique et fiable, sans l'ambiguïté du double min- ci-dessus).
export function coverImageStyle(photoAspect: number | null, frameAspect: number, biasYPercent = 50): CSSProperties {
  // Ratio inconnu (photo pas encore décodée) : jouer la sécurité en
  // couvrant par la hauteur, un choix arbitraire mais sans conséquence,
  // {photoUrl && ...} ne rendant de toute façon rien tant que la photo
  // n'est pas prête.
  const coverByHeight = photoAspect === null || photoAspect >= frameAspect;
  if (coverByHeight) {
    // La photo est relativement plus large que le cadre : la hauteur suffit
    // à couvrir, aucun débordement vertical à recadrer — un biais Y n'aurait
    // ici aucun sens (il décalerait une image qui remplit déjà exactement,
    // révélant un vide d'un côté). Centrage neutre.
    return {
      position: "absolute",
      top: "50%",
      left: "50%",
      height: "100%",
      width: "auto",
      maxWidth: "none",
      transform: "translate(-50%, -50%)",
    };
  }
  // La photo est relativement plus haute (ou de même ratio) que le cadre :
  // la largeur suffit à couvrir, le débordement vertical est là où le biais
  // Y (ex. 8% pour privilégier le haut d'un portrait) prend son sens.
  return {
    position: "absolute",
    top: `${biasYPercent}%`,
    left: "50%",
    width: "100%",
    height: "auto",
    maxHeight: "none",
    transform: `translate(-50%, -${biasYPercent}%)`,
  };
}
