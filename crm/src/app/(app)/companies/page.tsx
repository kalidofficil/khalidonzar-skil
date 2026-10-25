import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { CompanyStatusBadge } from "@/components/status-badge";
import { UrlFilters } from "@/components/url-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasRole, requireUser } from "@/lib/auth";
import { listCompanies, listTags, parseCompanyFilters, type CompanyListItem } from "@/lib/data/companies";
import { COMPANY_SOURCES, COMPANY_STATUSES, EMIRATES } from "@/lib/options";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("companies");
  return { title: t("title") };
}

function primaryContact(company: CompanyListItem) {
  return company.contacts.find((c) => c.is_primary) ?? company.contacts[0];
}

export default async function CompaniesPage({ searchParams }: PageProps<"/companies">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const params = await searchParams;
  const filters = parseCompanyFilters(params);
  const [{ companies, total, pageCount }, tags, t] = await Promise.all([
    listCompanies(filters),
    listTags(),
    getTranslations(),
  ]);
  const filtered = Boolean(filters.q || filters.status || filters.source || filters.emirate || filters.tag);

  const location = (c: CompanyListItem) =>
    [c.city, c.emirate && t(`options.emirate.${c.emirate}`)].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader
        title={t("companies.title")}
        description={t("common.resultCount", { count: total })}
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus />
              {t("companies.new")}
            </Link>
          </Button>
        }
      />

      <UrlFilters
        searchPlaceholder={t("companies.searchPlaceholder")}
        selects={[
          {
            name: "status",
            label: t("companies.filters.status"),
            emptyLabel: t("companies.filters.anyStatus"),
            options: COMPANY_STATUSES.map((s) => ({ value: s, label: t(`options.status.${s}`) })),
          },
          {
            name: "source",
            label: t("companies.filters.source"),
            emptyLabel: t("companies.filters.anySource"),
            options: COMPANY_SOURCES.map((s) => ({ value: s, label: t(`options.source.${s}`) })),
          },
          {
            name: "emirate",
            label: t("companies.filters.emirate"),
            emptyLabel: t("companies.filters.anyEmirate"),
            options: EMIRATES.map((e) => ({ value: e, label: t(`options.emirate.${e}`) })),
          },
          ...(tags.length
            ? [
                {
                  name: "tag",
                  label: t("companies.filters.tag"),
                  emptyLabel: t("companies.filters.anyTag"),
                  options: tags.map((tag) => ({ value: tag, label: tag })),
                },
              ]
            : []),
        ]}
      />

      {companies.length === 0 ? (
        <EmptyState
          action={
            !filtered && (
              <Button asChild>
                <Link href="/companies/new">
                  <Plus />
                  {t("companies.new")}
                </Link>
              </Button>
            )
          }
        >
          {filtered ? t("companies.emptyFiltered") : t("companies.empty")}
        </EmptyState>
      ) : (
        <>
          {/* Phones: one card per company */}
          <ul className="grid gap-2 md:hidden">
            {companies.map((c) => {
              const contact = primaryContact(c);
              return (
                <li key={c.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/companies/${c.id}`} className="min-w-0 font-medium hover:underline">
                      <span className="block truncate">{c.name}</span>
                    </Link>
                    <CompanyStatusBadge status={c.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {[c.industry, location(c)].filter(Boolean).join(" · ")}
                  </p>
                  {contact && (
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="truncate text-sm">{contact.full_name}</span>
                      <ContactActions
                        variant="compact"
                        phone={contact.phone}
                        whatsapp={contact.whatsapp}
                        email={contact.email}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Larger screens: a table */}
          <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 text-start text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">{t("companies.fields.name")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("companies.fields.status")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("companies.fields.industry")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("companies.contacts")}</th>
                  <th className="px-4 py-3 text-start font-medium">{t("companies.fields.tags")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {companies.map((c) => {
                  const contact = primaryContact(c);
                  return (
                    <tr key={c.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/companies/${c.id}`} className="font-medium hover:underline">
                          {c.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{location(c)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <CompanyStatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {c.industry}
                        {c.source && <div className="text-xs">{t(`options.source.${c.source}`)}</div>}
                      </td>
                      <td className="px-4 py-3">
                        {contact ? (
                          <div className="flex items-center gap-3">
                            <div className="min-w-0">
                              <div className="truncate">{contact.full_name}</div>
                              {c.contacts.length > 1 && (
                                <div className="text-xs text-muted-foreground">
                                  {t("companies.contactsCount", { count: c.contacts.length })}
                                </div>
                              )}
                            </div>
                            <ContactActions
                              variant="compact"
                              phone={contact.phone}
                              whatsapp={contact.whatsapp}
                              email={contact.email}
                              className="ms-auto flex-nowrap"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {c.tags.map((tag) => (
                            <Badge key={tag} variant="outline">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            pathname="/companies"
            params={{
              q: filters.q,
              status: filters.status,
              source: filters.source,
              emirate: filters.emirate,
              tag: filters.tag,
            }}
          />
        </>
      )}
    </>
  );
}
