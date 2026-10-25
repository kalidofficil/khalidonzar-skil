import { z } from "zod";
import { dubaiLocalInputToISO } from "@/lib/dates";
import { CHANNELS } from "@/lib/activities";
import { optionalDate, optionalId, optionalText, requiredEnum, requiredText } from "./fields";

export const activitySchema = z.object({
  company_id: z.uuid("required"),
  deal_id: optionalId,
  contact_id: optionalId,
  channel: requiredEnum(CHANNELS),
  summary: requiredText(5000),
  outcome: optionalText(2000),
  next_step: optionalText(500),
  next_step_date: optionalDate,
  // <input type="datetime-local"> in Dubai time; empty = now.
  occurred_at: z.preprocess((v) => (typeof v === "string" ? v : ""), z.string()).transform((v, ctx) => {
    if (!v) return new Date().toISOString();
    const iso = dubaiLocalInputToISO(v);
    if (!iso) {
      ctx.addIssue({ code: "custom", message: "invalidDate" });
      return z.NEVER;
    }
    return iso;
  }),
});

export type ActivityInput = z.infer<typeof activitySchema>;
