import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createAmbassador } from "@/lib/admin/ambassadors";
import AmbassadorForm from "../AmbassadorForm";

export default async function NewAmbassadorPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const { erreur } = await searchParams;

  async function createAmbassadorAction(formData: FormData) {
    "use server";

    await requireAdmin();

    const fullName = formData.get("fullName")?.toString().trim();
    const phone = formData.get("phone")?.toString().trim();

    if (!fullName || !phone) {
      redirect("/admin/ambassadors/new?erreur=1");
    }

    await createAmbassador({
      fullName,
      phone,
      whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || undefined,
      email: formData.get("email")?.toString().trim() || undefined,
      photoUrl: formData.get("photoUrl")?.toString().trim() || undefined,
      bio: formData.get("bio")?.toString().trim() || undefined,
    });

    redirect("/admin/ambassadors");
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-leaf-900">Nouvel ambassadeur</h1>
      {erreur && (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
          Le nom et le téléphone sont obligatoires.
        </p>
      )}
      <div className="mt-6">
        <AmbassadorForm action={createAmbassadorAction} submitLabel="Créer l'ambassadeur" showActiveToggle={false} />
      </div>
    </div>
  );
}
