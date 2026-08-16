import Image from "next/image";
import { getNamedImage } from "@/lib/media";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export default function Avatar({
  slug,
  name,
  size = 64,
  className = "",
}: {
  slug: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const src = getNamedImage(`speaker-${slug}`);

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-leaf-100 ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display text-lg text-leaf-700">
          {initials(name)}
        </div>
      )}
    </div>
  );
}
