"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9.5a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" />
      <path d="M15.2 12.2c2.3.4 3.8 2 3.8 4.3" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M12 3.5 14.4 9l6 .8-4.4 4.1 1.2 5.9L12 17l-5.2 2.8 1.2-5.9L3.6 9.8l6-.8Z" strokeLinejoin="round" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const navItems = [
  { href: "/admin", label: "Tableau de bord", shortLabel: "Accueil", Icon: HomeIcon, exact: true },
  { href: "/admin/participants", label: "Participants", shortLabel: "Participants", Icon: PeopleIcon },
  { href: "/admin/ambassadors", label: "Ambassadeurs", shortLabel: "Ambassad.", Icon: StarIcon },
  { href: "/admin/messages", label: "Messages", shortLabel: "Messages", Icon: MailIcon },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

// Barre latérale desktop : reste montée en permanence (lg: et plus).
export function AdminSidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="mt-8 space-y-1">
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              active ? "bg-leaf-50 font-medium text-leaf-900" : "text-ink/75 hover:bg-leaf-50 hover:text-leaf-900"
            }`}
          >
            <item.Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// Barre du bas mobile : l'usage de référence (scan QR le jour du congrès)
// se fait au téléphone, à une main — une barre du bas atteignable au
// pouce vaut mieux qu'un menu hamburger qui demande d'atteindre un coin.
export function AdminBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-ink/10 bg-mist-50/95 backdrop-blur lg:hidden"
    >
      {navItems.map((item) => {
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
              active ? "text-leaf-700" : "text-ink/50"
            }`}
          >
            <item.Icon className="h-5 w-5" />
            {item.shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
