import { ReactNode } from "react";
import Container from "./Container";
import Reveal from "./Reveal";

export default function Hero({
  eyebrow,
  title,
  description,
  actions,
  compact = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-azure-900">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-leaf-500/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-azure-400/25 blur-3xl"
      />
      <Container
        className={`relative ${compact ? "py-24 sm:py-28" : "py-32 sm:py-40"}`}
      >
        <Reveal className="max-w-3xl">
          {eyebrow && (
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-leaf-300">
              {eyebrow}
            </p>
          )}
          <h1 className="font-display text-4xl leading-tight text-mist-50 sm:text-5xl md:text-6xl">
            {title}
          </h1>
          {description && (
            <p className="mt-6 max-w-xl text-base leading-relaxed text-mist-100/80 sm:text-lg">
              {description}
            </p>
          )}
          {actions && (
            <div className="mt-10 flex flex-wrap gap-4">{actions}</div>
          )}
        </Reveal>
      </Container>
    </section>
  );
}
