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
    include: { _count: { select: { participants: true } } },
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
