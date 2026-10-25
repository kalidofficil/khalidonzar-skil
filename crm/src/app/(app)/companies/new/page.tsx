import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listIndustries } from "@/lib/data/companies";
import { CompanyForm } from "../company-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("companies");
  return { title: t("new") };
}

export default async function NewCompanyPage() {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;
  const t = await getTranslations("companies");
  const industries = await listIndustries();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("new")} backHref="/companies" backLabel={t("title")} />
      <Card>
        <CardContent>
          <CompanyForm industries={industries} cancelHref="/companies" />
        </CardContent>
      </Card>
    </div>
  );
}
