"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import type { FormState } from "@/lib/forms";

const BUCKET = "attachments";

const recordSchema = z
  .object({
    company_id: z.uuid(),
    deal_id: z.uuid().nullish(),
    activity_id: z.uuid().nullish(),
    storage_path: z.string().min(1).max(500),
    file_name: z.string().trim().min(1).max(255),
    mime_type: z.string().max(200).nullish(),
    size_bytes: z.number().int().min(0).max(10 * 1024 * 1024),
  })
  .refine((a) => a.storage_path.startsWith(`${a.company_id}/`) && !a.storage_path.includes(".."), {
    message: "path",
  });

/**
 * Saves the details of a file the browser has just uploaded to Storage.
 * If that fails, the uploaded file is removed so nothing is left orphaned.
 */
export async function recordAttachment(input: z.input<typeof recordSchema>): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const parsed = recordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "generic" };

  const { data, error } = await supabase.from("attachments").insert(parsed.data).select("id").single();
  if (error || !data) {
    console.error("recordAttachment", error);
    await supabase.storage.from(BUCKET).remove([parsed.data.storage_path]);
    return { ok: false, message: "generic" };
  }
  revalidatePath("/", "layout");
  return { ok: true, id: data.id };
}

export async function deleteAttachment(id: string): Promise<FormState> {
  const { supabase } = await requireRole("owner", "sales");
  const { data, error } = await supabase.from("attachments").delete().eq("id", id).select("storage_path");
  if (error) return { ok: false, message: "generic" };
  if (!data?.length) return { ok: false, message: "notAllowed" };
  await supabase.storage.from(BUCKET).remove([data[0].storage_path]);
  revalidatePath("/", "layout");
  return { ok: true };
}
