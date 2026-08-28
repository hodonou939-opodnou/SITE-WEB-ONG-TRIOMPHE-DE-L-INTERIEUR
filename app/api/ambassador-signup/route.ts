import { NextRequest, NextResponse } from "next/server";
import { createAmbassador } from "@/lib/admin/ambassadors";
import { uploadAmbassadorPhoto } from "@/lib/ambassadors/photo";
import { buildAmbassadorPendingApprovalAdminNotification, buildAmbassadorSignupEmail, sendTransactionalEmail } from "@/lib/email";
import { siteConfig } from "@/lib/content";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

// Même raisonnement que app/api/cigibm-register/route.ts (Task 8/9 de ce
// projet) : la création Ambassador puis l'envoi email peuvent, dans le pire
// des cas, dépasser le timeout par défaut de la plateforme avant que les
// blocs try/catch ci-dessous n'aient eu la main.
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (err) {
    // Content-Type absent/non multipart, corps mal formé, etc. — jamais
    // déclenché par le formulaire réel (le navigateur pose toujours un
    // Content-Type multipart correct), mais un POST direct forgé sur cette
    // route publique le peut. Sans ce garde, la requête levait un 500 brut
    // sans redirection au lieu de l'état d'erreur normal de la page.
    console.error("Ambassador signup formData parse failed", err);
    return NextResponse.redirect(`${origin}/cigibm?ambassadeur=erreur#ambassadeurs`, 303);
  }

  const fullName = formData.get("fullName")?.toString().trim();
  const phoneRaw = formData.get("phone")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const consent = formData.get("consent")?.toString();

  if (!fullName || !phoneRaw || !email || consent !== "1") {
    return NextResponse.redirect(`${origin}/cigibm?ambassadeur=erreur#ambassadeurs`, 303);
  }

  const phone = normalizePhone(phoneRaw);
  const apiKey = process.env.BREVO_API_KEY;

  // Détection de doublon (même email OU même téléphone) : plutôt que de
  // créer un second compte, on renvoie simplement le lien existant à la
  // personne. Vérifié avant l'upload de la photo — inutile de l'uploader
  // pour un compte qui ne sera jamais créé.
  try {
    const existing = await db.ambassador.findFirst({ where: { OR: [{ email }, { phone }] } });
    if (existing) {
      if (apiKey) {
        try {
          const referralUrl = `${origin}/cigibm-2026?ref=${existing.slug}`;
          const message = buildAmbassadorSignupEmail(fullName, referralUrl);
          const emailRes = await sendTransactionalEmail(apiKey, { email, name: fullName }, message);
          if (!emailRes.ok) {
            console.error("Ambassador link resend failed", emailRes.status, await emailRes.text().catch(() => ""));
          }
        } catch (err) {
          console.error("Ambassador link resend request failed", err);
        }
      } else {
        console.error("BREVO_API_KEY is not configured, skipping ambassador link resend");
      }

      return NextResponse.redirect(`${origin}/cigibm?ambassadeur=existant&ref=${existing.slug}#ambassadeurs`, 303);
    }
  } catch (err) {
    // Une panne de la vérification de doublon ne doit pas empêcher une
    // inscription par ailleurs légitime — on continue vers la création
    // normale plutôt que d'échouer la requête entière.
    console.error("Ambassador duplicate check failed, continuing with normal signup", { email }, err);
  }

  // La photo est optionnelle et son échec ne doit jamais bloquer la
  // création du compte ambassadeur : au pire, le carrousel public retombe
  // sur l'avatar par défaut (ImagePlaceholder) une fois le compte validé.
  const photoFile = formData.get("photo");
  let photoUrl: string | undefined;
  if (photoFile instanceof File && photoFile.size > 0) {
    try {
      photoUrl = await uploadAmbassadorPhoto(photoFile);
    } catch (err) {
      console.error("Ambassador photo upload failed, continuing without photo", { email }, err);
    }
  }

  let ambassadorId: string;
  let slug: string;
  try {
    // active: false — un ambassadeur qui s'inscrit lui-même reste invisible
    // du carrousel public tant qu'un admin ne l'a pas validé depuis
    // /admin/ambassadors (choix explicite de l'utilisateur : approbation
    // requise plutôt qu'une mise en ligne immédiate).
    const result = await createAmbassador({ fullName, phone, email, photoUrl, active: false });
    ambassadorId = result.id;
    slug = result.slug;
  } catch (err) {
    console.error("Ambassador self-signup creation failed", { email }, err);
    return NextResponse.redirect(`${origin}/cigibm?ambassadeur=erreur#ambassadeurs`, 303);
  }

  const referralUrl = `${origin}/cigibm-2026?ref=${slug}`;

  // Ni l'un ni l'autre de ces deux envois ne doit jamais faire échouer
  // l'inscription elle-même : le compte ambassadeur est déjà créé. Deux
  // try/catch indépendants pour que l'échec de l'un ne bloque jamais
  // l'autre.
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

    // L'approbation est entièrement manuelle (aucune tâche planifiée) :
    // sans cette notification, l'administration ne découvre une nouvelle
    // candidature qu'en consultant /admin/ambassadors de sa propre
    // initiative, ce qui rend illusoire la promesse de validation "sous
    // quelques minutes" faite à l'ambassadeur ci-dessus.
    try {
      const adminMessage = buildAmbassadorPendingApprovalAdminNotification(ambassadorId, fullName, email);
      const adminEmailRes = await sendTransactionalEmail(apiKey, { email: siteConfig.email, name: siteConfig.name }, adminMessage);
      if (!adminEmailRes.ok) {
        console.error("Admin pending-approval notification failed", adminEmailRes.status, await adminEmailRes.text().catch(() => ""));
      }
    } catch (err) {
      console.error("Admin pending-approval notification request failed", err);
    }
  } else {
    console.error("BREVO_API_KEY is not configured, skipping ambassador signup emails");
  }

  return NextResponse.redirect(`${origin}/cigibm?ambassadeur=succes&ref=${slug}#ambassadeurs`, 303);
}
