import type { AppRole } from "@/lib/types";

// Main menu. Each later phase adds its section here (Today, Pipeline, ...).
// `roles` controls who sees the link; the database enforces the same rules.
export const NAV_ITEMS = [
  { href: "/pipeline", label: "pipeline", icon: "pipeline", roles: ["owner", "sales"] },
  { href: "/companies", label: "companies", icon: "companies", roles: ["owner", "sales"] },
  { href: "/contacts", label: "contacts", icon: "contacts", roles: ["owner", "sales"] },
  { href: "/search", label: "search", icon: "search", roles: ["owner", "sales"] },
] as const satisfies readonly {
  href: string;
  label: string;
  icon: string;
  roles: readonly AppRole[];
}[];

export type NavItem = (typeof NAV_ITEMS)[number];

export function navItemsFor(role: AppRole | null): NavItem[] {
  return NAV_ITEMS.filter((item) => role && (item.roles as readonly AppRole[]).includes(role));
}

/** Where to land after sign-in, depending on role. */
export function homePathFor(role: AppRole | null): string {
  return navItemsFor(role)[0]?.href ?? "/account";
}
