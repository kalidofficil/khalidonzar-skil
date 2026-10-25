import { useTranslations } from "next-intl";
import { formatAED } from "@/lib/money";
import type { Enums } from "@/lib/database.types";

/** "AED 15,000" or "AED 5,000/mo". */
export function DealValue({ fils, billing }: { fils: number; billing: Enums<"billing_type"> }) {
  const t = useTranslations("deals");
  return (
    <span className="whitespace-nowrap">
      {formatAED(fils)}
      {billing === "monthly" && <span className="text-muted-foreground">{t("perMonth")}</span>}
    </span>
  );
}
