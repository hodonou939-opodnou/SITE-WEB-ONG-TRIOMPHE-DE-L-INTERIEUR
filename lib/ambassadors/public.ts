import { db } from "@/lib/db";

export type PublicAmbassador = {
  id: string;
  slug: string;
  fullName: string;
  photoUrl: string | null;
  bio: string | null;
  referredCount: number;
};

export async function listActiveAmbassadors(): Promise<PublicAmbassador[]> {
  const ambassadors = await db.ambassador.findMany({
    where: { active: true },
    // select plutôt qu'include : les champs de contact (phone, whatsappNumber,
    // email) ne sont ainsi jamais récupérés de la base pour cette requête
    // publique, ce qui rend leur fuite structurellement impossible ici plutôt
    // que de dépendre d'un .map() qui reste prudent — cf. Finding 6 de la
    // revue finale.
    select: {
      id: true,
      slug: true,
      fullName: true,
      photoUrl: true,
      bio: true,
      _count: { select: { participants: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return ambassadors.map((a) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.fullName,
    photoUrl: a.photoUrl,
    bio: a.bio,
    referredCount: a._count.participants,
  }));
}
