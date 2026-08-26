import { getParticipantsForEdition } from "@/lib/admin/participants";

const EDITIONS = [1, 2, 3, 4];

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ edition?: string }>;
}) {
  const { edition } = await searchParams;
  const requestedEdition = Number(edition) || 4;
  // Le sélecteur ne propose que les éditions 1 à 4 : toute autre valeur dans
  // l'URL (typo, lien obsolète) retombe sur l'édition 4 plutôt que de faire
  // planter la page — getParticipantsForEdition lève pour un numéro inconnu.
  const editionNumber = EDITIONS.includes(requestedEdition) ? requestedEdition : 4;
  const result = await getParticipantsForEdition(editionNumber);

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Participants</h1>
      <div className="mt-4 flex gap-2">
        {EDITIONS.map((n) => (
          <a
            key={n}
            href={`/admin/participants?edition=${n}`}
            className={`rounded-full border px-4 py-1.5 text-sm ${
              n === editionNumber ? "border-leaf-600 bg-leaf-600 text-mist-50" : "border-ink/15 text-ink/70"
            }`}
          >
            Édition {n}
          </a>
        ))}
      </div>

      <div className="mt-6">
        {!result.available ? (
          <p className="rounded-xl border border-ink/8 bg-mist-50 p-6 text-sm text-ink/60">
            Données non disponibles pour cette édition.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ink/8">
            <table className="w-full text-sm">
              <thead className="bg-mist-50 text-left text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Téléphone</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Ambassadeur</th>
                  <th className="px-4 py-3">Présence</th>
                </tr>
              </thead>
              <tbody>
                {result.participants.map((p) => (
                  <tr key={p.id} className="border-t border-ink/8">
                    <td className="px-4 py-3">{p.fullName}</td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3">{p.email ?? "—"}</td>
                    <td className="px-4 py-3">{p.ambassadorName ?? "—"}</td>
                    <td className="px-4 py-3">{p.attendedAt ? "Présent·e" : "—"}</td>
                  </tr>
                ))}
                {result.participants.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-ink/50">
                      Aucun participant pour l&apos;instant.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
