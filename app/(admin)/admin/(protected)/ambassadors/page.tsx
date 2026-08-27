import Link from "next/link";
import { listAmbassadorsWithStats } from "@/lib/admin/ambassadors";
import CopyReferralLink from "./CopyReferralLink";

const SITE_URL = "https://ongtriomphedelinterieur.com";

export default async function AmbassadorsPage() {
  const ambassadors = await listAmbassadorsWithStats();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-leaf-900">Ambassadeurs</h1>
        <Link href="/admin/ambassadors/new" className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-mist-50">
          Nouvel ambassadeur
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-ink/8">
        <table className="w-full text-sm">
          <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Lien de parrainage</th>
              <th className="px-4 py-3">Inscrit·e·s</th>
              <th className="px-4 py-3">Présent·e·s</th>
              <th className="px-4 py-3">Taux</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {ambassadors.map((a) => {
              const referralUrl = `${SITE_URL}/cigibm-2026?ref=${a.slug}`;
              // Taux de présence parmi les personnes parrainées : n'a de sens
              // que s'il y a au moins un·e inscrit·e, sinon on affiche un tiret
              // plutôt qu'un 0% trompeur (division par zéro évitée).
              const rate = a.referredCount > 0 ? Math.round((a.attendedCount / a.referredCount) * 100) : null;
              return (
                <tr key={a.id} className="border-t border-ink/8">
                  <td className="px-4 py-3 font-medium text-leaf-900">{a.fullName}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code className="rounded bg-mist-100 px-2 py-1 text-xs text-ink/70">/cigibm-2026?ref={a.slug}</code>
                      <CopyReferralLink url={referralUrl} />
                    </div>
                  </td>
                  <td className="px-4 py-3">{a.referredCount}</td>
                  <td className="px-4 py-3">{a.attendedCount}</td>
                  <td className="px-4 py-3">{rate === null ? "—" : `${rate}%`}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${a.active ? "bg-leaf-50 text-leaf-700" : "bg-ink/8 text-ink/50"}`}>
                      {a.active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/ambassadors/${a.id}/edit`} className="text-leaf-700 underline underline-offset-2">
                      Modifier
                    </Link>
                  </td>
                </tr>
              );
            })}
            {ambassadors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-ink/50">
                  Aucun ambassadeur pour l&apos;instant.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
