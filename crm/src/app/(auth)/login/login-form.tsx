"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/form-bits";
import { initialFormState } from "@/lib/forms";
import { signIn } from "../actions";

export function LoginForm({ next, linkError }: { next?: string; linkError?: boolean }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [state, formAction] = useActionState(signIn, initialFormState);

  useEffect(() => {
    if (state.ok && state.redirectTo) {
      router.replace(state.redirectTo);
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t("signInTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("signInSubtitle")}</p>
      </div>
      {linkError && !state.message && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("linkError")}
        </p>
      )}
      {state.message && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {t("invalidCredentials")}
        </p>
      )}
      <input type="hidden" name="next" value={next ?? ""} />
      <Field id="email" label={t("email")}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          defaultValue={state.values?.email}
        />
      </Field>
      <Field id="password" label={t("password")}>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <SubmitButton pendingLabel={t("signingIn")} className="w-full">
        {t("signIn")}
      </SubmitButton>
      <Link href="/forgot-password" className="text-center text-sm text-muted-foreground hover:underline">
        {t("forgotPassword")}
      </Link>
    </form>
  );
}
