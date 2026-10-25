import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { getCompany, listCompanyOptions } from "@/lib/data/companies";
import { ContactForm } from "../contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contacts");
  return { title: t("new") };
}

/** /contacts/new?company=<id> adds a contact to that company; without it, pick one. */
export default async function NewContactPage({ searchParams }: PageProps<"/contacts/new">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { company: companyParam } = await searchParams;
  const t = await getTranslations("contacts");
  const company = typeof companyParam === "string" ? await getCompany(companyParam) : null;
  const companies = company ? undefined : await listCompanyOptions();
  const back = company ? `/companies/${company.id}` : "/contacts";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("new")}
        description={company?.name}
        backHref={back}
        backLabel={company?.name ?? t("title")}
      />
      <Card>
        <CardContent>
          <ContactForm companyId={company?.id} companies={companies} cancelHref={back} />
        </CardContent>
      </Card>
    </div>
  );
}
