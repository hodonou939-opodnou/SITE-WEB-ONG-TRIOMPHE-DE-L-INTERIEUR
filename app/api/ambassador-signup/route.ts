import { NextRequest, NextResponse } from "next/server";
import { createAmbassador } from "@/lib/admin/ambassadors";
import { buildAmbassadorSignupEmail, sendTransactionalEmail } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";

// Même raisonnement que app/api/cigibm-register/route.ts (Task 8/9 de ce
// projet) : la création Ambassador puis l'envoi email peuvent, dans le pire
// des cas, dépasser le timeout par défaut de la plateforme avant que les
// blocs try/catch ci-dessous n'aient eu la main.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const formData = await request.formData();

  const fullName = formData.get("fullName")?.toString().trim();
  const phoneRaw = formData.get("phone")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const consent = formData.get("consent")?.toString();

  if (!fullName || !phoneRaw || !email || consent !== "1") {
    return NextResponse.redirect(`${origin}/cigibm-2026?ambassadeur=erreur#ambassadeurs`, 303);
  }

  const phone = normalizePhone(phoneRaw);

  let slug: string;
  try {
    // active: false — un ambassadeur qui s'inscrit lui-même reste invisible
    // du carrousel public tant qu'un admin ne l'a pas validé depuis
    // /admin/ambassadors (choix explicite de l'utilisateur : approbation
    // requise plutôt qu'une mise en ligne immédiate).
    const result = await createAmbassador({ fullName, phone, email, active: false });
    slug = result.slug;
  } catch (err) {
    console.error("Ambassador self-signup creation failed", { email }, err);
    return NextResponse.redirect(`${origin}/cigibm-2026?ambassadeur=erreur#ambassadeurs`, 303);
  }

  const referralUrl = `${origin}/cigibm-2026?ref=${slug}`;

  // L'envoi de l'email de bienvenue ne doit jamais faire échouer
  // l'inscription elle-même : le compte ambassadeur est déjà créé.
  const apiKey = process.env.BREVO_API_KEY;
  if (apiKey) {
    try {
      const message = buildAmbassadorSignupEmail(fullName, referralUrl);
      const emailRes = await sendTransactionalEmail(apiKey, { email, name: fullName }, message);
      if (!emailRes.ok) {
        console.error("Ambassador welcome email failed", emailRes.status, await emailRes.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Ambassador welcome email request failed", err);
    }
  } else {
    console.error("BREVO_API_KEY is not configured, skipping ambassador welcome email");
  }

  return NextResponse.redirect(`${origin}/cigibm-2026?ambassadeur=succes#ambassadeurs`, 303);
}
