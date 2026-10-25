import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { getDeal } from "@/lib/data/deals";
import { listServices } from "@/lib/data/services";
import { getCompanyContacts } from "../../actions";
import { DealForm } from "../../deal-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("deals");
  return { title: t("edit") };
}

export default async function EditDealPage({ params }: PageProps<"/deals/[id]/edit">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { id } = await params;
  const [deal, services, t] = await Promise.all([getDeal(id), listServices(), getTranslations("deals")]);
  if (!deal) notFound();
  const contacts = await getCompanyContacts(deal.company_id);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("edit")} backHref={`/deals/${id}`} backLabel={deal.title} description={deal.company?.name} />
      <Card>
        <CardContent>
          <DealForm
            deal={deal}
            serviceIds={deal.deal_services.flatMap((ds) => (ds.service ? [ds.service.id] : []))}
            contacts={contacts}
            services={services}
            cancelHref={`/deals/${id}`}
          />
        </CardContent>
      </Card>
    </div>
  );
}
