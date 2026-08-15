import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary:
    "bg-azure-500 text-mist-50 hover:bg-azure-600 shadow-lg shadow-azure-900/20 hover:shadow-xl hover:shadow-azure-900/25 hover:-translate-y-0.5",
  secondary:
    "bg-leaf-600 text-mist-50 hover:bg-leaf-700 shadow-sm shadow-leaf-900/10",
  ghost:
    "bg-transparent text-ink border border-ink/15 hover:border-ink/35 hover:bg-ink/5",
};

export default function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");

  return (
    <Link
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 ${variants[variant]} ${className}`}
    >
      {children}
    </Link>
  );
}
