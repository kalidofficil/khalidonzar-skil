import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { getCompany, listCompanyOptions } from "@/lib/data/companies";
import { param } from "@/lib/data/params";
import { listServices } from "@/lib/data/services";
import { STAGES, type DealStage } from "@/lib/pipeline";
import { DealForm } from "../deal-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deals");
  return { title: t("new") };
}

/** /deals/new?company=<id> starts a deal for that company; without it, pick one. */
export default async function NewDealPage({ searchParams }: PageProps<"/deals/new">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const params = await searchParams;
  const companyParam = param(params, "company");
  const stageParam = param(params, "stage");
  const [company, services, t] = await Promise.all([
    companyParam ? getCompany(companyParam) : null,
    listServices({ activeOnly: true }),
    getTranslations(),
  ]);
  const companies = company ? undefined : await listCompanyOptions();
  const back = company ? `/companies/${company.id}` : "/pipeline";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("deals.new")}
        description={company?.name}
        backHref={back}
        backLabel={company?.name ?? t("pipeline.title")}
      />
      <Card>
        <CardContent>
          <DealForm
            companyId={company?.id}
            companies={companies}
            contacts={company?.contacts.map((c) => ({ id: c.id, full_name: c.full_name })) ?? []}
            services={services}
            defaultStage={STAGES.includes(stageParam as DealStage) ? (stageParam as DealStage) : "lead"}
            cancelHref={back}
          />
        </CardContent>
      </Card>
    </div>
  );
}
