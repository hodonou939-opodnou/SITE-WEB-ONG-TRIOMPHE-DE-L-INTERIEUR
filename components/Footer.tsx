import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import { navigation, siteConfig } from "@/lib/content";

const socialLinks = [
  { label: "Facebook", href: siteConfig.social.facebook },
  { label: "Instagram", href: siteConfig.social.instagram },
  { label: "TikTok", href: siteConfig.social.tiktok },
  { label: "LinkedIn", href: siteConfig.social.linkedin },
];

// [PLACEHOLDER] Lien LinkedIn à confirmer.
const creditLinkedIn =
  "https://www.linkedin.com/in/eloïse-zodekon-0a4312389?utm_source=share_via&utm_content=profile&utm_medium=member_android";

export default function Footer({ logoSrc }: { logoSrc: string | null }) {
  return (
    <footer className="border-t border-mist-50/10 bg-leaf-950 text-mist-100">
      <Container className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            {logoSrc ? (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src={logoSrc}
                  alt={siteConfig.shortName}
                  width={112}
                  height={112}
                  className="h-full w-full object-contain p-1"
                />
              </span>
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mist-50 font-display text-lg text-leaf-900">
                TI
              </span>
            )}
            <span className="font-display text-lg">{siteConfig.shortName}</span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-mist-100/70">
            {siteConfig.description} Fondée et présidée par{" "}
            {siteConfig.founder}.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf-300">
            Navigation
          </p>
          <ul className="mt-4 space-y-2">
            {navigation.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-mist-100/70 transition-colors hover:text-mist-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-leaf-300">
            Contact
          </p>
          <ul className="mt-4 space-y-2 text-sm text-mist-100/70">
            <li>{siteConfig.location}</li>
            <li>
              <a href={`mailto:${siteConfig.email}`} className="hover:text-mist-50">
                {siteConfig.email}
              </a>
            </li>
            <li>
              <a href={siteConfig.phoneHref} className="hover:text-mist-50">
                {siteConfig.phone}
              </a>
            </li>
          </ul>
          <div className="mt-5 flex gap-3">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-mist-50/20 text-xs text-mist-100/80 transition-colors hover:border-mist-50/50 hover:text-mist-50"
              >
                {s.label.slice(0, 2)}
              </a>
            ))}
          </div>
        </div>
      </Container>

      <div className="border-t border-mist-50/10 py-6">
        <Container className="flex flex-col items-center justify-between gap-2 text-xs text-mist-100/50 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tous droits réservés.
          </p>
          <a
            href={creditLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="text-mist-100/40 transition-colors hover:text-mist-100/70"
          >
            Propulsé par Eloïse Zodekon
          </a>
        </Container>
      </div>
    </footer>
  );
}
