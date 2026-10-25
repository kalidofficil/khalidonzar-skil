"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { FormMessage, SubmitButton } from "@/components/form-bits";
import { initialFormState } from "@/lib/forms";
import { updatePassword, updateProfile } from "./actions";

// Password errors use keys from the "account" messages, everything else "errors".
function useAccountError() {
  const t = useTranslations("account");
  return (errors?: string[]) =>
    errors?.map((e) => (t.has(e as never) ? t(e as never) : e));
}

export function ProfileForm({ fullName }: { fullName: string }) {
  const t = useTranslations("account");
  const [state, formAction] = useActionState(updateProfile, initialFormState);

  useEffect(() => {
    if (state.ok) toast.success(t("profileSaved"));
  }, [state, t]);

  return (
    <form action={formAction} className="grid gap-4">
      <FormMessage state={state} />
      <Field id="full_name" label={t("fullName")} errors={state.errors?.full_name}>
        <Input
          id="full_name"
          name="full_name"
          autoComplete="name"
          required
          defaultValue={state.values?.full_name ?? fullName}
        />
      </Field>
      <SubmitButton className="w-fit">{t("saveProfile")}</SubmitButton>
    </form>
  );
}

export function PasswordForm() {
  const t = useTranslations("account");
  const translate = useAccountError();
  const [state, formAction] = useActionState(updatePassword, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(t("passwordUpdated"));
      formRef.current?.reset();
    }
  }, [state, t]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-4">
      <FormMessage state={state} />
      <Field id="password" label={t("newPassword")} errors={translate(state.errors?.password)}>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <Field id="confirm" label={t("confirmPassword")} errors={translate(state.errors?.confirm)}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} required />
      </Field>
      <SubmitButton className="w-fit">{t("updatePassword")}</SubmitButton>
    </form>
  );
}
