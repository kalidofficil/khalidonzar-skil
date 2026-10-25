// Dates, always in Dubai time (UTC+4, no daylight saving), whatever the
// server's or phone's clock is set to.

export const DUBAI_OFFSET = "+04:00";

function dubaiParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}` };
}

/** Today's date in Dubai, "YYYY-MM-DD". */
export function todayInDubai(now = new Date()): string {
  return dubaiParts(now).date;
}

/** "2026-10-25" + 3 -> "2026-10-28". */
export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Whole days from `from` to `to` (negative if `to` is earlier). */
export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type DueStatus = "overdue" | "today" | "soon" | "later";

/** How urgent a follow-up date is. "soon" = within the next 3 days. */
export function dueStatus(date: string | null | undefined, today = todayInDubai()): DueStatus | null {
  if (!date) return null;
  const days = daysBetween(today, date);
  if (days < 0) return "overdue";
  if (days === 0) return "today";
  if (days <= 3) return "soon";
  return "later";
}

/** Value for <input type="datetime-local"> showing the current Dubai time. */
export function dubaiNowLocalInput(now = new Date()): string {
  const { date, time } = dubaiParts(now);
  return `${date}T${time}`;
}

/** A stored timestamp -> "YYYY-MM-DDTHH:mm" in Dubai time, for editing. */
export function toDubaiLocalInput(iso: string): string {
  const { date, time } = dubaiParts(new Date(iso));
  return `${date}T${time}`;
}

/** "2026-10-25T14:30" typed in Dubai -> "2026-10-25T14:30:00+04:00". Null if invalid. */
export function dubaiLocalInputToISO(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const iso = `${value}:00${DUBAI_OFFSET}`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}
