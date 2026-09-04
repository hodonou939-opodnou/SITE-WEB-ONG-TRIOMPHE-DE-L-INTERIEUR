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

export function resolveAccessRedirect(
  session: AdminSession | null,
  allowedRoles: Array<"admin" | "scanner">
): string | null {
  if (!session) return "/admin/login";
  if (!allowedRoles.includes(session.role)) return "/admin/login?acces=refuse";
  return null;
}

export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  const redirectTo = resolveAccessRedirect(session, ["admin"]);
  if (redirectTo) redirect(redirectTo);
  return session!;
}

// Distinct from requireAdmin(): the door-scanning flow must work for a
// scanner-role account too, not just full admins. requireAdmin() itself
// stays admin-only unchanged — other callers (ambassador/message Server
// Actions) depend on that.
export async function requireScanAccess(): Promise<AdminSession> {
  const session = await getAdminSession();
  const redirectTo = resolveAccessRedirect(session, ["admin", "scanner"]);
  if (redirectTo) redirect(redirectTo);
  return session!;
}
