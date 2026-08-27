"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const REFERRAL_COOKIE_NAME = "cigibm_ref";
const REFERRAL_COOKIE_MAX_AGE_DAYS = 30;

// Composant sans rendu visuel : capture le ?ref=<slug> d'un lien de
// parrainage dans un cookie, lu ensuite par /api/cigibm-register au moment
// de l'inscription. Pas de ref dans l'URL => rien ne se passe, l'attribution
// reste bien optionnelle.
export default function ReferralCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (!ref) return;

    const maxAgeSeconds = REFERRAL_COOKIE_MAX_AGE_DAYS * 24 * 60 * 60;
    document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(ref)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  }, [searchParams]);

  return null;
}
