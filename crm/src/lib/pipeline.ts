import type { Enums } from "@/lib/database.types";

export type DealStage = Enums<"deal_stage">;

/** Stages in order, left to right on the board. */
export const STAGES = [
  "lead",
  "contacted",
  "discovery",
  "proposal",
  "negotiation",
  "won",
  "lost",
] as const satisfies readonly DealStage[];

export const OPEN_STAGES = STAGES.filter((s) => s !== "won" && s !== "lost");

export function isClosed(stage: DealStage) {
  return stage === "won" || stage === "lost";
}

/** Default win probability per stage, in %. Must match public.default_stage_probability(). */
export const STAGE_PROBABILITY: Record<DealStage, number> = {
  lead: 10,
  contacted: 20,
  discovery: 40,
  proposal: 60,
  negotiation: 80,
  won: 100,
  lost: 0,
};

export const LOST_REASONS = [
  "price",
  "budget",
  "timing",
  "competitor",
  "no_response",
  "not_a_fit",
  "other",
] as const satisfies readonly Enums<"lost_reason">[];

export const BILLING_TYPES = ["one_off", "monthly"] as const satisfies readonly Enums<"billing_type">[];

type Valued = {
  value_fils: number;
  billing: Enums<"billing_type">;
  term_months: number;
};

/**
 * What the whole deal is worth, in fils.
 * One-off: the price. Monthly retainer: monthly price x expected months.
 */
export function contractValueFils(deal: Valued): number {
  return deal.billing === "monthly" ? deal.value_fils * Math.max(1, deal.term_months) : deal.value_fils;
}

/** Contract value x probability, rounded to the nearest fils. */
export function weightedValueFils(deal: Valued & { probability: number | null; stage: DealStage }): number {
  const probability = deal.probability ?? STAGE_PROBABILITY[deal.stage];
  return Math.round((contractValueFils(deal) * probability) / 100);
}

export type StageTotal = { count: number; valueFils: number; weightedFils: number };

/** Count, total value and weighted value for each stage. */
export function stageTotals(
  deals: (Valued & { probability: number | null; stage: DealStage })[],
): Record<DealStage, StageTotal> {
  const totals = Object.fromEntries(
    STAGES.map((s) => [s, { count: 0, valueFils: 0, weightedFils: 0 }]),
  ) as Record<DealStage, StageTotal>;
  for (const deal of deals) {
    const t = totals[deal.stage];
    t.count += 1;
    t.valueFils += contractValueFils(deal);
    t.weightedFils += weightedValueFils(deal);
  }
  return totals;
}

/**
 * Kanban order: a position number between the card above and the card below,
 * so moving one card never renumbers the others.
 */
export function positionBetween(above?: number, below?: number): number {
  const GAP = 1024;
  if (above === undefined && below === undefined) return GAP;
  if (above === undefined) return below! - GAP;
  if (below === undefined) return above + GAP;
  return (above + below) / 2;
}
