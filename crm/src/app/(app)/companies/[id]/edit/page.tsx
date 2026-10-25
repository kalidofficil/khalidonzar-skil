import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { getCompany, listIndustries } from "@/lib/data/companies";
import { CompanyForm } from "../../company-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("companies");
  return { title: t("edit") };
}

export default async function EditCompanyPage({ params }: PageProps<"/companies/[id]/edit">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;
  const { id } = await params;
  const [company, industries, t] = await Promise.all([
    getCompany(id),
    listIndustries(),
    getTranslations("companies"),
  ]);
  if (!company) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("edit")} backHref={`/companies/${id}`} backLabel={company.name} />
      <Card>
        <CardContent>
          <CompanyForm company={company} industries={industries} cancelHref={`/companies/${id}`} />
        </CardContent>
      </Card>
    </div>
  );
}
