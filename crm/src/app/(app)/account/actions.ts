"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { requiredText } from "@/lib/validation/fields";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const values = formValues(formData);
  const parsed = z.object({ full_name: requiredText(120) }).safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name })
    .eq("id", user.id);
  if (error) return { ok: false, message: "generic", values };

  revalidatePath("/", "layout");
  return { ok: true, values };
}

const passwordSchema = z
  .object({
    password: z.string().min(10, "passwordTooShort").max(200, "tooLong"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { message: "passwordsDontMatch", path: ["confirm"] });

export async function updatePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireUser();
  const parsed = passwordSchema.safeParse(formValues(formData));
  // Never echo passwords back to the browser.
  if (!parsed.success) return validationFailed(parsed.error, {});

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
