import type { NextConfig } from "next";

// Dérivé de NEXT_PUBLIC_SUPABASE_URL plutôt que codé en dur, pour rester
// correct si ce projet Supabase change (preview/staging notamment) sans
// devoir republier next.config.ts à chaque fois.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // La 4ème édition (17 et 18 octobre 2026) est passée : la page de promotion et le
  // formulaire d'inscription renvoient vers le récit de l'édition sur /cigibm, pour
  // que plus personne ne réserve une place pour un congrès terminé. Temporaire
  // (permanent: false) : à retirer quand le parcours d'inscription de la 5ème
  // édition sera prêt. Les badges /cigibm-2026/badge/… restent accessibles.
  async redirects() {
    return [
      { source: "/cigibm-2026", destination: "/cigibm#retour-4e-edition", permanent: false },
      { source: "/cigibm-2026/inscription", destination: "/cigibm#retour-4e-edition", permanent: false },
    ];
  },
  images: {
    // 90 : grandes images plein écran (bandeau des articles), où la
    // compression par défaut (75) se voit sur une photo déjà agrandie.
    qualities: [75, 90],
    // AVIF d'abord (30 à 50 % plus léger que le WebP à qualité égale), WebP pour
    // les navigateurs qui ne le lisent pas : moins de données sur mobile.
    formats: ["image/avif", "image/webp"],
    // Photos d'ambassadeurs, images de blog, etc. servies depuis le bucket
    // public Supabase Storage du projet — next/image refuse tout hôte
    // distant non explicitement listé ici.
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
