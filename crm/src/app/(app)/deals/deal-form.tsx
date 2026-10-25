"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FormMessage, SubmitButton, useFormSuccess } from "@/components/form-bits";
import { initialFormState } from "@/lib/forms";
import { filsToInput } from "@/lib/money";
import { BILLING_TYPES, LOST_REASONS, STAGES, STAGE_PROBABILITY, type DealStage } from "@/lib/pipeline";
import type { Deal, Service } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getCompanyContacts, saveDeal } from "./actions";

type Option = { id: string; name: string };
type ContactOption = { id: string; full_name: string };

export function DealForm({
  deal,
  serviceIds = [],
  companies,
  companyId,
  contacts: initialContacts,
  services,
  defaultStage = "lead",
  cancelHref,
}: {
  deal?: Deal;
  serviceIds?: string[];
  /** Company picker options; omit when the company is fixed. */
  companies?: Option[];
  companyId?: string;
  contacts: ContactOption[];
  services: Service[];
  defaultStage?: DealStage;
  cancelHref: string;
}) {
  const t = useTranslations();
  const f = useTranslations("deals.fields");
  const [state, formAction] = useActionState(saveDeal, initialFormState);
  useFormSuccess(state, deal ? t("deals.saved") : t("deals.created"));

  const v = (name: string, fallback?: string | number | null) =>
    state.values?.[name] ?? (fallback == null ? "" : String(fallback));
  const err = (name: string) => state.errors?.[name];

  const [company, setCompany] = useState(v("company_id", deal?.company_id ?? companyId));
  const [contacts, setContacts] = useState<ContactOption[]>(initialContacts);
  const [billing, setBilling] = useState(v("billing", deal?.billing ?? "one_off"));
  const [stage, setStage] = useState<DealStage>((v("stage", deal?.stage ?? defaultStage) as DealStage) || "lead");

  // Picking another company loads its contacts.
  useEffect(() => {
    if (!companies || !company || company === (deal?.company_id ?? companyId)) return;
    let cancelled = false;
    getCompanyContacts(company).then((list) => !cancelled && setContacts(list));
    return () => {
      cancelled = true;
    };
  }, [company, companies, companyId, deal?.company_id]);

  const ticked = new Set(state.values ? (state.values.service_ids ?? "").split(",") : serviceIds);
  const activeServices = services.filter((s) => s.is_active || serviceIds.includes(s.id));

  return (
    <form action={formAction} className="grid gap-5">
      {deal && <input type="hidden" name="id" value={deal.id} />}
      <FormMessage state={state} />

      {companies ? (
        <Field id="company_id" label={f("company")} errors={err("company_id")}>
          <NativeSelect
            id="company_id"
            name="company_id"
            required
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              setContacts([]);
            }}
          >
            <option value="">—</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : (
        <input type="hidden" name="company_id" value={company} />
      )}

      <Field id="title" label={f("title")} hint={f("titleHint")} errors={err("title")}>
        <Input id="title" name="title" required autoFocus={!deal} defaultValue={v("title", deal?.title)} />
      </Field>

      {activeServices.length > 0 && (
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-sm font-medium">
            {f("services")} <span className="font-normal text-muted-foreground">({t("common.optional")})</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {activeServices.map((s) => (
              <label
                key={s.id}
                className="cursor-pointer rounded-full border bg-card px-3 py-1.5 text-sm has-checked:border-primary has-checked:bg-primary/10 has-checked:text-primary"
              >
                <input
                  type="checkbox"
                  name="service_ids"
                  value={s.id}
                  defaultChecked={ticked.has(s.id)}
                  className="sr-only"
                />
                {s.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="value_fils" label={f("value")} hint={f("valueHint")} errors={err("value_fils")}>
          <Input
            id="value_fils"
            name="value_fils"
            inputMode="decimal"
            placeholder="0"
            dir="ltr"
            defaultValue={v("value_fils", deal ? filsToInput(deal.value_fils) : "")}
          />
        </Field>
        <Field id="billing" label={f("billing")} errors={err("billing")}>
          <NativeSelect id="billing" name="billing" value={billing} onChange={(e) => setBilling(e.target.value)}>
            {BILLING_TYPES.map((b) => (
              <option key={b} value={b}>
                {t(`options.billing.${b}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          id="term_months"
          label={f("term_months")}
          errors={err("term_months")}
          className={cn(billing !== "monthly" && "hidden")}
        >
          <Input
            id="term_months"
            name="term_months"
            type="number"
            min={1}
            max={120}
            inputMode="numeric"
            defaultValue={v("term_months", deal?.billing === "monthly" ? deal.term_months : 3)}
          />
        </Field>
        <Field id="stage" label={f("stage")} errors={err("stage")}>
          <NativeSelect id="stage" name="stage" value={stage} onChange={(e) => setStage(e.target.value as DealStage)}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {t(`options.stage.${s}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field
          id="probability"
          label={f("probability")}
          hint={f("probabilityHint", { default: STAGE_PROBABILITY[stage] })}
          errors={err("probability")}
          optional
        >
          <Input
            id="probability"
            name="probability"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            placeholder={String(STAGE_PROBABILITY[stage])}
            // A probability equal to the stage default is shown as "use default".
            defaultValue={v(
              "probability",
              deal && deal.probability !== STAGE_PROBABILITY[deal.stage] ? deal.probability : "",
            )}
          />
        </Field>
        <Field id="primary_contact_id" label={f("primary_contact_id")} errors={err("primary_contact_id")} optional>
          <NativeSelect
            id="primary_contact_id"
            name="primary_contact_id"
            defaultValue={v("primary_contact_id", deal?.primary_contact_id)}
            key={contacts.map((c) => c.id).join()}
          >
            <option value="">—</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="expected_close_date" label={f("expected_close_date")} errors={err("expected_close_date")} optional>
          <Input
            id="expected_close_date"
            name="expected_close_date"
            type="date"
            defaultValue={v("expected_close_date", deal?.expected_close_date)}
          />
        </Field>
        <Field id="next_follow_up_date" label={f("next_follow_up_date")} errors={err("next_follow_up_date")} optional>
          <Input
            id="next_follow_up_date"
            name="next_follow_up_date"
            type="date"
            defaultValue={v("next_follow_up_date", deal?.next_follow_up_date)}
          />
        </Field>
      </div>

      {stage === "lost" && (
        <div className="grid gap-5 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:grid-cols-2">
          <Field id="lost_reason" label={f("lost_reason")} errors={err("lost_reason")}>
            <NativeSelect id="lost_reason" name="lost_reason" required defaultValue={v("lost_reason", deal?.lost_reason)}>
              <option value="">—</option>
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`options.lostReason.${r}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="lost_note" label={f("lost_note")} errors={err("lost_note")} optional>
            <Input id="lost_note" name="lost_note" defaultValue={v("lost_note", deal?.lost_note)} />
          </Field>
        </div>
      )}

      <Field id="notes" label={f("notes")} errors={err("notes")} optional>
        <Textarea id="notes" name="notes" rows={3} defaultValue={v("notes", deal?.notes)} />
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
