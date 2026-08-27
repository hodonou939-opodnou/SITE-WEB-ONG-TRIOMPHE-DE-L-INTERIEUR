import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";

const navItems = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/ambassadors", label: "Ambassadeurs" },
  { href: "/admin/messages", label: "Messages" },
];

export default async function AdminProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireAdmin();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return (
    <div className="flex min-h-screen bg-mist-100">
      <aside className="w-56 shrink-0 border-r border-ink/8 bg-mist-50 p-6">
        <p className="font-display text-lg text-leaf-900">Admin CIGIBM</p>
        <nav className="mt-8 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink/75 transition-colors hover:bg-leaf-50 hover:text-leaf-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
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
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
