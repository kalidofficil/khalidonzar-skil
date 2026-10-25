"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { formValues, type FormState } from "@/lib/forms";
import { safeNextPath } from "@/lib/links";

const signInSchema = z.object({
  email: z.email("invalidEmail"),
  password: z.string().min(1, "required"),
});

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const values = formValues(formData);
  const parsed = signInSchema.safeParse({
    email: values.email?.trim().toLowerCase(),
    password: values.password,
  });
  // Never send the password back to the browser.
  const safeValues = { email: values.email ?? "" };
  if (!parsed.success) return { ok: false, message: "invalidCredentials", values: safeValues };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { ok: false, message: "invalidCredentials", values: safeValues };

  return { ok: true, redirectTo: safeNextPath(values.next) };
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = z.email().safeParse(email);
  if (parsed.success) {
    const supabase = await createClient();
    // The email links to /auth/confirm, which signs the user in and opens
    // /account to choose a new password (template in docs/SETUP.md).
    await supabase.auth.resetPasswordForEmail(parsed.data);
  }
  // Same answer whether or not the account exists, so the form can't be used
  // to discover who has an account.
  return { ok: true, values: { email } };
}
