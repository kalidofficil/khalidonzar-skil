import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Columns3, Plus, Table2 } from "lucide-react";
import { DealValue } from "@/components/deals/deal-value";
import { PipelineBoard } from "@/components/deals/pipeline-board";
import { StageBadge } from "@/components/deals/stage-badge";
import { DueChip } from "@/components/due-chip";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { UrlFilters } from "@/components/url-filters";
import { Button } from "@/components/ui/button";
import { hasRole, requireUser } from "@/lib/auth";
import { listBoardDeals, listTableDeals, parseDealTableFilters, type BoardDeal } from "@/lib/data/deals";
import { param } from "@/lib/data/params";
import { formatAED } from "@/lib/money";
import { OPEN_STAGES, STAGES, isClosed, stageTotals, weightedValueFils } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pipeline");
  return { title: t("title") };
}

export default async function PipelinePage({ searchParams }: PageProps<"/pipeline">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const params = await searchParams;
  const view = param(params, "view") === "table" ? "table" : "board";
  const t = await getTranslations();

  // Headline numbers always cover every open deal.
  const boardDeals = await listBoardDeals(view === "board" ? param(params, "q") : undefined);
  const openDeals = boardDeals.filter((d) => !isClosed(d.stage));
  const totals = stageTotals(openDeals);
  const openValue = OPEN_STAGES.reduce((s, st) => s + totals[st].valueFils, 0);
  const openWeighted = OPEN_STAGES.reduce((s, st) => s + totals[st].weightedFils, 0);

  const viewHref = (v: "board" | "table") => (v === "board" ? "/pipeline" : "/pipeline?view=table");

  return (
    <>
      <PageHeader
        title={t("pipeline.title")}
        description={
          <span className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t("pipeline.openValue")}: <strong className="text-foreground">{formatAED(openValue)}</strong>
            </span>
            <span>
              {t("pipeline.weighted")}: <strong className="text-foreground">{formatAED(openWeighted)}</strong>
            </span>
          </span>
        }
        actions={
          <>
            <div className="flex rounded-md border bg-card p-0.5" role="tablist">
              {(["board", "table"] as const).map((v) => (
                <Link
                  key={v}
                  href={viewHref(v)}
                  role="tab"
                  aria-selected={view === v}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-sm text-muted-foreground",
                    view === v && "bg-accent font-medium text-accent-foreground",
                  )}
                >
                  {v === "board" ? <Columns3 className="size-4" /> : <Table2 className="size-4" />}
                  {t(`pipeline.${v}`)}
                </Link>
              ))}
            </div>
            <Button asChild>
              <Link href="/deals/new">
                <Plus />
                {t("pipeline.newDeal")}
              </Link>
            </Button>
          </>
        }
      />

      {view === "board" ? (
        <>
          <UrlFilters searchPlaceholder={t("pipeline.searchPlaceholder")} />
          {boardDeals.length === 0 && !param(params, "q") ? (
            <EmptyState
              action={
                <Button asChild>
                  <Link href="/deals/new">
                    <Plus />
                    {t("pipeline.newDeal")}
                  </Link>
                </Button>
              }
            >
              {t("pipeline.empty")}
            </EmptyState>
          ) : (
            <PipelineBoard deals={boardDeals} />
          )}
        </>
      ) : (
        <DealsTable params={params} />
      )}
    </>
  );
}

async function DealsTable({ params }: { params: Record<string, string | string[] | undefined> }) {
  const t = await getTranslations();
  const filters = parseDealTableFilters(params);
  const { deals, total, pageCount } = await listTableDeals(filters);
  const shownValue = deals.reduce((s, d) => s + weightedValueFils(d), 0);

  return (
    <>
      <UrlFilters
        searchPlaceholder={t("pipeline.searchPlaceholder")}
        selects={[
          {
            name: "stage",
            label: t("pipeline.filters.stage"),
            emptyLabel: t("pipeline.filters.anyStage"),
            options: [
              { value: "all", label: t("pipeline.filters.allStages") },
              ...STAGES.map((s) => ({ value: s, label: t(`options.stage.${s}`) })),
            ],
          },
          {
            name: "followUp",
            label: t("pipeline.filters.followUp"),
            emptyLabel: t("pipeline.filters.anyFollowUp"),
            options: (["overdue", "today", "week", "none"] as const).map((f) => ({
              value: f,
              label: t(`pipeline.filters.${f === "week" ? "thisWeek" : f === "today" ? "dueToday" : f}`),
            })),
          },
          {
            name: "sort",
            label: t("pipeline.filters.sort"),
            emptyLabel: t("pipeline.sort.updated"),
            options: (["followup", "value", "close", "title"] as const).map((s) => ({
              value: s,
              label: t(`pipeline.sort.${s}`),
            })),
          },
        ]}
      />

      {deals.length === 0 ? (
        <EmptyState>{t("pipeline.emptyFiltered")}</EmptyState>
      ) : (
        <>
          <p className="mb-2 text-sm text-muted-foreground">{t("common.resultCount", { count: total })}</p>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("pipeline.columns.deal")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pipeline.columns.stage")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pipeline.columns.value")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pipeline.columns.probability")}</th>
                  <th className="px-4 py-3 text-end font-medium">{t("pipeline.columns.weighted")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pipeline.columns.expectedClose")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("pipeline.columns.nextFollowUp")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deals.map((d) => (
                  <DealRow key={d.id} deal={d} />
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/30 text-sm">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-end text-muted-foreground">
                    {t("pipeline.weightedTotal", { count: deals.length })}
                  </td>
                  <td className="px-4 py-3 text-end font-semibold whitespace-nowrap">{formatAED(shownValue)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            pathname="/pipeline"
            params={{ view: "table", q: filters.q, stage: filters.stage, followUp: filters.followUp, sort: param(params, "sort") }}
          />
        </>
      )}
    </>
  );
}

async function DealRow({ deal }: { deal: BoardDeal }) {
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);
  const closed = isClosed(deal.stage);
  return (
    <tr className="hover:bg-muted/30">
      <td className="px-4 py-3">
        <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
          {deal.title}
        </Link>
        {deal.company && (
          <Link href={`/companies/${deal.company.id}`} className="block text-xs text-muted-foreground hover:underline">
            {deal.company.name}
          </Link>
        )}
      </td>
      <td className="px-4 py-3">
        <StageBadge stage={deal.stage} />
      </td>
      <td className="px-4 py-3 text-end">
        <DealValue fils={deal.value_fils} billing={deal.billing} />
      </td>
      <td className="px-4 py-3 text-end text-muted-foreground">{deal.probability ?? "—"}%</td>
      <td className="px-4 py-3 text-end whitespace-nowrap">{formatAED(weightedValueFils(deal))}</td>
      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
        {deal.expected_close_date
          ? format.dateTime(new Date(`${deal.expected_close_date}T12:00:00+04:00`), { dateStyle: "medium" })
          : "—"}
      </td>
      <td className="px-4 py-3">
        {deal.next_follow_up_date ? (
          <DueChip date={deal.next_follow_up_date} muted={closed} />
        ) : (
          <span className="text-muted-foreground">{t("common.none")}</span>
        )}
      </td>
    </tr>
  );
}
