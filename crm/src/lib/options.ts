import type { Enums } from "@/lib/database.types";

// The fixed choices used in forms and filters. Their labels live in
// messages/en.json under "options", so they can be translated.

export const COMPANY_SOURCES = [
  "network",
  "linkedin",
  "referral",
  "instagram",
  "event",
  "freelance_platform",
  "other",
] as const satisfies readonly Enums<"company_source">[];

export const EMIRATES = [
  "dubai",
  "abu_dhabi",
  "sharjah",
  "ajman",
  "umm_al_quwain",
  "ras_al_khaimah",
  "fujairah",
  "outside_uae",
] as const satisfies readonly Enums<"emirate">[];

export const COMPANY_STATUSES = [
  "lead",
  "client",
  "past_client",
  "archived",
] as const satisfies readonly Enums<"company_status">[];

export const LANGUAGES = ["en", "ar", "fr"] as const satisfies readonly Enums<"language_code">[];

// Suggestions only: industry is free text, so anything can be typed.
export const INDUSTRY_SUGGESTIONS = [
  "Automotive",
  "Beauty & wellness",
  "Construction",
  "E-commerce",
  "Education",
  "Events",
  "Fashion",
  "Finance",
  "Fitness",
  "Food & beverage",
  "Healthcare",
  "Hospitality",
  "Logistics",
  "Real estate",
  "Retail",
  "Tech / SaaS",
  "Travel & tourism",
];
