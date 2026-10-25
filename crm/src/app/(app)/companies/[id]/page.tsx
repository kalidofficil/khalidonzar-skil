import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AtSign, Globe, MapPin, Pencil, Plus } from "lucide-react";
import { LogActivityButton } from "@/components/activities/log-activity-dialog";
import { Timeline } from "@/components/activities/timeline";
import { ContactActions } from "@/components/contact-actions";
import { DealValue } from "@/components/deals/deal-value";
import { StageBadge } from "@/components/deals/stage-badge";
import { DueChip } from "@/components/due-chip";
import { FilesCard } from "@/components/files/files-card";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { CompanyStatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listTimeline } from "@/lib/data/activities";
import { listAttachments } from "@/lib/data/attachments";
import { getCompany } from "@/lib/data/companies";
import { listCompanyDeals } from "@/lib/data/deals";
import { isClosed } from "@/lib/pipeline";
import { displayWebsite, instagramUrl } from "@/lib/links";
import { deleteCompany } from "../actions";

export async function generateMetadata({ params }: PageProps<"/companies/[id]">): Promise<Metadata> {
  const company = await getCompany((await params).id);
  return { title: company?.name };
}

export default async function CompanyPage({ params }: PageProps<"/companies/[id]">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const [deals, timeline, files, t] = await Promise.all([
    listCompanyDeals(id),
    listTimeline({ companyId: id }),
    listAttachments({ companyId: id }),
    getTranslations(),
  ]);

  const location = [company.city, company.emirate && t(`options.emirate.${company.emirate}`)]
    .filter(Boolean)
    .join(", ");

  return (
    <>
      <PageHeader
        backHref="/companies"
        backLabel={t("companies.title")}
        title={company.name}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <CompanyStatusBadge status={company.status} />
            {company.industry && <span>{company.industry}</span>}
            {company.source && <span>· {t(`options.source.${company.source}`)}</span>}
          </span>
        }
        actions={
          <>
            <LogActivityButton companyId={company.id} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/companies/${company.id}/edit`}>
                <Pencil />
                {t("common.edit")}
              </Link>
            </Button>
            {hasRole(user, "owner") && (
              <DeleteButton
                action={deleteCompany.bind(null, company.id)}
                title={t("companies.deleteTitle", { name: company.name })}
                description={t("companies.deleteBody", { count: company.contacts.length })}
                successText={t("companies.deleted")}
                redirectTo="/companies"
              />
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("companies.contacts")}</CardTitle>
              <Button asChild size="sm">
                <Link href={`/contacts/new?company=${company.id}`}>
                  <Plus />
                  {t("companies.addContact")}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {company.contacts.length === 0 ? (
                <EmptyState className="py-8">{t("companies.noContacts")}</EmptyState>
              ) : (
                <ul className="divide-y">
                  {company.contacts.map((contact) => (
                    <li key={contact.id} className="grid gap-3 py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 font-medium">
                            {contact.full_name}
                            {contact.is_primary && <Badge>{t("contacts.primary")}</Badge>}
                            <Badge variant="outline">
                              {t(`options.language.${contact.preferred_language}`)}
                            </Badge>
                          </div>
                          {contact.job_title && (
                            <div className="text-sm text-muted-foreground">{contact.job_title}</div>
                          )}
                        </div>
                        <Button asChild variant="ghost" size="icon-sm" aria-label={t("contacts.edit")}>
                          <Link href={`/contacts/${contact.id}/edit`}>
                            <Pencil />
                          </Link>
                        </Button>
                      </div>
                      <ContactActions
                        phone={contact.phone}
                        whatsapp={contact.whatsapp}
                        email={contact.email}
                      />
                      {contact.notes && (
                        <p className="text-sm whitespace-pre-line text-muted-foreground">{contact.notes}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("activities.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline items={timeline} user={user} />
            </CardContent>
          </Card>
        </div>

        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("companies.deals")}</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link href={`/deals/new?company=${company.id}`}>
                  <Plus />
                  {t("deals.new")}
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("deals.noDeals")}</p>
              ) : (
                <ul className="divide-y">
                  {deals.map((deal) => (
                    <li key={deal.id} className="grid gap-1 py-3 first:pt-0 last:pb-0">
                      <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">
                        {deal.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <StageBadge stage={deal.stage} />
                        <DealValue fils={deal.value_fils} billing={deal.billing} />
                        <DueChip date={deal.next_follow_up_date} muted={isClosed(deal.stage)} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("companies.details")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {location && (
                <p className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  {location}
                </p>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <Globe className="size-4" />
                  <span className="truncate">{displayWebsite(company.website)}</span>
                </a>
              )}
              {company.instagram && (
                <a
                  href={instagramUrl(company.instagram)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <AtSign className="size-4" />
                  {company.instagram}
                </a>
              )}
              {company.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {company.tags.map((tag) => (
                    <Link key={tag} href={`/companies?tag=${encodeURIComponent(tag)}`}>
                      <Badge variant="outline" className="hover:bg-accent">
                        {tag}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
              {company.notes && (
                <div className="border-t pt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {t("companies.fields.notes")}
                  </p>
                  <p className="whitespace-pre-line">{company.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <FilesCard files={files} user={user} companyId={company.id} />
        </div>
      </div>
    </>
  );
}
