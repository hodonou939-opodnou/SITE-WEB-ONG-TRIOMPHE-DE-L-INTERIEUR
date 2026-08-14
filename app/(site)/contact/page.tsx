import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import ContactForm from "@/components/ContactForm";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contactez l'ONG Triomphe de l'Intérieur.",
};

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
        description="Une question, une envie de vous impliquer, une demande de partenariat ou de presse ? Écrivez-nous."
      />

      <Container className="py-24 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <h2 className="font-display text-2xl text-azure-900">
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
