import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Une question, une envie de vous impliquer, une demande de partenariat ou de presse ? Contactez l'ONG Triomphe de l'Intérieur.",
  path: "/contact",
});

const infoItems = [
  { label: "Email", value: siteConfig.email, href: `mailto:${siteConfig.email}` },
  { label: "Téléphone", value: siteConfig.phone, href: siteConfig.phoneHref },
  { label: "Localisation", value: siteConfig.location, href: undefined },
];

export default function ContactPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="Contact"
        title="Parlons-en"
        description="Une question, une envie de vous impliquer, une demande de partenariat ou de presse ? Écrivez-nous — on lit tout, et on répond."
      />

      <Container className="py-24 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <h2 className="font-display text-2xl text-leaf-900">
              Nos coordonnées
            </h2>
            <ul className="mt-6 space-y-5">
              {infoItems.map((item) => (
                <li key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-leaf-600">
                    {item.label}
                  </p>
                  {item.href ? (
                    <a href={item.href} className="mt-1 block text-base text-ink/80 hover:text-ink">
                      {item.value}
                    </a>
                  ) : (
                    <p className="mt-1 text-base text-ink/80">{item.value}</p>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-10 rounded-2xl border border-ink/8 bg-mist-200 p-6">
              <p className="text-sm text-ink/60">
                Adresse précise à confirmer — en attendant, écrivez-nous par
                email ou téléphone, nous vous répondrons rapidement.
              </p>
            </div>

            <div className="mt-5 rounded-2xl border-l-2 border-leaf-500 bg-mist-warm p-6">
              <p className="text-sm font-semibold text-leaf-900">
                Si vous traversez une urgence
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Ce formulaire n&apos;est pas une ligne d&apos;urgence : nous ne
                le consultons pas en continu. Si vous pensez à vous faire du
                mal ou si votre vie est en danger immédiat, appelez-nous
                directement au{" "}
                <a
                  href={siteConfig.phoneHref}
                  className="font-semibold text-leaf-700 underline underline-offset-4"
                >
                  {siteConfig.phone}
                </a>
                , contactez les services d&apos;urgence, ou parlez-en dès
                maintenant à une personne de confiance autour de vous. Vous
                méritez de l&apos;aide tout de suite — pas dans quelques jours.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6 sm:p-8">
              <ContactForm />
            </div>
          </Reveal>
        </div>
      </Container>
    </>
  );
}
