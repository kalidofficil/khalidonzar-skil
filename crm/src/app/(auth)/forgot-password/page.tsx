import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetForm } from "./reset-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle") };
}

export default function ForgotPasswordPage() {
  return <ResetForm />;
}
