import type { Enums } from "@/lib/database.types";

/** Channels in the order they appear as buttons in the log form. */
export const CHANNELS = [
  "whatsapp",
  "call",
  "meeting",
  "email",
  "linkedin",
  "instagram",
  "other",
] as const satisfies readonly Enums<"activity_channel">[];
