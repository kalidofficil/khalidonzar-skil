import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  dubaiLocalInputToISO,
  dubaiNowLocalInput,
  dueStatus,
  toDubaiLocalInput,
  todayInDubai,
} from "./dates";

describe("Dubai dates", () => {
  it("today is the Dubai date, not the UTC date", () => {
    // 22:30 UTC on the 25th is already 02:30 on the 26th in Dubai.
    expect(todayInDubai(new Date("2026-10-25T22:30:00Z"))).toBe("2026-10-26");
    expect(todayInDubai(new Date("2026-10-25T10:00:00Z"))).toBe("2026-10-25");
  });

  it("adds days across month ends", () => {
    expect(addDays("2026-10-30", 3)).toBe("2026-11-02");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("counts days between dates", () => {
    expect(daysBetween("2026-10-25", "2026-10-28")).toBe(3);
    expect(daysBetween("2026-10-25", "2026-10-20")).toBe(-5);
  });

  it("classifies follow-up dates", () => {
    const today = "2026-10-25";
    expect(dueStatus("2026-10-24", today)).toBe("overdue");
    expect(dueStatus("2026-10-25", today)).toBe("today");
    expect(dueStatus("2026-10-28", today)).toBe("soon");
    expect(dueStatus("2026-10-29", today)).toBe("later");
    expect(dueStatus(null, today)).toBeNull();
  });

  it("converts between datetime inputs and stored timestamps", () => {
    expect(dubaiNowLocalInput(new Date("2026-10-25T10:05:00Z"))).toBe("2026-10-25T14:05");
    expect(dubaiLocalInputToISO("2026-10-25T14:05")).toBe("2026-10-25T14:05:00+04:00");
    expect(toDubaiLocalInput("2026-10-25T10:05:00Z")).toBe("2026-10-25T14:05");
    expect(dubaiLocalInputToISO("yesterday")).toBeNull();
  });
});
