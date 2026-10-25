"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton, useFormSuccess } from "@/components/form-bits";
import type { Contact } from "@/lib/types";
import { initialFormState } from "@/lib/forms";
import { LANGUAGES } from "@/lib/options";
import { formatPhone } from "@/lib/phone";
import { saveContact } from "./actions";

export function ContactForm({
  contact,
  companies,
  companyId,
  cancelHref,
}: {
  contact?: Contact;
  /** Shown as a picker when the company isn't fixed. */
  companies?: { id: string; name: string }[];
  companyId?: string;
  cancelHref: string;
}) {
  const t = useTranslations();
  const f = useTranslations("contacts.fields");
  const [state, formAction] = useActionState(saveContact, initialFormState);
  useFormSuccess(state, t("contacts.saved"));

  const v = (name: keyof Contact, fallback?: string | null) => state.values?.[name] ?? fallback ?? "";
  const err = (name: string) => state.errors?.[name];
  const fixedCompany = contact?.company_id ?? companyId;

  return (
    <form action={formAction} className="grid gap-5">
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <FormMessage state={state} />

      {fixedCompany && !companies ? (
        <>
          <input type="hidden" name="company_id" value={fixedCompany} />
          {err("company_id") && <FormMessage state={{ ok: false, message: "notFound" }} />}
        </>
      ) : (
        <Field id="company_id" label={f("company")} errors={err("company_id")}>
          <NativeSelect id="company_id" name="company_id" required defaultValue={v("company_id", fixedCompany)}>
            <option value="">{t("companies.select.none")}</option>
            {companies?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="full_name" label={f("full_name")} errors={err("full_name")}>
          <Input
            id="full_name"
            name="full_name"
            required
            autoFocus={!contact}
            autoComplete="off"
            defaultValue={v("full_name", contact?.full_name)}
          />
        </Field>
        <Field id="job_title" label={f("job_title")} errors={err("job_title")} optional>
          <Input id="job_title" name="job_title" defaultValue={v("job_title", contact?.job_title)} />
        </Field>
        <Field id="phone" label={f("phone")} hint={f("phoneHint")} errors={err("phone")} optional>
          <Input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            dir="ltr"
            defaultValue={v("phone", formatPhone(contact?.phone))}
          />
        </Field>
        <Field id="whatsapp" label={f("whatsapp")} hint={f("whatsappHint")} errors={err("whatsapp")} optional>
          <Input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            inputMode="tel"
            dir="ltr"
            defaultValue={v("whatsapp", formatPhone(contact?.whatsapp))}
          />
        </Field>
        <Field id="email" label={f("email")} errors={err("email")} optional>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            dir="ltr"
            defaultValue={v("email", contact?.email)}
          />
        </Field>
        <Field id="preferred_language" label={f("preferred_language")} errors={err("preferred_language")}>
          <NativeSelect
            id="preferred_language"
            name="preferred_language"
            defaultValue={v("preferred_language", contact?.preferred_language ?? "en")}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {t(`options.language.${l}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_primary"
          defaultChecked={state.values ? state.values.is_primary === "on" : contact?.is_primary}
          className="size-4 accent-[var(--primary)]"
        />
        {f("is_primary")}
      </label>

      <Field id="notes" label={f("notes")} errors={err("notes")} optional>
        <Textarea id="notes" name="notes" rows={3} defaultValue={v("notes", contact?.notes)} />
      </Field>

      <div className="flex gap-2">
        <SubmitButton>{t("common.save")}</SubmitButton>
        <Button asChild variant="outline">
          <Link href={cancelHref}>{t("common.cancel")}</Link>
        </Button>
      </div>
    </form>
  );
}
