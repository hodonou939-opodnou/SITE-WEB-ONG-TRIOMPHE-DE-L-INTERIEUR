import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { getFunder } from "@/lib/admin/funders";
import FunderForm from "../FunderForm";
import { DeleteFunderButton } from "../StatusSelect";
import { updateFunderAction } from "../actions";

export default async function EditFunderPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const funder = await getFunder(id);
  if (!funder) notFound();

  const initial = Object.fromEntries(
    Object.entries({
      name: funder.name,
      kind: funder.kind,
      country: funder.country,
      scope: funder.scope,
      focus: funder.focus,
      relevance: String(funder.relevance),
      why: funder.why,
      howToApply: funder.howToApply,
      website: funder.website,
      applyUrl: funder.applyUrl,
      contactEmail: funder.contactEmail,
      contactPhone: funder.contactPhone,
      contactFormUrl: funder.contactFormUrl,
      linkedinUrl: funder.linkedinUrl,
      sourceUrl: funder.sourceUrl,
      deadline: funder.deadline?.toISOString().slice(0, 10),
      notes: funder.notes,
    }).map(([k, v]) => [k, v ?? ""])
  );

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/partenaires" className="text-sm text-leaf-700 underline underline-offset-4">← Retour</Link>
      <h1 className="mt-2 break-words font-display text-2xl text-leaf-900 sm:text-3xl">{funder.name}</h1>
      <FunderForm action={updateFunderAction.bind(null, funder.id)} initial={initial} submitLabel="Enregistrer" />
      <div className="mt-10 border-t border-ink/10 pt-6">
        <DeleteFunderButton id={funder.id} />
      </div>
    </div>
  );
}
