import type { Metadata } from "next";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { ChannelIcon } from "@/components/activities/channel-icon";
import { ContactActions } from "@/components/contact-actions";
import { DealValue } from "@/components/deals/deal-value";
import { StageBadge } from "@/components/deals/stage-badge";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { CompanyStatusBadge } from "@/components/status-badge";
import { UrlFilters } from "@/components/url-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/data/companies";
import { listContacts } from "@/lib/data/contacts";
import { searchActivities } from "@/lib/data/activities";
import { listTableDeals } from "@/lib/data/deals";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

const PREVIEW = 8;

/**
 * One search box for everything: companies, contacts, deals and the
 * conversation history. (Projects join in Phase 4.)
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { q: rawQ } = await searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const [t, format] = await Promise.all([getTranslations(), getFormatter()]);

  const [companies, contacts, deals, activities] = q
    ? await Promise.all([
        listCompanies({ q, page: 1 }),
        listContacts({ q, page: 1 }),
        listTableDeals({ q, stage: "all", sort: "updated", page: 1 }),
        searchActivities(q),
      ])
    : [null, null, null, null];
  const nothing =
    companies &&
    contacts &&
    deals &&
    activities &&
    companies.total + contacts.total + deals.total + activities.total === 0;
  const qs = `q=${encodeURIComponent(q)}`;

  return (
    <>
      <PageHeader title={t("search.title")} />
      <UrlFilters searchPlaceholder={t("nav.searchPlaceholder")} />

      {!q && <EmptyState>{t("search.prompt")}</EmptyState>}
      {nothing && <EmptyState>{t("search.noResults", { q })}</EmptyState>}

      <div className="grid gap-4 lg:grid-cols-2">
        {companies && companies.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("search.companies")} <span className="text-muted-foreground">({companies.total})</span>
              </CardTitle>
              {companies.total > PREVIEW && (
                <Link href={`/companies?${qs}`} className="text-sm text-primary hover:underline">
                  {t("search.seeAll")}
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {companies.companies.slice(0, PREVIEW).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                    <Link href={`/companies/${c.id}`} className="truncate font-medium hover:underline">
                      {c.name}
                    </Link>
                    <CompanyStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {contacts && contacts.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("search.contacts")} <span className="text-muted-foreground">({contacts.total})</span>
              </CardTitle>
              {contacts.total > PREVIEW && (
                <Link href={`/contacts?${qs}`} className="text-sm text-primary hover:underline">
                  {t("search.seeAll")}
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {contacts.contacts.slice(0, PREVIEW).map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <Link
                        href={`/contacts/${c.id}/edit`}
                        className="block truncate font-medium hover:underline"
                      >
                        {c.full_name}
                      </Link>
                      {c.company && (
                        <Link
                          href={`/companies/${c.company.id}`}
                          className="block truncate text-sm text-muted-foreground hover:underline"
                        >
                          {c.company.name}
                        </Link>
                      )}
                    </div>
                    <ContactActions variant="compact" phone={c.phone} whatsapp={c.whatsapp} email={c.email} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {deals && deals.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("search.deals")} <span className="text-muted-foreground">({deals.total})</span>
              </CardTitle>
              {deals.total > PREVIEW && (
                <Link
                  href={`/pipeline?view=table&stage=all&${qs}`}
                  className="text-sm text-primary hover:underline"
                >
                  {t("search.seeAll")}
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {deals.deals.slice(0, PREVIEW).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 py-2">
                    <div className="min-w-0">
                      <Link href={`/deals/${d.id}`} className="block truncate font-medium hover:underline">
                        {d.title}
                      </Link>
                      <span className="block truncate text-sm text-muted-foreground">
                        {d.company?.name} · <DealValue fils={d.value_fils} billing={d.billing} />
                      </span>
                    </div>
                    <StageBadge stage={d.stage} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {activities && activities.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                {t("search.activities")} <span className="text-muted-foreground">({activities.total})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y">
                {activities.activities.map((a) => (
                  <li key={a.id} className="flex gap-3 py-2">
                    <ChannelIcon channel={a.channel} className="size-7" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm">{a.summary}</p>
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(a.occurred_at), {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {a.company && (
                          <>
                            {" · "}
                            <Link href={`/companies/${a.company.id}`} className="hover:underline">
                              {a.company.name}
                            </Link>
                          </>
                        )}
                        {a.deal && (
                          <>
                            {" · "}
                            <Link href={`/deals/${a.deal.id}`} className="hover:underline">
                              {a.deal.title}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
