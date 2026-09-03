import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import { cigibm, siteConfig } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = {
  ...pageMetadata({
    title: "Votre place est réservée, CIGIBM 2026",
    description: "Confirmation de votre inscription au CIGIBM 2026.",
    path: "/cigibm-2026/merci",
    image: { url: "/images/cigibm-poster.jpg", alt: `Affiche CIGIBM 2026, ${cigibm.nextEdition.theme}` },
  }),
  robots: { index: false },
};

const nextSteps = [
  {
    title: "Notez les dates maintenant",
    description: `${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}. Mettez-les dans votre téléphone tout de suite, c'est le meilleur moyen de ne pas laisser la vie quotidienne reprendre le dessus.`,
  },
  {
    title: "Vous recevrez le programme détaillé",
    description:
      "Nous vous envoyons par email et par téléphone le déroulé des deux journées, ainsi que les informations pratiques d'accès.",
  },
  {
    title: "Venez accompagné·e si vous le souhaitez",
    description:
      "Beaucoup de participants viennent avec un proche. Si quelqu'un autour de vous traverse une épreuve, transmettez-lui le lien : sa place est gratuite aussi.",
  },
];

export default function MerciPage() {
  return (
    <section className="relative overflow-hidden bg-leaf-950">
      <div aria-hidden className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-leaf-500/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-azure-400/20 blur-3xl" />

      <div className="relative mx-auto max-w-2xl px-6 py-24 sm:px-8 sm:py-32">
        <Reveal scale>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-leaf-500/20 text-2xl text-leaf-300">
            ✓
          </div>
          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.25em] text-leaf-300">
            Inscription confirmée
          </p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-mist-50 sm:text-5xl">
            Votre place vous attend
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-mist-100/85">
            Merci de nous faire confiance. C&apos;est souvent le pas le plus
            difficile, et vous venez de le franchir.
          </p>
        </Reveal>

        <div className="mt-12 space-y-4">
          {nextSteps.map((step, i) => (
            <Reveal key={step.title} delay={0.1 + i * 0.06}>
              <div className="rounded-2xl border border-mist-50/12 bg-mist-50/5 p-6">
                <h2 className="font-display text-lg text-mist-50">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-mist-100/70">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.35}>
          <div className="mt-12 border-t border-mist-50/12 pt-8">
            <p className="text-sm leading-relaxed text-mist-100/60">
              Une question d&apos;ici là ? Écrivez-nous à{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-medium text-leaf-300 underline underline-offset-4 transition-colors hover:text-leaf-200"
              >
                {siteConfig.email}
              </a>{" "}
              ou appelez le{" "}
              <a
                href={siteConfig.phoneHref}
                className="font-medium text-leaf-300 underline underline-offset-4 transition-colors hover:text-leaf-200"
              >
                {siteConfig.phone}
              </a>
              .
            </p>
            <a
              href="/"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full border border-mist-50/25 px-7 py-3.5 text-sm font-semibold tracking-wide text-mist-50 transition-colors hover:bg-mist-50/10"
            >
              Découvrir l&apos;ONG
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
