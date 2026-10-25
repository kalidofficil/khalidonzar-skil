"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton, useFormSuccess } from "@/components/form-bits";
import type { Company } from "@/lib/types";
import { initialFormState } from "@/lib/forms";
import { COMPANY_SOURCES, COMPANY_STATUSES, EMIRATES, INDUSTRY_SUGGESTIONS } from "@/lib/options";
import { saveCompany } from "./actions";

export function CompanyForm({
  company,
  industries,
  cancelHref,
}: {
  company?: Company;
  industries: string[];
  cancelHref: string;
}) {
  const t = useTranslations();
  const f = useTranslations("companies.fields");
  const [state, formAction] = useActionState(saveCompany, initialFormState);
  useFormSuccess(state, company ? t("companies.updated") : t("companies.created"));

  // After a failed save, refill fields with what was typed.
  const v = (name: keyof Company, fallback?: string | null) =>
    state.values?.[name] ?? fallback ?? "";
  const err = (name: string) => state.errors?.[name];
  const industryOptions = [...new Set([...industries, ...INDUSTRY_SUGGESTIONS])].sort();

  return (
    <form action={formAction} className="grid gap-5">
      {company && <input type="hidden" name="id" value={company.id} />}
      <FormMessage state={state} />

      <Field id="name" label={f("name")} errors={err("name")}>
        <Input id="name" name="name" required autoFocus={!company} defaultValue={v("name", company?.name)} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="status" label={f("status")} errors={err("status")}>
          <NativeSelect id="status" name="status" defaultValue={v("status", company?.status ?? "lead")}>
            {COMPANY_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`options.status.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="source" label={f("source")} errors={err("source")} optional>
          <NativeSelect id="source" name="source" defaultValue={v("source", company?.source)}>
            <option value="">{t("companies.select.none")}</option>
            {COMPANY_SOURCES.map((s) => (
              <option key={s} value={s}>
                {t(`options.source.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="industry" label={f("industry")} errors={err("industry")} optional>
          <Input id="industry" name="industry" list="industry-options" defaultValue={v("industry", company?.industry)} />
          <datalist id="industry-options">
            {industryOptions.map((i) => (
              <option key={i} value={i} />
            ))}
          </datalist>
        </Field>
        <Field id="emirate" label={f("emirate")} errors={err("emirate")} optional>
          <NativeSelect id="emirate" name="emirate" defaultValue={v("emirate", company?.emirate)}>
            <option value="">{t("companies.select.none")}</option>
            {EMIRATES.map((e) => (
              <option key={e} value={e}>
                {t(`options.emirate.${e}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="city" label={f("city")} errors={err("city")} optional>
          <Input id="city" name="city" defaultValue={v("city", company?.city)} />
        </Field>
        <Field id="website" label={f("website")} errors={err("website")} optional>
          <Input
            id="website"
            name="website"
            inputMode="url"
            placeholder="example.ae"
            defaultValue={v("website", company?.website)}
          />
        </Field>
        <Field id="instagram" label={f("instagram")} errors={err("instagram")} optional>
          <Input id="instagram" name="instagram" placeholder="@handle" defaultValue={v("instagram", company?.instagram)} />
        </Field>
        <Field id="tags" label={f("tags")} hint={f("tagsHint")} errors={err("tags")} optional>
          <Input id="tags" name="tags" defaultValue={state.values?.tags ?? company?.tags.join(", ") ?? ""} />
        </Field>
      </div>

      <Field id="notes" label={f("notes")} errors={err("notes")} optional>
        <Textarea id="notes" name="notes" rows={4} defaultValue={v("notes", company?.notes)} />
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
