import type { NextConfig } from "next";

// Dérivé de NEXT_PUBLIC_SUPABASE_URL plutôt que codé en dur, pour rester
// correct si ce projet Supabase change (preview/staging notamment) sans
// devoir republier next.config.ts à chaque fois.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  images: {
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
