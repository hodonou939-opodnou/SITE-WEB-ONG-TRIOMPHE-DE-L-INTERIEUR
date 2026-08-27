import { notFound, redirect } from "next/navigation";
import { getAmbassador, updateAmbassador } from "@/lib/admin/ambassadors";
import AmbassadorForm from "../../AmbassadorForm";

export default async function EditAmbassadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { id } = await params;
  const { erreur } = await searchParams;
  const ambassador = await getAmbassador(id);

  if (!ambassador) notFound();

  async function updateAmbassadorAction(formData: FormData) {
    "use server";

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();

    if (!fullName || !phone) {
      redirect(`/admin/ambassadors/${id}/edit?erreur=1`);
    }

    await updateAmbassador(id, {
      fullName,
      phone,
      whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || null,
      email: formData.get("email")?.toString().trim() || null,
      photoUrl: formData.get("photoUrl")?.toString().trim() || null,
      bio: formData.get("bio")?.toString().trim() || null,
      active: formData.get("active") === "on",
    });

    redirect("/admin/ambassadors");
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Modifier {ambassador.fullName}</h1>
      {erreur && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Le nom et le téléphone sont obligatoires.
        </p>
      )}
      <div className="mt-6">
        <AmbassadorForm
          ambassador={ambassador}
          action={updateAmbassadorAction}
          submitLabel="Enregistrer"
          showActiveToggle={true}
        />
      </div>
    </div>
  );
}
