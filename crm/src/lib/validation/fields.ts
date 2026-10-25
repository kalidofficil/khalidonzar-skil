import { z } from "zod";
import { parseAED } from "@/lib/money";
import { normalizePhone } from "@/lib/phone";

// Reusable field rules. Error messages are keys into messages/en.json "errors".
// Every field arrives from the form as a string ("" when left empty).

const asString = (v: unknown) => (typeof v === "string" ? v : "");

/** Required text, trimmed. */
export const requiredText = (max = 200) =>
  z.preprocess(asString, z.string().trim().min(1, "required").max(max, "tooLong"));

/** Optional text: "" becomes null. */
export const optionalText = (max = 500) =>
  z.preprocess(
    asString,
    z
      .string()
      .trim()
      .max(max, "tooLong")
      .transform((v) => v || null),
  );

/** Optional choice from a fixed list: "" becomes null. */
export const optionalEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" || v == null ? null : v), z.enum(values, "invalidOption").nullable());

/** Required choice from a fixed list. */
export const requiredEnum = <const T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values, "invalidOption");

/** Optional email, lower-cased. */
export const optionalEmail = z.preprocess(
  (v) => asString(v).trim().toLowerCase(),
  z.union([z.literal("").transform(() => null), z.email("invalidEmail")]),
);

/** Optional phone, stored in international format (+971...). */
export const optionalPhone = z.preprocess(asString, z.string().trim()).transform((v, ctx) => {
  if (!v) return null;
  const normalized = normalizePhone(v);
  if (!normalized) {
    ctx.addIssue({ code: "custom", message: "invalidPhone" });
    return z.NEVER;
  }
  return normalized;
});

/** HTML checkbox: "on" when ticked, missing when not. */
export const checkbox = z.preprocess((v) => v === "on" || v === "true", z.boolean());

/** Required AED amount typed by a person, returned in fils. */
export const aedAmount = z.preprocess(asString, z.string().trim()).transform((v, ctx) => {
  const fils = parseAED(v === "" ? "0" : v);
  if (fils === null) {
    ctx.addIssue({ code: "custom", message: "invalidAmount" });
    return z.NEVER;
  }
  return fils;
});

/** Optional AED amount: "" becomes null. */
export const optionalAedAmount = z.preprocess(asString, z.string().trim()).transform((v, ctx) => {
  if (!v) return null;
  const fils = parseAED(v);
  if (fils === null) {
    ctx.addIssue({ code: "custom", message: "invalidAmount" });
    return z.NEVER;
  }
  return fils;
});

/** Optional date from <input type="date"> ("YYYY-MM-DD"): "" becomes null. */
export const optionalDate = z.preprocess(
  (v) => (v === "" || v == null ? null : v),
  z.iso.date("invalidDate").nullable(),
);

/** Optional whole number in a range: "" becomes null. */
export const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number("invalidNumber").int("invalidNumber").min(min, "invalidNumber").max(max, "invalidNumber").nullable(),
  );

/** Required whole number in a range. */
export const requiredInt = (min: number, max: number) =>
  z.preprocess(
    (v) => Number(v),
    z.number("invalidNumber").int("invalidNumber").min(min, "invalidNumber").max(max, "invalidNumber"),
  );

/** Optional id (uuid) from a <select>: "" becomes null. */
export const optionalId = z.preprocess((v) => (v === "" || v == null ? null : v), z.uuid("required").nullable());
