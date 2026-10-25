import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import { ContactActions } from "@/components/contact-actions";
import { EmptyState } from "@/components/empty-state";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { UrlFilters } from "@/components/url-filters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hasRole, requireUser } from "@/lib/auth";
import { listContacts, parseContactFilters } from "@/lib/data/contacts";
import { LANGUAGES } from "@/lib/options";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contacts");
  return { title: t("title") };
}

export default async function ContactsPage({ searchParams }: PageProps<"/contacts">) {
  const user = await requireUser();
  if (!hasRole(user, "owner", "sales")) return <NoAccess user={user} />;

  const filters = parseContactFilters(await searchParams);
  const [{ contacts, total, pageCount }, t] = await Promise.all([listContacts(filters), getTranslations()]);
  const filtered = Boolean(filters.q || filters.language);

  return (
    <>
      <PageHeader
        title={t("contacts.title")}
        description={t("common.resultCount", { count: total })}
        actions={
          <Button asChild>
            <Link href="/contacts/new">
              <Plus />
              {t("contacts.new")}
            </Link>
          </Button>
        }
      />

      <UrlFilters
        searchPlaceholder={t("contacts.searchPlaceholder")}
        selects={[
          {
            name: "language",
            label: t("contacts.filters.language"),
            emptyLabel: t("contacts.filters.anyLanguage"),
            options: LANGUAGES.map((l) => ({ value: l, label: t(`options.language.${l}`) })),
          },
        ]}
      />

      {contacts.length === 0 ? (
        <EmptyState>{filtered ? t("contacts.emptyFiltered") : t("contacts.empty")}</EmptyState>
      ) : (
        <>
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {contacts.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/contacts/${c.id}/edit`} className="font-medium hover:underline">
                      {c.full_name}
                    </Link>
                    {c.is_primary && <Badge>{t("contacts.primary")}</Badge>}
                    {c.preferred_language !== "en" && (
                      <Badge variant="outline">{t(`options.language.${c.preferred_language}`)}</Badge>
                    )}
                  </div>
                  <div className="truncate text-sm text-muted-foreground">
                    {c.job_title && <span>{c.job_title} · </span>}
                    {c.company && (
                      <Link href={`/companies/${c.company.id}`} className="hover:underline">
                        {c.company.name}
                      </Link>
                    )}
                  </div>
                </div>
                <ContactActions variant="compact" phone={c.phone} whatsapp={c.whatsapp} email={c.email} />
              </li>
            ))}
          </ul>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            pathname="/contacts"
            params={{ q: filters.q, language: filters.language }}
          />
        </>
      )}
    </>
  );
}
