import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Container from "@/components/Container";
import Reveal from "@/components/Reveal";
import Button from "@/components/Button";
import { getPostBySlug, getSortedPosts, type BlogBlock } from "@/lib/blog";
import { siteConfig } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return getSortedPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return pageMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    image: { url: post.featuredImage.src, alt: post.featuredImage.alt },
    article: { publishedTime: post.isoDate, author: post.author },
  });
}

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "heading":
      return (
        <Reveal>
          <h2 className="mt-10 font-display text-2xl leading-snug text-leaf-900 sm:text-3xl">
            {block.text}
          </h2>
        </Reveal>
      );
    case "paragraph":
      return (
        <Reveal>
          <p className="mt-5 text-base leading-relaxed text-ink/80 sm:text-lg">
            {block.text}
          </p>
        </Reveal>
      );
    case "list":
      return (
        <Reveal>
          <ul className="mt-5 space-y-3">
            {block.items.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base leading-relaxed text-ink/80">
                <span aria-hidden className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-leaf-100 text-xs font-bold text-leaf-700">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Reveal>
      );
    case "quote":
      return (
        <Reveal>
          <blockquote className="mt-8 border-l-2 border-leaf-400 py-2 pl-6 font-display text-xl leading-snug text-leaf-900 sm:text-2xl">
            « {block.text} »
          </blockquote>
        </Reveal>
      );
    case "imageText":
      return (
        <Reveal>
          <div className="mt-10 grid items-center gap-8 sm:grid-cols-2">
            <div className={block.imagePosition === "right" ? "sm:order-2" : "sm:order-1"}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
                <Image
                  src={block.image.src}
                  alt={block.image.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className={block.imagePosition === "right" ? "sm:order-1" : "sm:order-2"}>
              {block.heading && (
                <h3 className="font-display text-xl leading-snug text-leaf-900 sm:text-2xl">
                  {block.heading}
                </h3>
              )}
              <div className="mt-3 space-y-4">
                {block.paragraphs.map((p) => (
                  <p key={p} className="text-base leading-relaxed text-ink/80">
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      );
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: `https://ongtriomphedelinterieur.com${post.featuredImage.src}`,
    datePublished: post.isoDate,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: "https://ongtriomphedelinterieur.com/images/logo-mark.png",
      },
    },
    mainEntityOfPage: `https://ongtriomphedelinterieur.com/blog/${post.slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-leaf-950">
        <div className="relative aspect-[16/9] w-full sm:aspect-[21/9]">
          <Image
            src={post.featuredImage.src}
            alt={post.featuredImage.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-leaf-950 via-leaf-950/40 to-transparent" />
        </div>
        <Container className="relative -mt-24 pb-12 sm:-mt-28">
          <Reveal>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
              {post.type === "article" ? "Article" : "Activité"} · {post.date} · {post.readTime} de lecture
            </p>
            <h1 className="font-display text-3xl leading-tight text-mist-50 sm:text-4xl md:text-5xl">
              {post.title}
            </h1>
          </Reveal>
        </Container>
      </section>

      {/* Body */}
      <Container className="max-w-3xl py-16 sm:py-20">
        {post.body.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <Reveal delay={0.1}>
          <div className="mt-14 rounded-2xl bg-leaf-950 p-8 text-center sm:p-10">
            <h2 className="font-display text-2xl text-mist-50 sm:text-3xl">
              Envie d&apos;aller plus loin ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-mist-100/75 sm:text-base">
              Réservez votre place au prochain CIGIBM, ou écrivez-nous
              directement si vous préférez en parler avant.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-4">
              <Button href="/cigibm-2026" variant="primary">
                Réserver ma place au CIGIBM
              </Button>
              <Button href="/contact" variant="ghost" className="!border-mist-50/30 !text-mist-50 hover:!bg-mist-50/10">
                Nous contacter
              </Button>
            </div>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
