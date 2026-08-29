import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminBottomNav, AdminSidebarNav } from "./AdminNav";

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-screen bg-mist-100">
      {/* Barre latérale desktop uniquement — sur mobile, la navigation
          principale vit dans AdminBottomNav (barre du bas), et l'en-tête
          ci-dessous ne porte plus que la marque et la déconnexion. */}
      <aside className="hidden w-56 shrink-0 border-r border-ink/8 bg-mist-50 p-6 lg:block">
        <p className="font-display text-lg text-leaf-900">Admin CIGIBM</p>
        <AdminSidebarNav />
        <div className="mt-10 border-t border-ink/8 pt-4 text-xs text-ink/50">
          <p>{session.fullName}</p>
          <p className="uppercase tracking-wide">{session.role}</p>
          <form action={signOut} className="mt-3">
            <button type="submit" className="text-leaf-700 underline underline-offset-2">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/8 bg-mist-50/95 px-4 py-3 backdrop-blur lg:hidden">
          <p className="font-display text-base text-leaf-900">Admin CIGIBM</p>
          <form action={signOut}>
            <button type="submit" className="text-xs font-medium text-leaf-700 underline underline-offset-2">
              Déconnexion
            </button>
          </form>
        </header>

        {/* pb-20 : place pour la barre du bas fixe sur mobile, retirée dès lg:
            où cette barre est masquée. */}
        <main className="min-w-0 flex-1 p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">{children}</main>
      </div>

      <AdminBottomNav />
    </div>
  );
}
