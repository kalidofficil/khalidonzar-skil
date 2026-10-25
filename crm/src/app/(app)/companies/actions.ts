"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { companySchema } from "@/lib/validation/company";

/** Creates a company, or updates it when the form includes an `id`. */
export async function saveCompany(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const values = formValues(formData);
  const parsed = companySchema.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const id = values.id || null;
  const result = id
    ? await supabase.from("companies").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("companies").insert(parsed.data).select("id").single();

  if (result.error || !result.data) {
    console.error("saveCompany", result.error);
    return { ok: false, message: "generic", values };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: `/companies/${result.data.id}` };
}

export async function deleteCompany(id: string): Promise<FormState> {
  const { supabase } = await requireRole("owner");
  // .select() returns the deleted rows, so we can tell "deleted" from
  // "the database's security rules didn't allow it" (zero rows).
  const { data, error } = await supabase.from("companies").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "generic" };
  if (!data?.length) return { ok: false, message: "notAllowed" };
  revalidatePath("/", "layout");
  return { ok: true };
}
