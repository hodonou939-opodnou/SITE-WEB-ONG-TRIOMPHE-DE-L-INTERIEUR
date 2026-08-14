import Reveal from "./Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}) {
  const alignClass = align === "center" ? "text-center mx-auto" : "text-left";

  return (
    <Reveal className={`max-w-2xl ${alignClass}`}>
      {eyebrow && (
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-leaf-600">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl leading-tight text-azure-900 sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-ink/70 sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
