import { parsePhoneNumberFromString } from "libphonenumber-js";

// Numbers without a country code are treated as UAE numbers.
const DEFAULT_COUNTRY = "AE";

/**
 * Turns whatever was typed ("050 123 4567", "+971 50 123 4567", "00971501234567")
 * into international format ("+971501234567"). Returns null if it isn't a
 * valid phone number.
 */
export function normalizePhone(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  // "00" is the international prefix in the UAE; libphonenumber expects "+".
  const cleaned = raw.startsWith("00") ? "+" + raw.slice(2) : raw;
  const parsed = parsePhoneNumberFromString(cleaned, DEFAULT_COUNTRY);
  return parsed?.isValid() ? parsed.number : null;
}

/** "+971501234567" -> "+971 50 123 4567" for display. */
export function formatPhone(e164: string | null | undefined): string {
  if (!e164) return "";
  return parsePhoneNumberFromString(e164)?.formatInternational() ?? e164;
}

/** One-click WhatsApp chat link, e.g. https://wa.me/971501234567 */
export function whatsappLink(e164: string | null | undefined, text?: string): string | null {
  if (!e164) return null;
  const digits = e164.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}` + (text ? `?text=${encodeURIComponent(text)}` : "");
}

export function telLink(e164: string | null | undefined): string | null {
  return e164 ? `tel:${e164}` : null;
}

/**
 * Makes digit-heavy search text match stored numbers: "050 123 4567" -> "0501234567".
 * Anything that isn't phone-like is returned unchanged.
 */
export function normalizePhoneQuery(q: string): string {
  const trimmed = q.trim();
  return /^[+\d\s().-]{6,}$/.test(trimmed) ? trimmed.replace(/[\s().-]/g, "") : trimmed;
}
