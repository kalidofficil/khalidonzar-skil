import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listAttachments(where: { companyId?: string; dealId?: string }) {
  const supabase = await createClient();
  let query = supabase
    .from("attachments")
    .select("id, file_name, mime_type, size_bytes, created_at, deal_id, activity_id, created_by");
  if (where.dealId) query = query.eq("deal_id", where.dealId);
  else if (where.companyId) query = query.eq("company_id", where.companyId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type AttachmentItem = Awaited<ReturnType<typeof listAttachments>>[number];
