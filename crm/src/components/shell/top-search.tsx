"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

/** Header search box. Submitting opens /search?q=... */
export function TopSearch() {
  const t = useTranslations("nav");
  const params = useSearchParams();
  return (
    <form action="/search" role="search" className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        name="q"
        type="search"
        defaultValue={params.get("q") ?? ""}
        placeholder={t("searchPlaceholder")}
        aria-label={t("search")}
        className="ps-9"
      />
    </form>
  );
}
