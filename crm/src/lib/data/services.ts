import "server-only";
import { createClient } from "@/lib/supabase/server";

export async function listServices({ activeOnly = false } = {}) {
  const supabase = await createClient();
  let query = supabase.from("services").select("*").order("sort_order").order("name");
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
