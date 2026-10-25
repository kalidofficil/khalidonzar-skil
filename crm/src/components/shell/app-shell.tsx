import { Suspense } from "react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { QuickLog } from "@/components/activities/quick-log-fab";
import { hasRole, type CurrentUser } from "@/lib/auth";
import { navItemsFor } from "@/lib/nav";
import { BottomNav, SidebarNav } from "./nav-links";
import { TopSearch } from "./top-search";
import { UserMenu } from "./user-menu";

/**
 * Page frame for signed-in users:
 *   desktop: sidebar on the start side + top bar
 *   phone:   top bar + tab bar at the bottom
 */
export async function AppShell({ user, children }: { user: CurrentUser; children: React.ReactNode }) {
  const t = await getTranslations("app");
  const items = navItemsFor(user.role);
  const canLog = hasRole(user, "owner", "sales");

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col gap-6 border-e bg-card px-3 py-5 md:flex">
        <Link href="/" className="px-3 text-lg font-semibold tracking-tight">
          {t("name")}
        </Link>
        <SidebarNav items={items} />
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Link href="/" className="font-semibold tracking-tight md:hidden">
            {t("name")}
          </Link>
          <div className="hidden flex-1 md:block">
            {items.length > 0 && (
              <Suspense>
                <TopSearch />
              </Suspense>
            )}
          </div>
          <div className="ms-auto flex items-center gap-2">
            {canLog && (
              <div className="hidden md:block">
                <QuickLog variant="button" />
              </div>
            )}
            <UserMenu name={user.fullName} email={user.email} isOwner={hasRole(user, "owner")} />
          </div>
        </header>

        {/* Bottom padding keeps content clear of the phone tab bar. */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 md:px-6 md:py-8 md:pb-10">
          {children}
        </main>
      </div>

      <BottomNav items={items} />
      {/* Phones: floating "+" to log an activity from anywhere. */}
      {canLog && <QuickLog variant="fab" />}
    </div>
  );
}
