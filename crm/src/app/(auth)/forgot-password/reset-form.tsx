"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/form-bits";
import { initialFormState } from "@/lib/forms";
import { requestPasswordReset } from "../actions";

export function ResetForm() {
  const t = useTranslations("auth");
  const [state, formAction] = useActionState(requestPasswordReset, initialFormState);

  return (
    <form action={formAction} className="grid gap-4">
      <div>
        <h1 className="text-xl font-semibold">{t("resetTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("resetSubtitle")}</p>
      </div>
      {state.ok ? (
        <p role="status" className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          {t("resetSent")}
        </p>
      ) : (
        <>
          <Field id="email" label={t("email")}>
            <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
          </Field>
          <SubmitButton className="w-full">{t("resetSend")}</SubmitButton>
        </>
      )}
      <Link href="/login" className="text-center text-sm text-muted-foreground hover:underline">
        {t("backToSignIn")}
      </Link>
    </form>
  );
}
