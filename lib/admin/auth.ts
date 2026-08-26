import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export type AdminSession = {
  id: string;
  fullName: string;
  role: "admin" | "scanner";
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) return null;

  const profile = await db.adminProfile.findUnique({ where: { id: userId } });
  if (!profile) return null;

  return { id: profile.id, fullName: profile.fullName, role: profile.role };
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
