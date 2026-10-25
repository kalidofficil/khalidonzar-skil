"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { contactSchema } from "@/lib/validation/contact";

/** Creates a contact, or updates it when the form includes an `id`. */
export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const values = formValues(formData);
  const parsed = contactSchema.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const contact = parsed.data;
  // Don't store the WhatsApp number twice if it's the same as the phone.
  if (contact.whatsapp === contact.phone) contact.whatsapp = null;

  const id = values.id || null;
  const result = id
    ? await supabase.from("contacts").update(contact).eq("id", id).select("id, company_id").single()
    : await supabase.from("contacts").insert(contact).select("id, company_id").single();

  if (result.error || !result.data) {
    console.error("saveContact", result.error);
    return { ok: false, message: "generic", values };
  }

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: `/companies/${result.data.company_id}` };
}

export async function deleteContact(id: string): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const { data, error } = await supabase.from("contacts").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "generic" };
  if (!data?.length) return { ok: false, message: "notAllowed" };
  revalidatePath("/", "layout");
  return { ok: true };
}
