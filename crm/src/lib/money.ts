// Money helpers. All amounts are stored as whole fils (1 AED = 100 fils) so
// adding and multiplying never produces rounding errors like 0.1 + 0.2.

/**
 * Reads an AED amount typed by a person and returns fils.
 * "15000" -> 1500000, "15,000.5" -> 1500050, "AED 1,250" -> 125000.
 * More than 2 decimals are rounded to the nearest fils.
 * Returns null for anything that isn't a positive number (or zero).
 */
export function parseAED(input: string | null | undefined): number | null {
  const cleaned = (input ?? "").replace(/aed|د\.إ|[\s,]/gi, "");
  if (!/^\d+(\.\d*)?$|^\.\d+$/.test(cleaned)) return null;

  // Work on the digits as text, so 0.29 doesn't become 28.999999 fils.
  const [whole = "0", fraction = ""] = cleaned.split(".");
  const padded = (fraction + "000").slice(0, 3); // fils + one digit for rounding
  let fils = Number(whole || "0") * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) fils += 1;
  return Number.isSafeInteger(fils) ? fils : null;
}

/** 1500050 -> "15000.50", 1500000 -> "15000": for filling form inputs. */
export function filsToInput(fils: number | null | undefined): string {
  if (fils == null) return "";
  const whole = Math.floor(fils / 100);
  const rest = fils % 100;
  return rest ? `${whole}.${String(rest).padStart(2, "0")}` : String(whole);
}

const full = new Intl.NumberFormat("en-AE", { maximumFractionDigits: 2, minimumFractionDigits: 0 });
const withFils = new Intl.NumberFormat("en-AE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/**
 * 1500000 -> "AED 15,000"; 1500050 -> "AED 15,000.50"; compact: "AED 15K".
 */
export function formatAED(fils: number | null | undefined, opts: { compact?: boolean } = {}): string {
  const aed = (fils ?? 0) / 100;
  if (opts.compact) return `AED ${compactFmt.format(aed)}`;
  return `AED ${(fils ?? 0) % 100 === 0 ? full.format(aed) : withFils.format(aed)}`;
}
