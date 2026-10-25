import { describe, expect, it } from "vitest";
import { formatBytes, safeFileName } from "./files";

describe("safeFileName", () => {
  it.each([
    ["Proposal (final) v2.pdf", "Proposal-final-v2.pdf"],
    ["brief.PDF", "brief.pdf"],
    ["عرض سعر.pdf", "file.pdf"],
    ["Café menu.jpg", "Cafe-menu.jpg"],
    ["../../etc/passwd", "passwd"],
    ["C:\\Users\\me\\brief.docx", "brief.docx"],
    ["noext", "noext"],
  ])("%s -> %s", (input, expected) => {
    expect(safeFileName(input)).toBe(expected);
  });
});

describe("formatBytes", () => {
  it("formats sizes", () => {
    expect(formatBytes(500)).toBe("500 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(2_400_000)).toBe("2.3 MB");
    expect(formatBytes(null)).toBe("");
  });
});
