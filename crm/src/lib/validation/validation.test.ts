import { describe, expect, it } from "vitest";
import { companySchema } from "./company";
import { contactSchema } from "./contact";

describe("companySchema", () => {
  it("cleans up a typical form submission", () => {
    const result = companySchema.parse({
      name: "  Palm Bakery ",
      industry: "",
      emirate: "dubai",
      city: "Jumeirah",
      website: "palmbakery.ae",
      instagram: "@palmbakery",
      source: "",
      status: "lead",
      tags: "bakery, VIP",
      notes: "",
    });
    expect(result).toEqual({
      name: "Palm Bakery",
      industry: null,
      emirate: "dubai",
      city: "Jumeirah",
      website: "https://palmbakery.ae",
      instagram: "palmbakery",
      source: null,
      status: "lead",
      tags: ["bakery", "VIP"],
      notes: null,
    });
  });

  it("requires a name and a known status", () => {
    const result = companySchema.safeParse({ name: "  ", status: "nope" });
    expect(result.success).toBe(false);
    const messages = result.error!.issues.map((i) => [i.path[0], i.message]);
    expect(messages).toContainEqual(["name", "required"]);
    expect(messages).toContainEqual(["status", "invalidOption"]);
  });
});

describe("contactSchema", () => {
  const base = {
    company_id: "10000000-0000-4000-8000-000000000001",
    full_name: "Sara",
    preferred_language: "en",
  };

  it("normalizes phone and email", () => {
    const result = contactSchema.parse({
      ...base,
      phone: "050 123 4567",
      whatsapp: "",
      email: " Sara@Palm.AE ",
      is_primary: "on",
    });
    expect(result.phone).toBe("+971501234567");
    expect(result.whatsapp).toBeNull();
    expect(result.email).toBe("sara@palm.ae");
    expect(result.is_primary).toBe(true);
  });

  it("rejects a bad phone and a bad email", () => {
    const result = contactSchema.safeParse({ ...base, phone: "123", email: "nope" });
    const messages = result.error!.issues.map((i) => [i.path[0], i.message]);
    expect(messages).toContainEqual(["phone", "invalidPhone"]);
    expect(messages).toContainEqual(["email", "invalidEmail"]);
  });

  it("treats a missing checkbox as false", () => {
    expect(contactSchema.parse(base).is_primary).toBe(false);
  });
});
