import type { MetadataRoute } from "next";
import { getSortedPosts } from "@/lib/blog";

const siteUrl = "https://ongtriomphedelinterieur.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/a-propos", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/methode-racines", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/cigibm", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/cigibm-2026", priority: 1, changeFrequency: "daily" as const },
    { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/nous-soutenir", priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.5, changeFrequency: "yearly" as const },
  ].map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const postRoutes = getSortedPosts().map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.isoDate),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...postRoutes];
}
