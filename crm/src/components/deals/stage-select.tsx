"use client";

import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import { NativeSelect } from "@/components/ui/input";
import { STAGES, type DealStage } from "@/lib/pipeline";
import { LostReasonDialog } from "./lost-reason-dialog";
import { useMoveDeal } from "./use-move-deal";

/** Dropdown that moves a deal to another stage (deal page, phone-friendly). */
export function StageSelect({ dealId, stage }: { dealId: string; stage: DealStage }) {
  const t = useTranslations();
  const { request, lostDialog, isPending } = useMoveDeal();

  return (
    <div className="flex items-center gap-2">
      <NativeSelect
        aria-label={t("deals.stage")}
        value={stage}
        disabled={isPending}
        onChange={(e) => request({ id: dealId, stage: e.target.value as DealStage })}
        className="w-auto min-w-44"
      >
        {STAGES.map((s) => (
          <option key={s} value={s}>
            {t(`options.stage.${s}`)}
          </option>
        ))}
      </NativeSelect>
      {isPending && <LoaderCircle className="size-4 animate-spin text-muted-foreground" />}
      <LostReasonDialog {...lostDialog} />
    </div>
  );
}
