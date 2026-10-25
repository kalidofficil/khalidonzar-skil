import { getTranslations } from "next-intl/server";

// Centered card used by the sign-in and password-reset pages.
export default async function AuthLayout({ children }: LayoutProps<"/">) {
  const t = await getTranslations("app");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <p className="mb-6 text-lg font-semibold tracking-tight">{t("name")}</p>
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-sm">{children}</div>
    </div>
  );
}
