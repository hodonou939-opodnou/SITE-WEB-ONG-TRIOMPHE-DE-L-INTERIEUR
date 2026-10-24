import Link from "next/link";
import { requireAdmin } from "@/lib/admin/auth";
import FunderForm from "../FunderForm";
import { createFunderAction } from "../actions";

export default async function NewFunderPage() {
  await requireAdmin();
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/partenaires" className="text-sm text-leaf-700 underline underline-offset-4">← Retour</Link>
      <h1 className="mt-2 font-display text-2xl text-leaf-900 sm:text-3xl">Nouvelle fiche</h1>
      <FunderForm action={createFunderAction} submitLabel="Créer la fiche" />
    </div>
  );
}
