import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { NoAccess } from "@/components/no-access";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasRole, requireUser } from "@/lib/auth";
import { listServices } from "@/lib/data/services";
import { ServiceRow } from "./service-row";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings");
  return { title: t("title") };
}

/** Owner-only settings. Phase 2: the services catalogue. */
export default async function SettingsPage() {
  const user = await requireUser();
  if (!hasRole(user, "owner")) return <NoAccess user={user} />;
  const [services, t] = await Promise.all([listServices(), getTranslations("settings")]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t("title")} />
      <Card>
        <CardHeader className="grid gap-1">
          <CardTitle>{t("services")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("servicesHint")}</p>
        </CardHeader>
        <CardContent className="divide-y">
          {services.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
          <ServiceRow />
        </CardContent>
      </Card>
    </div>
  );
}
