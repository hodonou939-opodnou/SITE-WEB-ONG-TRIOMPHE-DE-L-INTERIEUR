import type { Metadata } from "next";
import { db } from "@/lib/db";
import BadgeGenerator from "@/components/badge/BadgeGenerator";

export const metadata: Metadata = {
  title: "Mon badge « J'y serai », CIGIBM 2026",
  robots: { index: false },
};

export default async function BadgePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const participant = await db.participant.findUnique({ where: { attendanceToken: token } });

  if (!participant) {
    return (
      <section className="flex min-h-screen items-center justify-center bg-leaf-950 px-6 py-16">
        <div className="mx-auto max-w-md rounded-2xl border border-leaf-400/30 bg-leaf-500/10 p-5 text-center">
          <p className="font-display text-lg leading-snug text-mist-50">
            Oups ! Vous n&apos;avez pas encore réservé votre place.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-mist-100/80">
            Inscrivez-vous, c&apos;est gratuit — et créez votre badge « J&apos;y serai » juste après.
          </p>
          <a
            href="/cigibm-2026"
            className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-leaf-500 px-6 py-3 text-sm font-semibold text-leaf-950 transition-opacity hover:opacity-90"
          >
            Cliquez ici pour vous inscrire
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen bg-leaf-950 px-6 py-16">
      <div className="mx-auto max-w-md">
        <h1 className="mb-8 text-center font-display text-2xl text-mist-50">Votre badge « J&apos;y serai »</h1>
        <BadgeGenerator fullName={participant.fullName} attendanceToken={participant.attendanceToken} />
      </div>
    </section>
  );
}
