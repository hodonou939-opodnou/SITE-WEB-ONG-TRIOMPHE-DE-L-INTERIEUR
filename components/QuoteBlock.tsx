import Reveal from "./Reveal";

export default function QuoteBlock({
  quote,
  author,
  role,
}: {
  quote: string;
  author: string;
  role: string;
}) {
  return (
    <Reveal className="mx-auto max-w-3xl text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="mx-auto mb-6 h-8 w-8 text-leaf-500"
      >
        <path d="M7.17 6C4.87 8.06 3.5 10.65 3.5 13.6c0 3.1 2.05 5.15 4.6 5.15 2.15 0 3.75-1.6 3.75-3.7 0-1.95-1.35-3.4-3.15-3.4-.35 0-.65.05-.9.15.35-2 1.9-3.85 3.65-4.85L7.17 6zm9.5 0c-2.3 2.06-3.67 4.65-3.67 7.6 0 3.1 2.05 5.15 4.6 5.15 2.15 0 3.75-1.6 3.75-3.7 0-1.95-1.35-3.4-3.15-3.4-.35 0-.65.05-.9.15.35-2 1.9-3.85 3.65-4.85L16.67 6z" />
      </svg>
      <p className="font-display text-2xl leading-snug text-azure-900 sm:text-3xl">
        « {quote} »
      </p>
      <p className="mt-6 text-sm font-medium uppercase tracking-wide text-leaf-600">
        {author}
      </p>
      <p className="text-sm text-ink/60">{role}</p>
    </Reveal>
  );
}
