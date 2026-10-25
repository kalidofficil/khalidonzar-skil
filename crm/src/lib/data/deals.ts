import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDays, todayInDubai } from "@/lib/dates";
import { STAGES, type DealStage } from "@/lib/pipeline";
import { PAGE_SIZE } from "./companies";
import { oneOf, pageParam, param, type SearchParams } from "./params";

const CARD_COLUMNS =
  "id, title, stage, position, value_fils, billing, term_months, probability, expected_close_date, next_follow_up_date, last_activity_at, updated_at, won_at, lost_at, company:companies(id, name), contact:contacts!deals_primary_contact_id_fkey(id, full_name, phone, whatsapp)";

/** Won/lost deals stay on the board for this many days. */
const CLOSED_ON_BOARD_DAYS = 60;

/** Every open deal, plus recently won/lost ones, for the kanban board. */
export async function listBoardDeals(q?: string) {
  const supabase = await createClient();
  const since = new Date(Date.now() - CLOSED_ON_BOARD_DAYS * 86_400_000).toISOString();
  const { data, error } = await supabase
    .rpc("search_deals", { q: q ?? null })
    .select(CARD_COLUMNS)
    .or(`stage.not.in.(won,lost),won_at.gte."${since}",lost_at.gte."${since}"`)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export type BoardDeal = Awaited<ReturnType<typeof listBoardDeals>>[number];

// ---------------------------------------------------------------------------
// Table view
// ---------------------------------------------------------------------------

const SORTS = ["updated", "value", "close", "followup", "title"] as const;
const FOLLOW_UPS = ["overdue", "today", "week", "none"] as const;

export type DealTableFilters = {
  q?: string;
  /** undefined = open deals only; "all" = everything; or one stage */
  stage?: DealStage | "all";
  followUp?: (typeof FOLLOW_UPS)[number];
  sort: (typeof SORTS)[number];
  page: number;
};

export function parseDealTableFilters(params: SearchParams): DealTableFilters {
  return {
    q: param(params, "q"),
    stage: oneOf([...STAGES, "all"] as const, param(params, "stage")),
    followUp: oneOf(FOLLOW_UPS, param(params, "followUp")),
    sort: oneOf(SORTS, param(params, "sort")) ?? "updated",
    page: pageParam(params),
  };
}

export async function listTableDeals(filters: DealTableFilters) {
  const supabase = await createClient();
  const from = (filters.page - 1) * PAGE_SIZE;
  const today = todayInDubai();

  let query = supabase.rpc("search_deals", { q: filters.q ?? null }, { count: "exact" }).select(CARD_COLUMNS);

  if (!filters.stage) query = query.not("stage", "in", "(won,lost)");
  else if (filters.stage !== "all") query = query.eq("stage", filters.stage);

  switch (filters.followUp) {
    case "overdue":
      query = query.lt("next_follow_up_date", today);
      break;
    case "today":
      query = query.eq("next_follow_up_date", today);
      break;
    case "week":
      query = query.gte("next_follow_up_date", today).lte("next_follow_up_date", addDays(today, 7));
      break;
    case "none":
      query = query.is("next_follow_up_date", null);
      break;
  }

  switch (filters.sort) {
    case "value":
      query = query.order("value_fils", { ascending: false });
      break;
    case "close":
      query = query.order("expected_close_date", { ascending: true, nullsFirst: false });
      break;
    case "followup":
      query = query.order("next_follow_up_date", { ascending: true, nullsFirst: false });
      break;
    case "title":
      query = query.order("title");
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }

  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return {
    deals: data ?? [],
    total: count ?? 0,
    pageCount: Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE)),
  };
}

// ---------------------------------------------------------------------------
// One deal
// ---------------------------------------------------------------------------

export async function getDeal(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select(
      "*, company:companies(id, name), contact:contacts!deals_primary_contact_id_fkey(id, full_name, job_title, phone, whatsapp, email), deal_services(service:services(id, name)), history:deal_stage_history(id, from_stage, to_stage, changed_at)",
    )
    .eq("id", id)
    .order("changed_at", { referencedTable: "deal_stage_history", ascending: false })
    .maybeSingle();
  if (error && error.code !== "22P02") throw error;
  return data;
}

export type DealDetail = NonNullable<Awaited<ReturnType<typeof getDeal>>>;

/** All deals of one company, open ones first. */
export async function listCompanyDeals(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, title, stage, value_fils, billing, term_months, probability, next_follow_up_date, updated_at")
    .eq("company_id", companyId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  const closed = (s: DealStage) => s === "won" || s === "lost";
  return (data ?? []).sort((a, b) => Number(closed(a.stage)) - Number(closed(b.stage)));
}

/** Smallest kanban position in a stage, so new deals go on top. */
export async function topPositionInStage(stage: DealStage): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("deals")
    .select("position")
    .eq("stage", stage)
    .order("position")
    .limit(1)
    .maybeSingle();
  return data ? data.position - 1024 : 1024;
}
