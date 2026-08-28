import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Étape "Configure Webhooks" du tableau de bord Meta for Developers
// (Connect on WhatsApp > Production setup). Meta appelle GET une seule
// fois, au moment où on clique "Verify and save", pour prouver qu'on
// contrôle bien cette URL.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden", { status: 403 });
}

// WHATSAPP_APP_SECRET (App Settings > Basic > App Secret, distinct du
// verify token ci-dessus) n'est pas encore fourni : tant qu'il est absent,
// la vérification de signature est sautée plutôt que de bloquer tous les
// événements entrants — même logique de dégradation que BREVO_API_KEY
// ailleurs dans ce projet. À fournir dès que possible pour durcir cette
// route contre des requêtes forgées.
function hasValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return true;
  if (!signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const receivedBuf = Buffer.from(signatureHeader);
  if (expectedBuf.length !== receivedBuf.length) return false;

  return timingSafeEqual(expectedBuf, receivedBuf);
}

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: Array<{ id: string; status: string }>;
        messages?: Array<{ id: string; from: string; type: string }>;
      };
    }>;
  }>;
};

// Meta exige un accusé 200 rapide, sans quoi il retente puis finit par
// désactiver le webhook — les blocs ci-dessous restent donc best-effort et
// ne doivent jamais faire échouer la réponse.
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!hasValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    console.error("WhatsApp webhook: invalid JSON body", err);
    return NextResponse.json({ ok: true });
  }

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        try {
          await db.messagingLog.updateMany({
            where: { providerMessageId: status.id },
            data: { status: status.status === "failed" ? "failed" : "sent" },
          });
        } catch (err) {
          console.error("WhatsApp webhook: status update failed", status, err);
        }
      }

      for (const message of change.value?.messages ?? []) {
        // Pas encore de boîte de réception WhatsApp côté admin : on se
        // contente de tracer l'événement pour l'instant, à brancher sur une
        // vraie table le jour où ce besoin est confirmé.
        console.log("WhatsApp webhook: inbound message received", {
          from: message.from,
          type: message.type,
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
