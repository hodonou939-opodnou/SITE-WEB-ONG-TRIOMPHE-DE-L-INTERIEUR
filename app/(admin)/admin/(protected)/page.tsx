import { getDashboardStats } from "@/lib/admin/dashboard";

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Tableau de bord</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink/50">Participants au total</p>
          <p className="mt-2 font-display text-3xl text-leaf-900">{stats.totalParticipants}</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-mist-50 p-6">
          <p className="text-xs uppercase tracking-wide text-ink/50">Présents aujourd&apos;hui</p>
          <p className="mt-2 font-display text-3xl text-leaf-900">{stats.attendedToday}</p>
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/60">Par édition</h2>
        <ul className="mt-3 space-y-2">
          {stats.participantsByEdition.map((e) => (
            <li key={e.editionNumber} className="flex justify-between rounded-xl border border-ink/8 bg-mist-50 px-4 py-3 text-sm">
              <span>Édition {e.editionNumber}</span>
              <span className="font-semibold">{e.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
