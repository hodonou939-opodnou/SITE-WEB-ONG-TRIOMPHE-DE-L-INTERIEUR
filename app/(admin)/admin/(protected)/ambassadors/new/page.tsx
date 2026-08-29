import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createAmbassador } from "@/lib/admin/ambassadors";
import { uploadAmbassadorPhoto } from "@/lib/ambassadors/photo";
import { addAmbassadorToBrevoList } from "@/lib/email";
import { normalizePhone } from "@/lib/phone";
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

    const email = formData.get("email")?.toString().trim() || undefined;

    // Le fichier téléversé prend le pas sur l'URL saisie à la main : celle-ci
    // ne sert que si aucun fichier n'a été choisi (photo déjà hébergée
    // ailleurs, ou saisie manuelle historique). Un échec d'upload ne doit
    // jamais bloquer la création de l'ambassadeur.
    const photoFile = formData.get("photo");
    let photoUrl = formData.get("photoUrl")?.toString().trim() || undefined;
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        photoUrl = await uploadAmbassadorPhoto(photoFile);
      } catch (err) {
        console.error("Admin ambassador photo upload failed, continuing without it", err);
      }
    }

    await createAmbassador({
      fullName,
      phone,
      whatsappNumber: formData.get("whatsappNumber")?.toString().trim() || undefined,
      email,
      photoUrl,
      bio: formData.get("bio")?.toString().trim() || undefined,
    });

    // Best-effort, comme pour l'inscription publique : donne à cet
    // ambassadeur une visibilité dans le CRM Brevo (Contacts), distinct des
    // emails transactionnels qui n'en créent jamais.
    const apiKey = process.env.BREVO_API_KEY;
    if (apiKey && email) {
      try {
        await addAmbassadorToBrevoList(apiKey, email, fullName, normalizePhone(phone));
      } catch (err) {
        console.error("Adding admin-created ambassador to Brevo list failed", err);
      }
    }

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
