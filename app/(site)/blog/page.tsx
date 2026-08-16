import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import BlogCard from "@/components/BlogCard";
import { getSortedPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Blog & Activités",
  description:
    "Articles, conseils et activités de l'ONG Triomphe de l'Intérieur : santé mentale, guérison intérieure et développement personnel.",
  path: "/blog",
});

export default function BlogPage() {
  const posts = getSortedPosts();

  return (
    <>
      <Hero
        compact
        eyebrow="Blog & Activités"
        title="Ce qu'on a envie de vous dire, entre deux congrès"
        description="Des articles pour nourrir la réflexion, et le récit de nos activités sur le terrain, publiés au fil de l'eau."
      />

      <Container className="py-20 sm:py-24">
        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <BlogCard key={post.slug} post={post} index={i} />
            ))}
          </div>
        ) : (
          <p className="text-center text-ink/60">
            Les premiers articles arrivent très bientôt.
          </p>
        )}
      </Container>
    </>
  );
}
