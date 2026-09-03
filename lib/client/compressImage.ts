const MAX_UNCOMPRESSED_BYTES = 1.5 * 1024 * 1024;
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

// Les photos prises directement au téléphone dépassent très souvent la
// limite dure de 4.5 Mo imposée par les Serverless Functions Vercel pour le
// corps d'une requête (non configurable, contrairement à l'ancienne
// bodyParser.sizeLimit des Pages API). On compresse donc côté navigateur
// avant l'envoi plutôt que de dépendre d'une limite serveur qu'on ne peut
// pas relever. Partagé entre le formulaire public d'inscription ambassadeur
// et l'upload admin — même contrainte des deux côtés.
export async function compressPhoto(file: File): Promise<File> {
  if (file.size <= MAX_UNCOMPRESSED_BYTES) return file;
  if (typeof createImageBitmap !== "function") return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) return file;

    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } catch (err) {
    console.error("Photo compression failed, submitting the original file", err);
    return file;
  }
}
