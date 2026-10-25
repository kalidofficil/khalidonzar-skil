"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { topPositionInStage } from "@/lib/data/deals";
import { formValues, validationFailed, type FormState } from "@/lib/forms";
import { STAGE_PROBABILITY, type DealStage } from "@/lib/pipeline";
import { dealSchema, moveDealSchema } from "@/lib/validation/deal";

/** Creates a deal, or updates it when the form includes an `id`. */
export async function saveDeal(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  // Ticked services come as several "service_ids" values; keep them for refilling the form.
  const values: Record<string, string> = {
    ...formValues(formData),
    service_ids: formData.getAll("service_ids").join(","),
  };
  const parsed = dealSchema.safeParse(values);
  if (!parsed.success) return validationFailed(parsed.error, values);

  const serviceIds = z.array(z.uuid()).safeParse(formData.getAll("service_ids"));
  if (!serviceIds.success) return { ok: false, message: "invalidOption", values };

  // An empty probability means "use the stage's default".
  const deal = { ...parsed.data, probability: parsed.data.probability ?? STAGE_PROBABILITY[parsed.data.stage] };

  const id = values.id || null;
  const result = id
    ? await supabase.from("deals").update(deal).eq("id", id).select("id").single()
    : await supabase
        .from("deals")
        .insert({ ...deal, position: await topPositionInStage(deal.stage) })
        .select("id")
        .single();

  if (result.error || !result.data) {
    console.error("saveDeal", result.error);
    const mismatch = result.error?.code === "23514";
    return { ok: false, message: mismatch ? "contactCompanyMismatch" : "generic", values };
  }
  const dealId = result.data.id;

  // Make the deal's services match the ticked boxes.
  const wanted = serviceIds.data;
  const del = supabase.from("deal_services").delete().eq("deal_id", dealId);
  const { error: delError } = wanted.length
    ? await del.not("service_id", "in", `(${wanted.join(",")})`)
    : await del;
  const { error: addError } = wanted.length
    ? await supabase
        .from("deal_services")
        .upsert(wanted.map((service_id) => ({ deal_id: dealId, service_id })), { ignoreDuplicates: true })
    : { error: null };
  if (delError || addError) console.error("saveDeal services", delError ?? addError);

  revalidatePath("/", "layout");
  return { ok: true, redirectTo: `/deals/${dealId}` };
}

/**
 * Moves a deal to a stage and/or a new place in a board column.
 * Called by drag-and-drop and by the "Move to…" menus.
 */
export async function moveDeal(input: {
  id: string;
  stage: DealStage;
  position?: number;
  lost_reason?: string | null;
  lost_note?: string | null;
}): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const position = input.position ?? (await topPositionInStage(input.stage));
  const parsed = moveDealSchema.safeParse({ ...input, position });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "generic" };

  const { id, ...changes } = parsed.data;
  const { data, error } = await supabase
    .from("deals")
    .update({
      stage: changes.stage,
      position: changes.position,
      ...(changes.stage === "lost" ? { lost_reason: changes.lost_reason, lost_note: changes.lost_note || null } : {}),
    })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("moveDeal", error);
    return { ok: false, message: "generic" };
  }
  if (!data?.length) return { ok: false, message: "notAllowed" };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<FormState> {
  const { supabase } = await requireRole("owner");
  const { data, error } = await supabase.from("deals").delete().eq("id", id).select("id");
  if (error) return { ok: false, message: "generic" };
  if (!data?.length) return { ok: false, message: "notAllowed" };
  revalidatePath("/", "layout");
  return { ok: true };
}

/** Contacts of a company, for the "main contact" picker. */
export async function getCompanyContacts(companyId: string) {
  const { supabase } = await requireRole("owner", "sales");
  if (!z.uuid().safeParse(companyId).success) return [];
  const { data } = await supabase
    .from("contacts")
    .select("id, full_name, is_primary")
    .eq("company_id", companyId)
    .order("is_primary", { ascending: false })
    .order("full_name");
  return data ?? [];
}
