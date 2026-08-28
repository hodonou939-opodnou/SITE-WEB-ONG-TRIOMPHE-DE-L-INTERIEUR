import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_BYTES = 5 * 1024 * 1024;

export class InvalidAmbassadorPhotoError extends Error {}

// Bucket "ambassador-photos" (public), créé une fois via un script
// ponctuel — cf. lib/supabase/admin.ts pour le client élevé utilisé côté
// serveur, seul moyen d'écrire dans ce bucket depuis un formulaire public
// non authentifié.
export async function uploadAmbassadorPhoto(file: File): Promise<string> {
  const extension = ALLOWED_TYPES[file.type];
  if (!extension) {
    throw new InvalidAmbassadorPhotoError(`Unsupported image type: ${file.type}`);
  }
  if (file.size > MAX_BYTES) {
    throw new InvalidAmbassadorPhotoError(`Image too large: ${file.size} bytes`);
  }

  const path = `${crypto.randomUUID()}.${extension}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from("ambassador-photos")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    throw new Error(`Ambassador photo upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from("ambassador-photos").getPublicUrl(path);
  return data.publicUrl;
}
