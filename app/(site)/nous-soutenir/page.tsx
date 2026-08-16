import type { Metadata } from "next";
import Hero from "@/components/Hero";
import Container from "@/components/Container";
import SectionHeading from "@/components/SectionHeading";
import Button from "@/components/Button";
import Reveal from "@/components/Reveal";
import { siteConfig, supportWays } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Nous soutenir",
  description:
    "Un don, un week-end de bénévolat, un partenariat : soutenez l'ONG Triomphe de l'Intérieur et la santé mentale au Bénin.",
  path: "/nous-soutenir",
});

export default function NousSoutenirPage() {
  return (
    <>
      <Hero
        compact
        eyebrow="Nous soutenir"
        title="Votre soutien fait vivre la guérison intérieure, partout au Bénin"
        description="Si le CIGIBM est gratuit pour tous ceux qui en ont besoin, c'est parce que d'autres l'ont financé avant eux. C'est aussi simple que ça."
      />

      <Container className="py-24 sm:py-28">
        <SectionHeading
          eyebrow="Comment agir"
          title="Trois façons de nous accompagner"
          description="Il n'y a pas de contribution trop petite. Un don ponctuel, un week-end de bénévolat ou un partenariat durable : chacune de ces portes mène au même endroit."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {supportWays.map((way, i) => (
            <Reveal key={way.title} delay={i * 0.1}>
              <div className="flex h-full flex-col rounded-2xl border border-ink/8 bg-mist-50 p-7">
                <h3 className="font-display text-xl text-leaf-900">
                  {way.title}
                </h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/70">
                  {way.description}
                </p>
                <ul className="mt-5 space-y-1.5 border-t border-ink/8 pt-4">
                  {way.details.map((d) => (
                    <li key={d} className="text-xs text-ink/60">
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.2} className="mt-14 rounded-2xl bg-leaf-950 p-8 text-center sm:p-12">
          <h2 className="font-display text-2xl text-mist-50 sm:text-3xl">
            Une question avant de vous engager ?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-mist-100/75 sm:text-base">
            Écrivez-nous à{" "}
            <a href={`mailto:${siteConfig.email}`} className="text-leaf-300 underline underline-offset-4">
              {siteConfig.email}
            </a>{" "}
            ou via notre formulaire de contact — nous revenons vers vous
            rapidement pour organiser votre don, votre mission bénévole ou
            votre partenariat.
          </p>
          <div className="mt-7">
            <Button href="/contact" variant="primary">
              Nous contacter
            </Button>
          </div>
        </Reveal>
      </Container>
    </>
  );
}
