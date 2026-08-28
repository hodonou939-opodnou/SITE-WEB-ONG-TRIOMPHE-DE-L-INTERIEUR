import Image from "next/image";
import Link from "next/link";
import Container from "./Container";
import { navigation, siteConfig } from "@/lib/content";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4v-8.5Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M16.5 2c.3 2.1 1.6 3.6 3.7 3.9v3.1c-1.3 0-2.5-.4-3.6-1.1v6.4c0 3.2-2.6 5.7-5.7 5.7A5.7 5.7 0 0 1 5.2 14.3c0-3.1 2.5-5.6 5.6-5.7v3.2a2.6 2.6 0 1 0 2.6 2.6V2h3.1Z" />
    </svg>
  );
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3a1.96 1.96 0 1 0 0 3.92A1.96 1.96 0 0 0 5.25 3ZM20.44 20h-3.38v-6.06c0-1.44-.03-3.3-2.02-3.3-2.02 0-2.33 1.58-2.33 3.2V20H9.34V8.5h3.24v1.57h.05c.45-.85 1.56-1.75 3.2-1.75 3.42 0 4.06 2.25 4.06 5.18V20Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "Facebook", href: siteConfig.social.facebook, Icon: FacebookIcon },
  { label: "TikTok", href: siteConfig.social.tiktok, Icon: TikTokIcon },
  { label: "LinkedIn", href: siteConfig.social.linkedin, Icon: LinkedInIcon },
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
            {socialLinks.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-mist-50/20 text-mist-100/80 transition-colors hover:border-leaf-300/60 hover:bg-mist-50/5 hover:text-leaf-300"
              >
                <Icon />
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
