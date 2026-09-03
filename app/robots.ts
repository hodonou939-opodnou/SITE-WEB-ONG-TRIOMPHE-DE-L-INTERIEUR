import type { MetadataRoute } from "next";

const siteUrl = "https://ongtriomphedelinterieur.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/cigibm-2026/merci"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
