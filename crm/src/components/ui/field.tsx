import * as React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Label } from "./label";

/**
 * Label + input + hint + error, laid out consistently.
 * `errors` are keys from messages/en.json "errors" (e.g. "required").
 */
function Field({
  id,
  label,
  hint,
  errors,
  optional,
  className,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations();
  const error = errors?.[0];
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id}>
        {label}
        {optional && (
          <span className="ms-1 font-normal text-muted-foreground">({t("common.optional")})</span>
        )}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-destructive" role="alert">
          {t.has(`errors.${error}` as never) ? t(`errors.${error}` as never) : error}
        </p>
      )}
    </div>
  );
}

export { Field };
