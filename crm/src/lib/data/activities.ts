import "server-only";
import { createClient } from "@/lib/supabase/server";

const TIMELINE_COLUMNS =
  "id, company_id, deal_id, contact_id, occurred_at, channel, summary, outcome, next_step, next_step_date, created_by, created_at, contact:contacts(id, full_name), deal:deals(id, title), author:profiles!activities_created_by_fkey(full_name, email), attachments(id, file_name, mime_type, size_bytes)";

/** Conversation history for a company (all its deals included) or one deal. */
export async function listTimeline(where: { companyId?: string; dealId?: string }, limit = 100) {
  const supabase = await createClient();
  let query = supabase.from("activities").select(TIMELINE_COLUMNS);
  if (where.dealId) query = query.eq("deal_id", where.dealId);
  else if (where.companyId) query = query.eq("company_id", where.companyId);
  const { data, error } = await query.order("occurred_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return data ?? [];
}

export type TimelineItem = Awaited<ReturnType<typeof listTimeline>>[number];

export async function searchActivities(q: string, limit = 8) {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .rpc("search_activities", { q }, { count: "exact" })
    .select("id, occurred_at, channel, summary, company:companies(id, name), deal:deals(id, title)")
    .order("occurred_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return { activities: data ?? [], total: count ?? 0 };
}
