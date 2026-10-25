import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ArrowRight, Paperclip } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { DueChip } from "@/components/due-chip";
import { EmptyState } from "@/components/empty-state";
import { deleteActivity } from "@/app/(app)/activities/actions";
import { hasRole, type CurrentUser } from "@/lib/auth";
import type { TimelineItem } from "@/lib/data/activities";
import { addDays, todayInDubai } from "@/lib/dates";
import { ChannelIcon } from "./channel-icon";
import { LogActivityButton } from "./log-activity-dialog";

/**
 * The conversation history: newest first, grouped by day (Dubai time).
 * `showDeal` adds a link to the deal on each entry (useful on company pages).
 */
export async function Timeline({
  items,
  user,
  showDeal = true,
}: {
  items: TimelineItem[];
  user: CurrentUser;
  showDeal?: boolean;
}) {
  const t = await getTranslations();
  const format = await getFormatter();
  if (items.length === 0) return <EmptyState className="py-8">{t("activities.empty")}</EmptyState>;

  const today = todayInDubai();
  const yesterday = addDays(today, -1);
  const groups = new Map<string, TimelineItem[]>();
  for (const item of items) {
    const day = todayInDubai(new Date(item.occurred_at));
    groups.set(day, [...(groups.get(day) ?? []), item]);
  }

  const dayLabel = (day: string) =>
    day === today
      ? t("common.today")
      : day === yesterday
        ? t("common.yesterday")
        : format.dateTime(new Date(`${day}T12:00:00+04:00`), { weekday: "short", day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="grid gap-6">
      {[...groups.entries()].map(([day, dayItems]) => (
        <section key={day}>
          <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{dayLabel(day)}</h3>
          <ol className="grid gap-4">
            {dayItems.map((item) => {
              const canDelete = hasRole(user, "owner") || item.created_by === user.id;
              return (
                <li key={item.id} className="flex gap-3">
                  <ChannelIcon channel={item.channel} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(item.occurred_at), { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {t(`options.channel.${item.channel}`)}
                        {item.contact && <> · {t("activities.withContact", { name: item.contact.full_name })}</>}
                        {item.author && <> · {t("common.by", { name: item.author.full_name || item.author.email })}</>}
                      </p>
                      <div className="-mt-1 flex shrink-0">
                        <LogActivityButton variant="icon" activity={item} />
                        {canDelete && (
                          <DeleteButton
                            size="icon-sm"
                            action={deleteActivity.bind(null, item.id)}
                            title={t("activities.deleteTitle")}
                            description={t("activities.deleteBody")}
                            successText={t("activities.deleted")}
                          />
                        )}
                      </div>
                    </div>
                    <p className="mt-0.5 whitespace-pre-line">{item.summary}</p>
                    {item.outcome && (
                      <p className="mt-1 text-sm">
                        <span className="text-muted-foreground">{t("activities.outcome")}:</span> {item.outcome}
                      </p>
                    )}
                    {(item.next_step || item.next_step_date) && (
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                        <ArrowRight className="size-3.5 text-muted-foreground rtl:rotate-180" />
                        <span>{item.next_step ?? t("activities.nextStep")}</span>
                        <DueChip date={item.next_step_date} />
                      </p>
                    )}
                    {showDeal && item.deal && (
                      <Link href={`/deals/${item.deal.id}`} className="mt-1 block text-xs text-primary hover:underline">
                        {t("activities.onDeal", { name: item.deal.title })}
                      </Link>
                    )}
                    {item.attachments.length > 0 && (
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {item.attachments.map((file) => (
                          <li key={file.id}>
                            <a
                              href={`/files/${file.id}`}
                              target="_blank"
                              rel="noopener"
                              className="flex max-w-60 items-center gap-1 rounded-md border bg-card px-2 py-1 text-xs hover:bg-accent"
                            >
                              <Paperclip className="size-3" />
                              <span className="truncate">{file.file_name}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}
