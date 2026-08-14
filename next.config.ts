import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Export statique : le site est 100% statique (aucune route dynamique,
  // aucune API), donc pas besoin d'un serveur Next.js ni d'un adaptateur de
  // plateforme pour le déployer. `out/` peut être servi par n'importe quel
  // hébergeur statique.
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
