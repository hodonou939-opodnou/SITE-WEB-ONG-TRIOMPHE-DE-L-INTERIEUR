import Link from "next/link";
import { listAmbassadorsWithStats } from "@/lib/admin/ambassadors";
import AmbassadorsTable from "./AmbassadorsTable";

export default async function AmbassadorsPage() {
  const ambassadors = await listAmbassadorsWithStats();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-leaf-900">Ambassadeurs</h1>
        <Link
          href="/admin/ambassadors/new"
          className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-mist-50"
        >
          Nouvel ambassadeur
        </Link>
      </div>

      <div className="mt-6">
        <AmbassadorsTable ambassadors={ambassadors} />
      </div>
    </div>
  );
}
