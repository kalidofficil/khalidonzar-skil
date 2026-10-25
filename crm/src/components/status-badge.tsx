import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { Enums } from "@/lib/database.types";

const VARIANT = {
  lead: "default",
  client: "success",
  past_client: "secondary",
  archived: "outline",
} as const;

export function CompanyStatusBadge({ status }: { status: Enums<"company_status"> }) {
  const t = useTranslations("options.status");
  return <Badge variant={VARIANT[status]}>{t(status)}</Badge>;
}
