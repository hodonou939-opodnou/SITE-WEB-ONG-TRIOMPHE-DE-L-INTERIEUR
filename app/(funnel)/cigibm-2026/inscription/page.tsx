import type { Metadata } from "next";
import RegistrationForm from "@/components/RegistrationForm";
import { cigibm } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `Inscription, CIGIBM 2026`,
  description: `Réservez votre place gratuite au CIGIBM 2026, les ${cigibm.nextEdition.dates} au ${cigibm.nextEdition.venue}.`,
  path: "/cigibm-2026/inscription",
});

// Page volontairement minimale : quand quelqu'un arrive ici (lien de
// parrainage, lien direct partagé), on ne veut aucune friction avant le
// formulaire — pas d'argumentaire, pas de sections à faire défiler, juste
// l'essentiel pour réserver sa place. Le discours de vente vit sur
// /cigibm-2026, cette page est la version "j'y vais direct".
//
// Note : /api/cigibm-register redirige toujours vers /cigibm-2026 en cas
// d'erreur (comportement historique, indépendant de la page d'origine) —
// donc pas de gestion de ?erreur= ici pour l'instant, ce serait du code mort.
// Rendre la route consciente de la page d'origine touche à nouveau le
// chemin d'inscription critique, déjà durci et revu de façon adversariale ;
// à faire une fois la branche Ambassador Program fusionnée, pour éviter un
// conflit garanti sur ce même fichier.
export default function InscriptionPage() {
  return (
    <section className="flex min-h-[calc(100vh-9rem)] items-center bg-leaf-950 px-6 py-12 sm:px-8">
      <div className="mx-auto w-full max-w-md">
        <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-leaf-300">
          {cigibm.nextEdition.edition} · {cigibm.nextEdition.dates}
        </p>
        <h1 className="mb-6 text-center font-display text-2xl leading-snug text-mist-50">
          {cigibm.nextEdition.theme}
        </h1>
        <RegistrationForm />
      </div>
    </section>
  );
}
