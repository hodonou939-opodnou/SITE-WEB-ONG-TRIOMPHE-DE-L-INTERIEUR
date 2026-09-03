import type { Metadata } from "next";
import { siteConfig } from "./content";

const siteUrl = "https://ongtriomphedelinterieur.com";

/**
 * Construit les métadonnées Open Graph / Twitter d'une page à partir de son
 * titre et sa description déjà définis, évite de dupliquer le boilerplate
 * social sur chaque page tout en gardant un partage correct par URL.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  article,
}: {
  title: string;
  description: string;
  path: string;
  image?: { url: string; alt: string };
  article?: { publishedTime: string; author: string };
}): Metadata {
  const fullTitle = `${title}, ${siteConfig.name}`;
  const ogImage = image ?? { url: "/images/og-default.jpg", alt: siteConfig.name };

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: article
      ? {
          type: "article",
          locale: "fr_FR",
          siteName: siteConfig.name,
          url: `${siteUrl}${path}`,
          title: fullTitle,
          description,
          images: [{ url: ogImage.url, width: 1200, height: 630, alt: ogImage.alt }],
          publishedTime: article.publishedTime,
          authors: [article.author],
        }
      : {
          type: "website",
          locale: "fr_FR",
          siteName: siteConfig.name,
          url: `${siteUrl}${path}`,
          title: fullTitle,
          description,
          images: [{ url: ogImage.url, width: 1200, height: 630, alt: ogImage.alt }],
        },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  };
}
