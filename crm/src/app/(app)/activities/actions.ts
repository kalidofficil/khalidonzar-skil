"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { activitySchema } from "@/lib/validation/activity";

/** Logs an activity, or updates it when the form includes an `id`. */
export async function saveActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const values = formValues(formData);
  const parsed = activitySchema.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const id = values.id || null;
  const result = id
    ? await supabase.from("activities").update(parsed.data).eq("id", id).select("id").single()
    : await supabase.from("activities").insert(parsed.data).select("id").single();

  if (result.error || !result.data) {
    console.error("saveActivity", result.error);
    const mismatch = result.error?.code === "23514";
    return { ok: false, message: mismatch ? "contactCompanyMismatch" : "generic", values };
  }

  revalidatePath("/", "layout");
  return { ok: true, id: result.data.id };
}

export async function deleteActivity(id: string): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const { data, error } = await supabase.from("activities").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "generic" };
  if (!data?.length) return { ok: false, message: "notAllowed" };
  revalidatePath("/", "layout");
  return { ok: true };
}

export type LogOptions = {
  companies: { id: string; name: string }[];
  /** Company of the deal, when the dialog was opened from a deal. */
  companyId: string | null;
};

/** Companies for the picker, and the deal's company if opened from a deal. */
export async function getLogOptions(dealId?: string | null): Promise<LogOptions> {
  const { supabase } = await requireRole("owner", "sales");
  const [{ data: companies }, deal] = await Promise.all([
    supabase.from("companies").select("id, name").neq("status", "archived").order("last_activity_at", {
      ascending: false,
      nullsFirst: false,
    }),
    dealId && z.uuid().safeParse(dealId).success
      ? supabase.from("deals").select("company_id").eq("id", dealId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  return { companies: companies ?? [], companyId: deal.data?.company_id ?? null };
}

/** Contacts and open deals of one company, for the log form. */
export async function getCompanyLogOptions(companyId: string) {
  const { supabase } = await requireRole("owner", "sales");
  if (!z.uuid().safeParse(companyId).success) return { contacts: [], deals: [] };
  const [contacts, deals] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, full_name")
      .eq("company_id", companyId)
      .order("is_primary", { ascending: false })
      .order("full_name"),
    supabase
      .from("deals")
      .select("id, title, stage")
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false }),
  ]);
  return { contacts: contacts.data ?? [], deals: deals.data ?? [] };
}
