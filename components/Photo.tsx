import Image from "next/image";

export default function Photo({
  src,
  alt,
  ratio = "aspect-[4/5]",
  className = "",
}: {
  src: string;
  alt: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${ratio} overflow-hidden rounded-[2rem] ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
