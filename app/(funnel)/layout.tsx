import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/content";
import { getLogoSrc } from "@/lib/media";

// Layout "tunnel" : volontairement dépouillé de la navigation complète du
// site. Une seule sortie discrète vers l'accueil, aucun menu qui détourne
// l'attention de l'action à accomplir sur la page.
export default function FunnelLayout({ children }: { children: ReactNode }) {
  const logoSrc = getLogoSrc();

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-mist-50/10 bg-leaf-950/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            {logoSrc ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                <Image src={logoSrc} alt={siteConfig.shortName} width={72} height={72} className="h-full w-full object-contain p-0.5" priority />
              </span>
            ) : null}
            <span className="font-display text-sm text-mist-50">{siteConfig.shortName}</span>
          </Link>
          <Link href="/" className="text-xs text-mist-100/50 transition-colors hover:text-mist-100/80">
            ← Retour au site
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-mist-50/10 bg-leaf-950 py-6 text-center text-xs text-mist-100/40">
        © {new Date().getFullYear()} {siteConfig.name} — {siteConfig.location}
      </footer>
    </>
  );
}
