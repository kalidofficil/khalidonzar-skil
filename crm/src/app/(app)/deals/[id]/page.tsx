import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Building2, Pencil } from "lucide-react";
import { LogActivityButton } from "@/components/activities/log-activity-dialog";
import { Timeline } from "@/components/activities/timeline";
import { ContactActions } from "@/components/contact-actions";
import { DealValue } from "@/components/deals/deal-value";
import { StageBadge } from "@/components/deals/stage-badge";
import { StageSelect } from "@/components/deals/stage-select";
import { DeleteButton } from "@/components/delete-button";
import { DueChip } from "@/components/due-chip";
import { FilesCard } from "@/components/files/files-card";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listTimeline } from "@/lib/data/activities";
import { listAttachments } from "@/lib/data/attachments";
import { getDeal } from "@/lib/data/deals";
import { formatAED } from "@/lib/money";
import { contractValueFils, isClosed, weightedValueFils } from "@/lib/pipeline";
import { deleteDeal } from "../actions";

export async function generateMetadata({ params }: PageProps<"/deals/[id]">): Promise<Metadata> {
  const deal = await getDeal((await params).id);
  return { title: deal?.title };
}

export default async function DealPage({ params }: PageProps<"/deals/[id]">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const [timeline, files, t, format] = await Promise.all([
    listTimeline({ dealId: id }),
    listAttachments({ dealId: id }),
    getTranslations(),
    getFormatter(),
  ]);
  const closed = isClosed(deal.stage);
  const date = (d: string) => format.dateTime(new Date(`${d}T12:00:00+04:00`), { dateStyle: "medium" });

  const rows: [string, React.ReactNode][] = [
    [t("deals.fields.value"), <DealValue key="v" fils={deal.value_fils} billing={deal.billing} />],
    ...(deal.billing === "monthly"
      ? ([
          [
            t("deals.fields.term_months"),
            t("deals.contractValue", {
              monthly: formatAED(deal.value_fils),
              months: deal.term_months,
              total: formatAED(contractValueFils(deal)),
            }),
          ],
        ] as [string, React.ReactNode][])
      : []),
    [t("deals.fields.probability"), `${deal.probability ?? 0}% · ${t("pipeline.weighted")} ${formatAED(weightedValueFils(deal))}`],
    [t("deals.fields.expected_close_date"), deal.expected_close_date ? date(deal.expected_close_date) : "—"],
    [
      t("deals.fields.next_follow_up_date"),
      deal.next_follow_up_date ? <DueChip key="f" date={deal.next_follow_up_date} muted={closed} /> : "—",
    ],
  ];

  return (
    <>
      <PageHeader
        backHref="/pipeline"
        backLabel={t("pipeline.title")}
        title={deal.title}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <StageBadge stage={deal.stage} />
            {deal.company && (
              <Link href={`/companies/${deal.company.id}`} className="flex items-center gap-1 hover:underline">
                <Building2 className="size-3.5" />
                {deal.company.name}
              </Link>
            )}
          </span>
        }
        actions={
          <>
            <LogActivityButton dealId={deal.id} companyId={deal.company_id} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/deals/${deal.id}/edit`}>
                <Pencil />
                {t("common.edit")}
              </Link>
            </Button>
            {hasRole(user, "owner") && (
              <DeleteButton
                action={deleteDeal.bind(null, deal.id)}
                title={t("deals.deleteTitle", { name: deal.title })}
                description={t("deals.deleteBody")}
                successText={t("deals.deleted")}
                redirectTo="/pipeline"
              />
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("deals.stage")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <StageSelect dealId={deal.id} stage={deal.stage} />
              {deal.stage === "lost" && deal.lost_reason && (
                <p className="text-sm text-destructive">
                  {t("deals.lostBecause", { reason: t(`options.lostReason.${deal.lost_reason}`) })}
                  {deal.lost_note && <span className="text-muted-foreground"> · {deal.lost_note}</span>}
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t("activities.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={timeline} user={user} showDeal={false} />
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("deals.details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <dl className="grid gap-3">
                {rows.map(([label, value]) => (
                  <div key={label} className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              {deal.deal_services.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {deal.deal_services.map(
                    (ds) =>
                      ds.service && (
                        <Badge key={ds.service.id} variant="outline">
                          {ds.service.name}
                        </Badge>
                      ),
                  )}
                </div>
              )}
              {deal.contact && (
                <div className="grid gap-2 border-t pt-3">
                  <p className="text-xs text-muted-foreground">{t("deals.fields.primary_contact_id")}</p>
                  <p className="font-medium">
                    {deal.contact.full_name}
                    {deal.contact.job_title && (
                      <span className="font-normal text-muted-foreground"> · {deal.contact.job_title}</span>
                    )}
                  </p>
                  <ContactActions
                    variant="compact"
                    phone={deal.contact.phone}
                    whatsapp={deal.contact.whatsapp}
                    email={deal.contact.email}
                  />
                </div>
              )}
              {deal.notes && (
                <div className="border-t pt-3">
                  <p className="mb-1 text-xs text-muted-foreground">{t("deals.fields.notes")}</p>
                  <p className="whitespace-pre-line">{deal.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <FilesCard files={files} user={user} companyId={deal.company_id} dealId={deal.id} />

          <Card>
            <CardHeader>
              <CardTitle>{t("deals.history")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-2 text-sm">
                {deal.history.map((h) => (
                  <li key={h.id} className="flex justify-between gap-2">
                    <span>
                      {h.from_stage
                        ? t("deals.historyMoved", {
                            from: t(`options.stage.${h.from_stage}`),
                            to: t(`options.stage.${h.to_stage}`),
                          })
                        : t("deals.historyCreated", { stage: t(`options.stage.${h.to_stage}`) })}
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {format.dateTime(new Date(h.changed_at), { day: "numeric", month: "short" })}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
