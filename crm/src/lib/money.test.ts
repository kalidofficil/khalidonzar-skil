import { describe, expect, it } from "vitest";
import { filsToInput, formatAED, parseAED } from "./money";
import {
  STAGE_PROBABILITY,
  contractValueFils,
  positionBetween,
  stageTotals,
  weightedValueFils,
} from "./pipeline";

describe("parseAED", () => {
  it.each([
    ["15000", 1_500_000],
    ["15,000", 1_500_000],
    ["15,000.5", 1_500_050],
    ["15000.50", 1_500_050],
    ["AED 1,250", 125_000],
    ["aed1250.75", 125_075],
    ["0", 0],
    [".5", 50],
    ["0.29", 29], // a float bug would give 28
    ["1.234", 123], // rounds down
    ["1.235", 124], // rounds half up
    ["19.999", 2000],
  ])("%s -> %d fils", (input, fils) => {
    expect(parseAED(input)).toBe(fils);
  });

  it.each(["", "abc", "-5", "1.2.3", "12a", null])("rejects %s", (input) => {
    expect(parseAED(input)).toBeNull();
  });
});

describe("filsToInput / formatAED", () => {
  it("round-trips through the form", () => {
    for (const fils of [0, 1, 99, 100, 1_500_050, 123_456_789]) {
      expect(parseAED(filsToInput(fils))).toBe(fils);
    }
  });
  it("formats for display", () => {
    expect(formatAED(1_500_000)).toBe("AED 15,000");
    expect(formatAED(1_500_050)).toBe("AED 15,000.50");
    expect(formatAED(0)).toBe("AED 0");
    expect(formatAED(4_550_000, { compact: true })).toBe("AED 45.5K");
  });
});

describe("deal values", () => {
  const oneOff = { value_fils: 1_000_000, billing: "one_off" as const, term_months: 1 };
  const retainer = { value_fils: 500_000, billing: "monthly" as const, term_months: 6 };

  it("one-off contract value is the price", () => {
    expect(contractValueFils(oneOff)).toBe(1_000_000);
  });
  it("monthly contract value is price x months", () => {
    expect(contractValueFils(retainer)).toBe(3_000_000);
  });
  it("weighted value uses the probability", () => {
    expect(weightedValueFils({ ...retainer, probability: 60, stage: "proposal" })).toBe(1_800_000);
  });
  it("weighted value falls back to the stage default", () => {
    expect(weightedValueFils({ ...oneOff, probability: null, stage: "discovery" })).toBe(400_000);
  });
  it("weighted value rounds to whole fils", () => {
    expect(weightedValueFils({ value_fils: 333, billing: "one_off", term_months: 1, probability: 10, stage: "lead" })).toBe(33);
  });

  it("totals per stage", () => {
    const totals = stageTotals([
      { ...oneOff, probability: null, stage: "proposal" },
      { ...retainer, probability: 50, stage: "proposal" },
      { ...oneOff, probability: null, stage: "won" },
    ]);
    expect(totals.proposal).toEqual({ count: 2, valueFils: 4_000_000, weightedFils: 600_000 + 1_500_000 });
    expect(totals.won).toEqual({ count: 1, valueFils: 1_000_000, weightedFils: 1_000_000 });
    expect(totals.lead).toEqual({ count: 0, valueFils: 0, weightedFils: 0 });
  });

  it("stage probabilities match the database defaults", () => {
    // Same numbers as public.default_stage_probability() in the migration.
    expect(STAGE_PROBABILITY).toEqual({
      lead: 10, contacted: 20, discovery: 40, proposal: 60, negotiation: 80, won: 100, lost: 0,
    });
  });
});

describe("positionBetween", () => {
  it("handles empty, top, bottom and middle", () => {
    expect(positionBetween()).toBe(1024);
    expect(positionBetween(undefined, 1024)).toBe(0);
    expect(positionBetween(1024)).toBe(2048);
    expect(positionBetween(1024, 2048)).toBe(1536);
  });
});
