import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { PasswordForm, ProfileForm } from "./account-forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default async function AccountPage({ searchParams }: PageProps<"/account">) {
  const user = await requireUser();
  const t = await getTranslations("account");
  const { setPassword } = await searchParams;

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        title={t("title")}
        description={
          <span className="flex items-center gap-2">
            {user.email}
            <Badge variant="secondary">{t(`roles.${user.role ?? "none"}`)}</Badge>
          </span>
        }
      />
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t("profile")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm fullName={user.fullName} />
          </CardContent>
        </Card>
        <Card className={setPassword ? "ring-2 ring-primary" : undefined}>
          <CardHeader>
            <CardTitle>{t("passwordTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            {setPassword && <p className="text-sm text-muted-foreground">{t("setPasswordPrompt")}</p>}
            <PasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
