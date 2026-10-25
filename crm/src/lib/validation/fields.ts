import { z } from "zod";
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
