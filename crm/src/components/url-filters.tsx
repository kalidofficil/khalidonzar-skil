"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SelectFilter = {
  /** URL parameter name, e.g. "status" */
  name: string;
  label: string;
  /** Text of the empty option ("Any source"). */
  emptyLabel: string;
  options: { value: string; label: string }[];
};

/**
 * Search box + dropdown filters that live in the URL (?q=...&status=...),
 * so filtered views can be bookmarked and the back button works.
 */
export function UrlFilters({
  searchPlaceholder,
  selects = [],
}: {
  searchPlaceholder: string;
  selects?: SelectFilter[];
}) {
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");
  const firstRender = useRef(true);

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page"); // new filters start again at page 1
    const qs = next.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  // Search as you type, 300 ms after the last keystroke.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) update({ q: q.trim() || null });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to typing
  }, [q]);

  const hasFilters = Boolean(q) || selects.some((s) => params.get(s.name));

  return (
    <div className={cn("mb-4 grid gap-2 sm:flex sm:flex-wrap sm:items-center", pending && "opacity-70")}>
      <div className="relative sm:min-w-64 sm:flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={t("search")}
          className="ps-9"
        />
      </div>
      {selects.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:flex">
          {selects.map((s) => (
            <NativeSelect
              key={s.name}
              aria-label={s.label}
              value={params.get(s.name) ?? ""}
              onChange={(e) => update({ [s.name]: e.target.value || null })}
              className="sm:w-auto"
            >
              <option value="">{s.emptyLabel}</option>
              {s.options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          ))}
        </div>
      )}
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            update(Object.fromEntries([["q", null], ...selects.map((s) => [s.name, null])]));
          }}
        >
          <X />
          {t("clearFilters")}
        </Button>
      )}
    </div>
  );
}
