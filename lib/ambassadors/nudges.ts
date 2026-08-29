import { db } from "@/lib/db";
import { buildAmbassadorMilestoneEmail, buildAmbassadorZeroNudgeEmail, sendTransactionalEmail } from "@/lib/email";

const SITE_URL = "https://ongtriomphedelinterieur.com";

// Le programme ambassadeurs tourne pour l'édition 4 (17 octobre 2026) : au-delà
// de cette date les nudges n'ont plus de sens, mieux vaut arrêter
// automatiquement plutôt que compter sur quelqu'un pour désactiver le cron
// à temps.
const CAMPAIGN_END = new Date("2026-10-17T00:00:00Z");

// Choix confirmés avec l'ONG : un ambassadeur encore à zéro parrainage
// reçoit une relance tous les 3 jours (ni quotidien — trop insistant sur
// les ~7 semaines qui séparent aujourd'hui de l'événement —, ni chaque
// semaine — trop espacé), en laissant d'abord passer 3 jours après son
// inscription pour ne pas empiler ce nudge sur l'email de bienvenue qu'il
// vient de recevoir.
const ZERO_NUDGE_GRACE_DAYS = 3;
const ZERO_NUDGE_INTERVAL_DAYS = 3;

// Les félicitations de palier se déclenchent tous les 5 parrainages plutôt
// que quotidiennement pour les meilleurs ambassadeurs : répéter la même
// louange chaque jour sans nouveau parrainage n'apporterait rien.
const MILESTONE_STEP = 5;

export type NudgeCandidate = {
  id: string;
  fullName: string;
  email: string;
  slug: string;
  referredCount: number;
  createdAt: Date;
  lastNudgeSentAt: Date | null;
  highestMilestoneCelebrated: number;
};

export type NudgeDecision =
  | { type: "zero"; ambassador: NudgeCandidate }
  | { type: "milestone"; ambassador: NudgeCandidate; milestone: number };

function daysSince(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
}

// Fonction pure, testée indépendamment de la base de données : décide au
// plus un nudge par ambassadeur pour cette exécution du cron.
export function selectNudge(a: NudgeCandidate, now: Date): NudgeDecision | null {
  const milestoneReached = Math.floor(a.referredCount / MILESTONE_STEP) * MILESTONE_STEP;
  if (milestoneReached > 0 && milestoneReached > a.highestMilestoneCelebrated) {
    return { type: "milestone", ambassador: a, milestone: milestoneReached };
  }

  if (a.referredCount === 0) {
    if (daysSince(a.createdAt, now) < ZERO_NUDGE_GRACE_DAYS) return null;
    if (a.lastNudgeSentAt && daysSince(a.lastNudgeSentAt, now) < ZERO_NUDGE_INTERVAL_DAYS) return null;
    return { type: "zero", ambassador: a };
  }

  return null;
}

export type NudgeRunResult = {
  campaignEnded: boolean;
  sent: { ambassadorId: string; type: "zero" | "milestone" }[];
  failed: { ambassadorId: string; error: string }[];
};

export async function runAmbassadorNudges(apiKey: string, now: Date = new Date()): Promise<NudgeRunResult> {
  if (now >= CAMPAIGN_END) {
    return { campaignEnded: true, sent: [], failed: [] };
  }

  const ambassadors = await db.ambassador.findMany({
    where: { active: true, email: { not: null } },
    include: { participants: { select: { id: true } } },
  });

  const sent: NudgeRunResult["sent"] = [];
  const failed: NudgeRunResult["failed"] = [];

  for (const a of ambassadors) {
    const candidate: NudgeCandidate = {
      id: a.id,
      fullName: a.fullName,
      // Garanti non-null par le `where: { email: { not: null } } ci-dessus
      // — Prisma ne reflète pas cette contrainte dans le type généré.
      email: a.email as string,
      slug: a.slug,
      referredCount: a.participants.length,
      createdAt: a.createdAt,
      lastNudgeSentAt: a.lastNudgeSentAt,
      highestMilestoneCelebrated: a.highestMilestoneCelebrated,
    };

    const decision = selectNudge(candidate, now);
    if (!decision) continue;

    try {
      const referralUrl = `${SITE_URL}/cigibm-2026?ref=${candidate.slug}`;
      const message =
        decision.type === "zero"
          ? buildAmbassadorZeroNudgeEmail(candidate.fullName, referralUrl)
          : buildAmbassadorMilestoneEmail(candidate.fullName, decision.milestone, candidate.referredCount, referralUrl);

      const res = await sendTransactionalEmail(apiKey, { email: candidate.email, name: candidate.fullName }, message);
      if (!res.ok) {
        failed.push({ ambassadorId: candidate.id, error: `Brevo responded ${res.status}` });
        continue;
      }

      await db.ambassador.update({
        where: { id: candidate.id },
        data: {
          lastNudgeSentAt: now,
          ...(decision.type === "milestone" ? { highestMilestoneCelebrated: decision.milestone } : {}),
        },
      });
      sent.push({ ambassadorId: candidate.id, type: decision.type });
    } catch (err) {
      failed.push({ ambassadorId: candidate.id, error: err instanceof Error ? err.message : "unknown error" });
    }
  }

  return { campaignEnded: false, sent, failed };
}
