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
      <section className="flex min-h-screen items-center justify-center bg-leaf-950 px-6 text-center">
        <p className="text-mist-50">
          Lien invalide. Vérifiez le lien reçu par email, ou{" "}
          <a href="/cigibm-2026" className="underline">
            inscrivez-vous
          </a>{" "}
          si ce n&apos;est pas déjà fait.
        </p>
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
