import Link from "next/link";
import Image from "next/image";
import Reveal from "./Reveal";
import type { BlogPost } from "@/lib/blog";

const typeLabel: Record<BlogPost["type"], string> = {
  article: "Article",
  activite: "Activité",
};

export default function BlogCard({ post, index = 0 }: { post: BlogPost; index?: number }) {
  return (
    <Reveal delay={index * 0.08}>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/8 bg-mist-50 transition-all duration-300 hover:-translate-y-1 hover:border-leaf-200 hover:shadow-lg hover:shadow-ink/8"
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <Image
            src={post.featuredImage.src}
            alt={post.featuredImage.alt}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className="absolute left-4 top-4 rounded-full bg-mist-50/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-leaf-700">
            {typeLabel[post.type]}
          </span>
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs text-ink/45">
            {post.date} · {post.readTime} de lecture
          </p>
          <h3 className="mt-2 font-display text-xl leading-snug text-leaf-900">
            {post.title}
          </h3>
          <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/70">
            {post.excerpt}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-leaf-600">
            Lire
            <span aria-hidden className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </span>
        </div>
      </Link>
    </Reveal>
  );
}
