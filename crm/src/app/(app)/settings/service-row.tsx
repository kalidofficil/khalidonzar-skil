"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { SubmitButton } from "@/components/form-bits";
import { Input, NativeSelect } from "@/components/ui/input";
import { initialFormState } from "@/lib/forms";
import { filsToInput } from "@/lib/money";
import { BILLING_TYPES } from "@/lib/pipeline";
import type { Service } from "@/lib/types";
import { saveService } from "./actions";

/** One editable service (or, without `service`, the "add" row). */
export function ServiceRow({ service }: { service?: Service }) {
  const t = useTranslations();
  const s = useTranslations("settings");
  const [state, formAction] = useActionState(saveService, initialFormState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    toast.success(s("saved"));
    if (!service) formRef.current?.reset();
  }, [state, s, service]);

  const error = state.message ?? Object.values(state.errors ?? {})[0]?.[0];

  return (
    <form ref={formRef} action={formAction} className="grid gap-2 py-3 sm:grid-cols-[1fr_11rem_9rem_auto_auto] sm:items-center">
      {service && <input type="hidden" name="id" value={service.id} />}
      <Input name="name" required aria-label={s("serviceName")} placeholder={s("serviceName")} defaultValue={service?.name} />
      <NativeSelect name="billing" aria-label={s("defaultBilling")} defaultValue={service?.billing ?? "one_off"}>
        {BILLING_TYPES.map((b) => (
          <option key={b} value={b}>
            {t(`options.billing.${b}`)}
          </option>
        ))}
      </NativeSelect>
      <Input
        name="default_price_fils"
        inputMode="decimal"
        aria-label={s("defaultPrice")}
        placeholder={s("defaultPrice")}
        defaultValue={filsToInput(service?.default_price_fils)}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={service?.is_active ?? true} className="size-4" />
        {s("active")}
      </label>
      <SubmitButton variant={service ? "outline" : "default"}>{service ? t("common.save") : s("addService")}</SubmitButton>
      {error && (
        <p className="text-xs text-destructive sm:col-span-5">
          {t.has(`errors.${error}` as never) ? t(`errors.${error}` as never) : t("errors.generic")}
        </p>
      )}
    </form>
  );
}
