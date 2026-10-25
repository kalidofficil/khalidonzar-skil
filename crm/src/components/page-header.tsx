import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Title row at the top of each page, with optional back link and action buttons. */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 grid gap-3 md:mb-6">
      {backHref && (
        <Button asChild variant="link" size="sm" className="h-auto w-fit px-0 text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft className="rtl:rotate-180" />
            {backLabel}
          </Link>
        </Button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight break-words">{title}</h1>
          {description && <div className="mt-1 text-sm text-muted-foreground">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}
