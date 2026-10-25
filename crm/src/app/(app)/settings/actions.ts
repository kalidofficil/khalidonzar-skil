"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { serviceSchema } from "@/lib/validation/service";

/** Adds a service, or updates it when the form includes an `id`. Owner only. */
export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireRole("owner");
  const values = formValues(formData);
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const id = values.id || null;
  const { error } = id
    ? await supabase.from("services").update(parsed.data).eq("id", id)
    : await supabase.from("services").insert({ ...parsed.data, sort_order: 1000 });
  if (error) {
    console.error("saveService", error);
    // 23505 = a service with this name already exists
    return { ok: false, message: error.code === "23505" ? "duplicateName" : "generic", values };
  }
  revalidatePath("/settings");
  return { ok: true };
}
