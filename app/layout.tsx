import type { Metadata } from "next";
import { Lora, Manrope } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/lib/content";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.tagline}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.description,
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
