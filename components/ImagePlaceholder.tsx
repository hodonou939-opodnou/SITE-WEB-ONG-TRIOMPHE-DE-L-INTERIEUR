export default function ImagePlaceholder({
  label,
  ratio = "aspect-[4/5]",
  className = "",
}: {
  label: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative ${ratio} overflow-hidden rounded-[2rem] bg-gradient-to-br from-azure-200 via-leaf-100 to-leaf-300 ${className}`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-8 w-8 text-azure-800/50"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="9.5" r="1.5" />
          <path d="M3 16.5l5-5 4 4 3-3 6 6" />
        </svg>
        <p className="text-xs font-medium uppercase tracking-wide text-azure-800/60">
          {label}
        </p>
      </div>
    </div>
  );
}
