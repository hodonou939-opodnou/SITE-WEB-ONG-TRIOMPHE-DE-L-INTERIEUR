"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createFunder, deleteFunder, setFunderStatus, updateFunder, validateFunderForm } from "@/lib/admin/funders";
import type { FunderStatusKey } from "@/lib/funders-meta";

export type FunderFormState = { error?: string; values?: Record<string, string> } | null;

function submittedValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === "string") out[key] = value;
  return out;
}

export async function createFunderAction(_prev: FunderFormState, formData: FormData): Promise<FunderFormState> {
  await requireAdmin();
  const checked = validateFunderForm(formData);
  if (!checked.ok) return { error: checked.error, values: submittedValues(formData) };
  await createFunder(checked.value);
  revalidatePath("/admin/partenaires");
  redirect("/admin/partenaires");
}

export async function updateFunderAction(id: string, _prev: FunderFormState, formData: FormData): Promise<FunderFormState> {
  await requireAdmin();
  const checked = validateFunderForm(formData);
  if (!checked.ok) return { error: checked.error, values: submittedValues(formData) };
  await updateFunder(id, checked.value);
  revalidatePath("/admin/partenaires");
  redirect("/admin/partenaires");
}

export async function setFunderStatusAction(id: string, status: FunderStatusKey) {
  await requireAdmin();
  await setFunderStatus(id, status);
  revalidatePath("/admin/partenaires");
}

export async function deleteFunderAction(id: string) {
  await requireAdmin();
  await deleteFunder(id);
  revalidatePath("/admin/partenaires");
  redirect("/admin/partenaires");
}
