import { NextRequest, NextResponse } from "next/server";
import { runAmbassadorNudges } from "@/lib/ambassadors/nudges";

export const maxDuration = 60;

// Vercel invoke ce endpoint une fois par jour (cf. vercel.json, "crons") et
// ajoute automatiquement cet en-tête dès que CRON_SECRET est défini côté
// projet — ce qui empêche n'importe qui d'appeler cette route à la demande
// pour spammer les ambassadeurs.
function isAuthorizedCronRequest(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY missing" }, { status: 500 });
  }

  const result = await runAmbassadorNudges(apiKey);
  return NextResponse.json(result);
}
