import Link from "next/link";
import { getMessageBatches } from "@/lib/messaging/batches";

export default async function MessagesPage() {
  const batches = await getMessageBatches();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-leaf-900">Messages</h1>
        <Link href="/admin/messages/new" className="rounded-full bg-leaf-600 px-5 py-2.5 text-sm font-semibold text-mist-50">
          Nouveau message
        </Link>
      </div>
      <div className="mt-6 space-y-3">
        {batches.map((b) => (
          <div key={b.batchId} className="flex items-center justify-between rounded-xl border border-ink/8 bg-mist-50 px-4 py-3 text-sm">
            <div>
              <p className="font-medium">{b.batchLabel}</p>
              <p className="text-xs text-ink/50">{b.channel} · {new Date(b.sentAt).toLocaleString("fr-FR")}</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-leaf-700">{b.sentCount} envoyés</p>
              {b.failedCount > 0 && <p className="text-red-600">{b.failedCount} échoués</p>}
            </div>
          </div>
        ))}
        {batches.length === 0 && <p className="text-sm text-ink/50">Aucun envoi pour l&apos;instant.</p>}
      </div>
    </div>
  );
}
