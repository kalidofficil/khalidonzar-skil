"use client";

import { usePathname } from "next/navigation";
import { LogActivityButton } from "./log-activity-dialog";

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

/**
 * The always-available "Log activity" button. On a company or deal page it
 * pre-fills that company / deal.
 */
export function QuickLog({ variant }: { variant: "fab" | "button" }) {
  const pathname = usePathname();
  const companyId = pathname.match(new RegExp(`^/companies/(${UUID})`))?.[1];
  const dealId = pathname.match(new RegExp(`^/deals/(${UUID})`))?.[1];
  // Remount when the page changes so the defaults follow the page.
  return <LogActivityButton key={pathname} variant={variant} companyId={companyId} dealId={dealId} />;
}
