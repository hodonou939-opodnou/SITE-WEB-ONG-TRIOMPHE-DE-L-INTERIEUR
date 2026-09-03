// Détection automatique des visuels déposés dans public/images, résolue au
// moment du build plutôt qu'à la requête.
//
// scripts/generate-media-manifest.mjs scanne public/images/ et écrit
// media-manifest.generated.json ; predev/prebuild (package.json) le
// régénèrent avant chaque next dev / next build. L'ancienne implémentation
// appelait fs.existsSync()/fs.readdirSync() directement depuis une route
// serveur Vercel — @vercel/nft ne peut pas déduire d'un chemin fs
// dynamique (`${name}${ext}`) quels fichiers inclure dans le bundle de la
// fonction serverless, ce qui faisait retomber l'affiche CIGIBM (et
// potentiellement toute autre image nommée) sur ImagePlaceholder de façon
// intermittente en production, selon l'instance serverless traitant la
// requête — alors que le fichier était bien présent et servi correctement
// en tant qu'asset statique. Un import JSON statique, contrairement à un
// chemin fs dynamique, est correctement tracé et embarqué par le bundler :
// plus aucun accès fs au moment de la requête.
import manifest from "./media-manifest.generated.json";

const namedImages: Record<string, string> = manifest.named;
const galleries: Record<string, string[]> = manifest.galleries;

/** Renvoie le chemin public de public/images/{name}.* s'il existe, sinon null. */
export function getNamedImage(name: string): string | null {
  return namedImages[name] ?? null;
}

/** Renvoie le chemin public du logo (public/images/logo.*) s'il existe, sinon null. */
export function getLogoSrc(): string | null {
  return getNamedImage("logo");
}

/** Renvoie tous les chemins publics des images d'un sous-dossier (ex. "cigibm"). */
export function getGalleryImages(subdir: string): string[] {
  return galleries[subdir] ?? [];
}
