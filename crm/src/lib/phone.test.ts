import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone, normalizePhoneQuery, whatsappLink } from "./phone";

describe("normalizePhone", () => {
  it.each([
    ["050 123 4567", "+971501234567"],
    ["0501234567", "+971501234567"],
    ["+971 50 123 4567", "+971501234567"],
    ["00971501234567", "+971501234567"],
    ["971501234567", "+971501234567"],
    ["+33 6 12 34 56 78", "+33612345678"],
    ["04 123 4567", "+97141234567"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("returns null for empty or invalid input", () => {
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("12")).toBeNull();
    expect(normalizePhone("not a phone")).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("uses digits only", () => {
    expect(whatsappLink("+971501234567")).toBe("https://wa.me/971501234567");
  });
  it("encodes a pre-filled message", () => {
    expect(whatsappLink("+971501234567", "Hi Sara & team")).toBe(
      "https://wa.me/971501234567?text=Hi%20Sara%20%26%20team",
    );
  });
  it("returns null without a number", () => {
    expect(whatsappLink(null)).toBeNull();
  });
});

describe("formatPhone", () => {
  it("formats for display", () => {
    expect(formatPhone("+971501234567")).toBe("+971 50 123 4567");
  });
});

describe("normalizePhoneQuery", () => {
  it("strips spaces from phone-like searches", () => {
    expect(normalizePhoneQuery(" 050 123 4567 ")).toBe("0501234567");
  });
  it("leaves normal text alone", () => {
    expect(normalizePhoneQuery("Palm Bakery 2")).toBe("Palm Bakery 2");
  });
});
