import Reveal from "./Reveal";

export default function Card({
  title,
  description,
  index = 0,
  className = "",
}: {
  title: string;
  description: string;
  index?: number;
  className?: string;
}) {
  return (
    <Reveal delay={index * 0.08} className={className}>
      <div className="h-full rounded-2xl border border-ink/8 bg-mist-50 p-6 shadow-sm shadow-ink/5 transition-shadow hover:shadow-md">
        <span className="font-display text-2xl text-leaf-600">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="mt-3 font-display text-lg text-azure-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          {description}
        </p>
      </div>
    </Reveal>
  );
}
