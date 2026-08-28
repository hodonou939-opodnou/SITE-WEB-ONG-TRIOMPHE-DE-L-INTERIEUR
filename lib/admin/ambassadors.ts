import { db } from "@/lib/db";
import { uniqueAmbassadorSlug } from "@/lib/ambassadors/slug";

export type AmbassadorWithStats = {
  id: string;
  slug: string;
  fullName: string;
  phone: string;
  whatsappNumber: string | null;
  email: string | null;
  photoUrl: string | null;
  bio: string | null;
  active: boolean;
  referredCount: number;
  attendedCount: number;
};

export async function listAmbassadorsWithStats(): Promise<AmbassadorWithStats[]> {
  const ambassadors = await db.ambassador.findMany({
    include: { participants: { select: { attendedAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return ambassadors.map((a) => ({
    id: a.id,
    slug: a.slug,
    fullName: a.fullName,
    phone: a.phone,
    whatsappNumber: a.whatsappNumber,
    email: a.email,
    photoUrl: a.photoUrl,
    bio: a.bio,
    active: a.active,
    referredCount: a.participants.length,
    attendedCount: a.participants.filter((p) => p.attendedAt !== null).length,
  }));
}

export type CreateAmbassadorInput = {
  fullName: string;
  phone: string;
  whatsappNumber?: string;
  email?: string;
  photoUrl?: string;
  bio?: string;
  active?: boolean;
};

export async function createAmbassador(
  input: CreateAmbassadorInput
): Promise<{ id: string; slug: string }> {
  const slug = await uniqueAmbassadorSlug(input.fullName, async (candidate) => {
    const existing = await db.ambassador.findUnique({ where: { slug: candidate } });
    return existing !== null;
  });

  const ambassador = await db.ambassador.create({
    data: {
      slug,
      fullName: input.fullName,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber || null,
      email: input.email || null,
      photoUrl: input.photoUrl || null,
      bio: input.bio || null,
      active: input.active,
    },
  });

  return { id: ambassador.id, slug: ambassador.slug };
}

export async function getAmbassador(id: string) {
  return db.ambassador.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      fullName: true,
      phone: true,
      whatsappNumber: true,
      email: true,
      photoUrl: true,
      bio: true,
      active: true,
    },
  });
}

export type UpdateAmbassadorInput = {
  fullName: string;
  phone: string;
  whatsappNumber?: string | null;
  email?: string | null;
  photoUrl?: string | null;
  bio?: string | null;
  active: boolean;
};

export async function updateAmbassador(id: string, input: UpdateAmbassadorInput): Promise<void> {
  await db.ambassador.update({
    where: { id },
    data: {
      fullName: input.fullName,
      phone: input.phone,
      whatsappNumber: input.whatsappNumber || null,
      email: input.email || null,
      photoUrl: input.photoUrl || null,
      bio: input.bio || null,
      active: input.active,
    },
  });
}
