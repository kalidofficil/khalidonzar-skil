import { describe, expect, it } from "vitest";
import { activitySchema } from "./activity";
import { dealSchema } from "./deal";

const company = "10000000-0000-4000-8000-000000000001";

describe("dealSchema", () => {
  const base = { company_id: company, title: "Meta ads", billing: "one_off", term_months: "6", stage: "lead" };

  it("parses AED, dates and empty optionals", () => {
    const d = dealSchema.parse({
      ...base,
      value_fils: "12,500.50",
      probability: "",
      expected_close_date: "2026-11-30",
      next_follow_up_date: "",
      primary_contact_id: "",
    });
    expect(d.value_fils).toBe(1_250_050);
    expect(d.probability).toBeNull();
    expect(d.expected_close_date).toBe("2026-11-30");
    expect(d.next_follow_up_date).toBeNull();
    expect(d.primary_contact_id).toBeNull();
    expect(d.term_months).toBe(1); // one-off ignores the months field
  });

  it("keeps months for retainers", () => {
    expect(dealSchema.parse({ ...base, billing: "monthly", value_fils: "5000" }).term_months).toBe(6);
  });

  it("an empty value means 0", () => {
    expect(dealSchema.parse({ ...base, value_fils: "" }).value_fils).toBe(0);
  });

  it("rejects bad amounts, probabilities and missing lost reasons", () => {
    const r = dealSchema.safeParse({ ...base, value_fils: "lots", probability: "150" });
    const msgs = r.error!.issues.map((i) => [i.path[0], i.message]);
    expect(msgs).toContainEqual(["value_fils", "invalidAmount"]);
    expect(msgs).toContainEqual(["probability", "invalidNumber"]);

    const lost = dealSchema.safeParse({ ...base, value_fils: "1", stage: "lost", lost_reason: "" });
    expect(lost.error!.issues[0]).toMatchObject({ path: ["lost_reason"], message: "lostReasonRequired" });
  });
});

describe("activitySchema", () => {
  it("treats the time as Dubai time", () => {
    const a = activitySchema.parse({
      company_id: company,
      channel: "whatsapp",
      summary: "Sent proposal",
      occurred_at: "2026-10-25T14:30",
    });
    expect(a.occurred_at).toBe("2026-10-25T14:30:00+04:00");
    expect(a.deal_id).toBeNull();
  });

  it("requires a summary and a known channel", () => {
    const r = activitySchema.safeParse({ company_id: company, channel: "fax", summary: " " });
    const msgs = r.error!.issues.map((i) => [i.path[0], i.message]);
    expect(msgs).toContainEqual(["summary", "required"]);
    expect(msgs).toContainEqual(["channel", "invalidOption"]);
  });
});
