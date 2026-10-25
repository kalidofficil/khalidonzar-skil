import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { DeleteButton } from "@/components/delete-button";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listCompanyOptions } from "@/lib/data/companies";
import { getContact } from "@/lib/data/contacts";
import { deleteContact } from "../../actions";
import { ContactForm } from "../../contact-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contacts");
  return { title: t("edit") };
}

export default async function EditContactPage({ params }: PageProps<"/contacts/[id]/edit">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { id } = await params;
  const [contact, companies, t] = await Promise.all([getContact(id), listCompanyOptions(), getTranslations()]);
  if (!contact) notFound();

  const { company, ...fields } = contact;
  const back = `/companies/${fields.company_id}`;
  // Keep the current company in the picker even if it's archived.
  const options = companies.some((c) => c.id === company?.id) || !company ? companies : [company, ...companies];

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={t("contacts.edit")}
        backHref={back}
        backLabel={company?.name ?? t("contacts.title")}
        actions={
          <DeleteButton
            action={deleteContact.bind(null, fields.id)}
            title={t("contacts.deleteTitle", { name: fields.full_name })}
            description={t("contacts.deleteBody", { company: company?.name ?? "" })}
            successText={t("contacts.deleted")}
            redirectTo={back}
          />
        }
      />
      <Card>
        <CardContent>
          <ContactForm contact={fields} companies={options} cancelHref={back} />
        </CardContent>
      </Card>
    </div>
  );
}
