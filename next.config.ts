import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Rendu serveur (Vercel) : nécessaire depuis l'ajout de /api/cigibm-register,
  // une route serveur qui appelle l'API Brevo sans jamais exposer la clé au
  // navigateur. Le reste du site reste des pages statiques classiques.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
