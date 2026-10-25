import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ContactActions } from "@/components/contact-actions";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { CompanyStatusBadge } from "@/components/status-badge";
import { UrlFilters } from "@/components/url-filters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listCompanies } from "@/lib/data/companies";
import { listContacts } from "@/lib/data/contacts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

const PREVIEW = 8;

/**
 * One search box for everything. Phase 1 covers companies and contacts; later
 * phases add deals, activities and projects here.
 */
export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const { q: rawQ } = await searchParams;
  const q = typeof rawQ === "string" ? rawQ.trim() : "";
  const t = await getTranslations();

  const [companies, contacts] = q
    ? await Promise.all([
        listCompanies({ q, page: 1 }),
        listContacts({ q, page: 1 }),
      ])
    : [null, null];
  const nothing = companies && contacts && companies.total + contacts.total === 0;
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
                      <Link href={`/contacts/${c.id}/edit`} className="block truncate font-medium hover:underline">
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
      </div>
    </>
  );
}
