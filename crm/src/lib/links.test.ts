import { describe, expect, it } from "vitest";
import { displayWebsite, normalizeInstagram, normalizeWebsite, safeNextPath } from "./links";
import { parseTags } from "./tags";

describe("normalizeWebsite", () => {
  it("adds https:// when missing", () => {
    expect(normalizeWebsite("palmbakery.ae")).toBe("https://palmbakery.ae");
  });
  it("keeps an existing scheme", () => {
    expect(normalizeWebsite("http://palm.ae")).toBe("http://palm.ae");
  });
  it("returns null for blanks", () => {
    expect(normalizeWebsite("  ")).toBeNull();
  });
  it("displays without scheme and www", () => {
    expect(displayWebsite("https://www.palm.ae/")).toBe("palm.ae");
  });
});

describe("normalizeInstagram", () => {
  it.each([
    ["@palmbakery", "palmbakery"],
    ["palmbakery", "palmbakery"],
    ["https://www.instagram.com/palmbakery/", "palmbakery"],
    ["instagram.com/palm.bakery?igsh=abc", "palm.bakery"],
  ])("%s -> %s", (input, expected) => {
    expect(normalizeInstagram(input)).toBe(expected);
  });
});

describe("safeNextPath", () => {
  it("allows in-app paths", () => {
    expect(safeNextPath("/companies?q=a")).toBe("/companies?q=a");
  });
  it.each(["https://evil.com", "//evil.com", "/\\evil.com", "", null])("blocks %s", (bad) => {
    expect(safeNextPath(bad)).toBe("/");
  });
});

describe("parseTags", () => {
  it("trims, de-duplicates ignoring case, keeps first spelling", () => {
    expect(parseTags("Bakery, jumeirah ,VIP, bakery,,")).toEqual(["Bakery", "jumeirah", "VIP"]);
  });
  it("handles empty input", () => {
    expect(parseTags("")).toEqual([]);
    expect(parseTags(null)).toEqual([]);
  });
});
