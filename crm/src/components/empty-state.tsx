import { cn } from "@/lib/utils";

export function EmptyState({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid justify-items-center gap-4 rounded-xl border border-dashed px-6 py-12 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      <p>{children}</p>
      {action}
    </div>
  );
}
