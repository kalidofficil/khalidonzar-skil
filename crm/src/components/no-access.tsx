import { getTranslations } from "next-intl/server";
import type { CurrentUser } from "@/lib/auth";
import { EmptyState } from "./empty-state";

/** Shown instead of a page when the user's role doesn't include it. */
export async function NoAccess({ user }: { user: CurrentUser }) {
  const t = await getTranslations("auth");
  const pending = !user.role;
  return (
    <div className="mx-auto max-w-md py-10">
      <h1 className="mb-3 text-center text-xl font-semibold">
        {pending ? t("noAccessTitle") : t("forbiddenTitle")}
      </h1>
      <EmptyState>{pending ? t("noAccessBody") : t("forbiddenBody")}</EmptyState>
    </div>
  );
}
