import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";
import { LANGUAGES } from "@/lib/options";
import { normalizePhoneQuery } from "@/lib/phone";
import { PAGE_SIZE } from "./companies";

export type ContactFilters = {
  q?: string;
  language?: Enums<"language_code">;
  page: number;
};

export function parseContactFilters(params: Record<string, string | string[] | undefined>): ContactFilters {
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const language = get("language");
  return {
    q: get("q")?.trim() || undefined,
    language: LANGUAGES.includes(language as never) ? (language as Enums<"language_code">) : undefined,
    page: Math.max(1, Number.parseInt(get("page") ?? "1", 10) || 1),
  };
}

export async function listContacts(filters: ContactFilters) {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;

  let query = supabase
    .rpc("search_contacts", { q: filters.q ? normalizePhoneQuery(filters.q) : null }, { count: "exact" })
    .select("id, full_name, job_title, phone, whatsapp, email, preferred_language, is_primary, company:companies(id, name)")
    .order("full_name")
    .range(from, from + PAGE_SIZE - 1);
  if (filters.language) query = query.eq("preferred_language", filters.language);

  const { data, count, error } = await query;
  if (error) throw error;
  return {
    contacts: data ?? [],
    total: count ?? 0,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export async function getContact(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("*, company:companies(id, name)")
    .eq("id", id)
    .maybeSingle();
  if (error && error.code !== "22P02") throw error;
  return data;
}
