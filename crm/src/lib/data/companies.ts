import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Enums } from "@/lib/database.types";
import { COMPANY_SOURCES, COMPANY_STATUSES, EMIRATES } from "@/lib/options";
import { normalizePhoneQuery } from "@/lib/phone";

export const PAGE_SIZE = 25;

export type CompanyFilters = {
  q?: string;
  status?: Enums<"company_status">;
  source?: Enums<"company_source">;
  emirate?: Enums<"emirate">;
  tag?: string;
  page: number;
};

/** Reads filters from the URL, ignoring anything unexpected. */
export function parseCompanyFilters(params: Record<string, string | string[] | undefined>): CompanyFilters {
  const get = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const pick = <T extends string>(list: readonly T[], value?: string) =>
    list.includes(value as T) ? (value as T) : undefined;
  return {
    q: get("q")?.trim() || undefined,
    status: pick(COMPANY_STATUSES, get("status")),
    source: pick(COMPANY_SOURCES, get("source")),
    emirate: pick(EMIRATES, get("emirate")),
    tag: get("tag") || undefined,
    page: Math.max(1, Number.parseInt(get("page") ?? "1", 10) || 1),
  };
}

const LIST_COLUMNS =
  "id, name, industry, emirate, city, status, source, tags, updated_at, contacts(id, full_name, job_title, phone, whatsapp, email, is_primary)";

export async function listCompanies(filters: CompanyFilters) {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;

  let query = supabase
    .rpc("search_companies", { q: filters.q ? normalizePhoneQuery(filters.q) : null }, { count: "exact" })
    .select(LIST_COLUMNS)
    .order("updated_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  // Archived companies stay hidden unless you filter for them.
  query = filters.status ? query.eq("status", filters.status) : query.neq("status", "archived");
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.emirate) query = query.eq("emirate", filters.emirate);
  if (filters.tag) query = query.contains("tags", [filters.tag]);

  const { data, count, error } = await query;
  if (error) throw error;

  return {
    companies: data ?? [],
    total: count ?? 0,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

export type CompanyListItem = Awaited<ReturnType<typeof listCompanies>>["companies"][number];

export async function listTags(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("company_tags").select("tag").order("tag");
  return (data ?? []).map((r) => r.tag).filter((t): t is string => Boolean(t));
}

export async function getCompany(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*, contacts(*)")
    .eq("id", id)
    .order("is_primary", { referencedTable: "contacts", ascending: false })
    .order("full_name", { referencedTable: "contacts" })
    .maybeSingle();
  if (error && error.code !== "22P02") throw error; // 22P02 = not a valid id
  return data;
}

/** Id + name of every company, for the "company" picker on the contact form. */
export async function listCompanyOptions() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .neq("status", "archived")
    .order("name");
  return data ?? [];
}

/** Distinct industries already used, to suggest while typing. */
export async function listIndustries(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("companies").select("industry").not("industry", "is", null);
  return [...new Set((data ?? []).map((r) => r.industry as string))].sort();
}
