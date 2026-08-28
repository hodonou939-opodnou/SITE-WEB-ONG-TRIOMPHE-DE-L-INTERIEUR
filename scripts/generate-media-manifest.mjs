// Scanne public/images/ et écrit lib/media-manifest.generated.json.
//
// lib/media.ts lisait auparavant public/images/ via fs.existsSync() /
// fs.readdirSync() directement au moment de la requête, dans une route
// serveur Vercel. Problème constaté en production : le traceur de fichiers
// de Vercel (@vercel/nft) ne peut pas déduire d'un chemin fs dynamique
// (`${name}${ext}`) quels fichiers sous public/images/ inclure dans le
// bundle de la fonction serverless — l'affiche CIGIBM (et potentiellement
// toute autre image nommée) retombait donc de façon intermittente sur
// ImagePlaceholder selon l'instance serverless qui traitait la requête,
// alors que le fichier était bien présent et servi correctement en tant
// qu'asset statique. Générer ce manifeste au moment du build (où le
// système de fichiers est garanti complet) et l'importer statiquement
// depuis lib/media.ts élimine tout accès fs au moment de la requête —
// l'import statique, contrairement à un chemin fs dynamique, est
// correctement tracé et embarqué par le bundler.
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg"];
const imagesDir = path.join(process.cwd(), "public", "images");
const outFile = path.join(process.cwd(), "lib", "media-manifest.generated.json");

function isImage(fileName) {
  return IMAGE_EXTENSIONS.includes(path.extname(fileName).toLowerCase());
}

const manifest = { named: {}, galleries: {} };

if (existsSync(imagesDir)) {
  for (const entry of readdirSync(imagesDir, { withFileTypes: true })) {
    if (entry.isFile() && isImage(entry.name)) {
      const name = path.basename(entry.name, path.extname(entry.name));
      // Plusieurs extensions pour un même nom (ex. logo.svg + logo.png) :
      // le premier trouvé gagne, même règle de priorité (ordre de
      // IMAGE_EXTENSIONS) que l'ancienne implémentation basée sur fs.
      if (!(name in manifest.named)) {
        manifest.named[name] = `/images/${entry.name}`;
      } else {
        const currentExt = path.extname(manifest.named[name]).toLowerCase();
        const currentPriority = IMAGE_EXTENSIONS.indexOf(currentExt);
        const candidatePriority = IMAGE_EXTENSIONS.indexOf(path.extname(entry.name).toLowerCase());
        if (candidatePriority < currentPriority) {
          manifest.named[name] = `/images/${entry.name}`;
        }
      }
    } else if (entry.isDirectory()) {
      const subdir = entry.name;
      const subdirPath = path.join(imagesDir, subdir);
      const files = readdirSync(subdirPath)
        .filter(isImage)
        .sort()
        .map((f) => `/images/${subdir}/${f}`);
      manifest.galleries[subdir] = files;
    }
  }
}

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify(manifest, null, 2) + "\n");

const namedCount = Object.keys(manifest.named).length;
const galleryCount = Object.keys(manifest.galleries).length;
console.log(`media manifest: ${namedCount} named image(s), ${galleryCount} gallery folder(s) -> ${path.relative(process.cwd(), outFile)}`);
