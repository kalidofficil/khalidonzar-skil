import { z } from "zod";
import { BILLING_TYPES, LOST_REASONS, STAGES } from "@/lib/pipeline";
import {
  aedAmount,
  optionalDate,
  optionalEnum,
  optionalId,
  optionalInt,
  optionalText,
  requiredEnum,
  requiredInt,
  requiredText,
} from "./fields";

export const dealSchema = z
  .object({
    company_id: z.uuid("required"),
    title: requiredText(200),
    primary_contact_id: optionalId,
    value_fils: aedAmount,
    billing: requiredEnum(BILLING_TYPES),
    term_months: requiredInt(1, 120),
    stage: requiredEnum(STAGES),
    probability: optionalInt(0, 100),
    expected_close_date: optionalDate,
    next_follow_up_date: optionalDate,
    lost_reason: optionalEnum(LOST_REASONS),
    lost_note: optionalText(1000),
    notes: optionalText(5000),
  })
  // One-off deals are always 1 "month".
  .transform((d) => ({ ...d, term_months: d.billing === "one_off" ? 1 : d.term_months }))
  .refine((d) => d.stage !== "lost" || d.lost_reason, {
    message: "lostReasonRequired",
    path: ["lost_reason"],
  });

export type DealInput = z.infer<typeof dealSchema>;

/** Moving a card on the board. */
export const moveDealSchema = z
  .object({
    id: z.uuid(),
    stage: z.enum(STAGES),
    position: z.number().finite(),
    lost_reason: z.enum(LOST_REASONS).nullish(),
    lost_note: z.string().trim().max(1000).nullish(),
  })
  .refine((d) => d.stage !== "lost" || d.lost_reason, {
    message: "lostReasonRequired",
    path: ["lost_reason"],
  });
