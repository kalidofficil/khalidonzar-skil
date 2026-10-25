import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Previous / next links that keep the current filters in the URL. */
export function Pagination({
  page,
  pageCount,
  pathname,
  params,
}: {
  page: number;
  pageCount: number;
  pathname: string;
  params: Record<string, string | undefined>;
}) {
  const t = useTranslations("common");
  if (pageCount <= 1) return null;

  const hrefFor = (p: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (p > 1) search.set("page", String(p));
    else search.delete("page");
    const qs = search.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  return (
    <nav className="mt-4 flex items-center justify-between gap-2 text-sm text-muted-foreground">
      <Button asChild variant="outline" size="sm" className={page <= 1 ? "invisible" : ""}>
        <Link href={hrefFor(page - 1)}>
          <ChevronLeft className="rtl:rotate-180" />
          {t("previous")}
        </Link>
      </Button>
      <span>{t("pageOf", { page, pages: pageCount })}</span>
      <Button asChild variant="outline" size="sm" className={page >= pageCount ? "invisible" : ""}>
        <Link href={hrefFor(page + 1)}>
          {t("next")}
          <ChevronRight className="rtl:rotate-180" />
        </Link>
      </Button>
    </nav>
  );
}
