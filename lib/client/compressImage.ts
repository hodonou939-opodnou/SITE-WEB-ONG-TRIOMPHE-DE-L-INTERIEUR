const MAX_UNCOMPRESSED_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export type CompressPhotoOptions = {
  maxUncompressedBytes?: number;
  maxDimension?: number;
  jpegQuality?: number;
};

// Les photos prises directement au téléphone dépassent très souvent la
// limite dure de 4.5 Mo imposée par les Serverless Functions Vercel pour le
// corps d'une requête (non configurable, contrairement à l'ancienne
// bodyParser.sizeLimit des Pages API). On compresse donc côté navigateur
// avant l'envoi plutôt que de dépendre d'une limite serveur qu'on ne peut
// pas relever. Partagé entre le formulaire public d'inscription ambassadeur,
// l'upload admin et le générateur de badge — mais ce dernier ne fait
// JAMAIS remonter la photo à un serveur (tout se joue dans le navigateur,
// jusqu'au canvas d'export), donc cette contrainte ne le concerne pas : il
// passe ses propres options, bien plus généreuses (voir BadgeGenerator.tsx),
// pour préserver le détail que l'export à pleine résolution peut
// maintenant réellement restituer (photo signalée floue/dégradée avant que
// ce chemin n'utilise ces valeurs par défaut, pensées pour un upload
// serveur, pas un rendu local).
export async function compressPhoto(file: File, options: CompressPhotoOptions = {}): Promise<File> {
  const maxUncompressedBytes = options.maxUncompressedBytes ?? MAX_UNCOMPRESSED_BYTES;
  const maxDimension = options.maxDimension ?? MAX_DIMENSION;
  const jpegQuality = options.jpegQuality ?? JPEG_QUALITY;

  if (file.size <= maxUncompressedBytes) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", jpegQuality));
    if (!blob) return file;

    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (err) {
    console.error("Photo compression failed, submitting the original file", err);
    return file;
  }
}
