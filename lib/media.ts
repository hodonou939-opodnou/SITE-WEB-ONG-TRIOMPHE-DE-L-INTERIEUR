// Détection automatique des visuels déposés dans public/images.
// Ces fonctions ne s'exécutent que côté serveur (composants serveur / layout).

import fs from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];

function imagesDir(...segments: string[]) {
  return path.join(process.cwd(), "public", "images", ...segments);
}

/** Renvoie le chemin public de public/images/{name}.* s'il existe, sinon null. */
export function getNamedImage(name: string): string | null {
  // Scope volontairement restreint à public/images : accès bon marché, sans
  // risque, mais l'analyse statique de Turbopack ne peut pas le déduire d'un
  // chemin dynamique — on l'exempte donc explicitement du tracing du build.
  const dir = imagesDir();
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return null;
  for (const ext of IMAGE_EXTENSIONS) {
    const file = `${name}${ext}`;
    const filePath = path.join(/*turbopackIgnore: true*/ dir, file);
    if (fs.existsSync(/*turbopackIgnore: true*/ filePath)) return `/images/${file}`;
  }
  return null;
}

/** Renvoie le chemin public du logo (public/images/logo.*) s'il existe, sinon null. */
export function getLogoSrc(): string | null {
  return getNamedImage("logo");
}

/** Renvoie tous les chemins publics des images d'un sous-dossier (ex. "cigibm"). */
export function getGalleryImages(subdir: string): string[] {
  const dir = imagesDir(subdir);
  if (!fs.existsSync(/*turbopackIgnore: true*/ dir)) return [];
  return fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => IMAGE_EXTENSIONS.includes(path.extname(f).toLowerCase()))
    .sort()
    .map((f) => `/images/${subdir}/${f}`);
}
