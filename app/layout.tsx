import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { siteConfig } from "@/lib/content";

// Polices auto-hébergées (variable fonts) plutôt que next/font/google : évite
// toute dépendance au CDN Google Fonts au moment du build — Next.js a déjà
// renvoyé des URLs de fichiers obsolètes (404) pour Lora à un moment donné.
const lora = localFont({
  src: "./fonts/lora-variable.woff2",
  variable: "--font-lora",
  weight: "500 700",
  display: "swap",
});

const manrope = localFont({
  src: "./fonts/manrope-variable.woff2",
  variable: "--font-manrope",
  weight: "400 700",
  display: "swap",
});

const siteUrl = "https://ongtriomphedelinterieur.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "santé mentale Bénin",
    "guérison intérieure",
    "CIGIBM",
    "bien-être mental",
    "ONG Bénin",
    "Christelle Eugénie Gnimassou",
    "développement personnel Bénin",
  ],
  authors: [{ name: siteConfig.name }],
  icons: {
    icon: [
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: siteConfig.name,
    url: siteUrl,
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: ["/images/og-default.jpg"],
  },
};

// Layout racine minimal : coquille HTML/polices uniquement. Le header et le
// footer du site vivent dans app/(site)/layout.tsx, pour que les pages
// tunnel (ex. app/(funnel)/…) puissent s'en affranchir et rester focalisées
// sur une seule action.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${lora.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-mist-100 text-ink">
        {children}
      </body>
    </html>
  );
}
