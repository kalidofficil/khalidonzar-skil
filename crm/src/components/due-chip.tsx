import { useFormatter, useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { daysBetween, dueStatus, todayInDubai } from "@/lib/dates";
import { cn } from "@/lib/utils";

const STYLE = {
  overdue: "bg-destructive/10 text-destructive",
  today: "bg-warning/15 text-warning",
  soon: "bg-primary/10 text-primary",
  later: "bg-muted text-muted-foreground",
} as const;

/**
 * A follow-up date with urgency colour: red when overdue, amber today,
 * blue in the next 3 days. Hidden when there's no date.
 */
export function DueChip({
  date,
  muted,
  className,
}: {
  date: string | null | undefined;
  /** Grey it out (e.g. on won/lost deals, where follow-ups no longer matter). */
  muted?: boolean;
  className?: string;
}) {
  const t = useTranslations("common");
  const format = useFormatter();
  const today = todayInDubai();
  const status = dueStatus(date, today);
  if (!date || !status) return null;

  const days = daysBetween(today, date);
  const label =
    status === "overdue"
      ? t("daysOverdue", { days: -days })
      : status === "today"
        ? t("dueToday")
        : format.dateTime(new Date(`${date}T12:00:00+04:00`), { day: "numeric", month: "short" });

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        muted ? STYLE.later : STYLE[status],
        className,
      )}
      title={date}
    >
      <CalendarClock className="size-3" />
      {label}
    </span>
  );
}
