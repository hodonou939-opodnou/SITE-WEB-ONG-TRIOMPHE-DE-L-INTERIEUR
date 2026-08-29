import { getParticipantsForEdition } from "@/lib/admin/participants";
import ParticipantsTable from "./ParticipantsTable";

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
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {EDITIONS.map((n) => (
          <a
            key={n}
            href={`/admin/participants?edition=${n}`}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${
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
          <ParticipantsTable participants={result.participants} />
        )}
      </div>
    </div>
  );
}
