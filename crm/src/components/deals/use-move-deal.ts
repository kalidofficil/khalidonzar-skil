"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { moveDeal } from "@/app/(app)/deals/actions";
import type { Enums } from "@/lib/database.types";
import type { DealStage } from "@/lib/pipeline";

type Move = { id: string; stage: DealStage; position?: number };

/**
 * Moves a deal between stages, asking for a lost reason first when needed.
 * Returns `request(move)` plus the state the LostReasonDialog needs.
 */
export function useMoveDeal({ onFailed }: { onFailed?: () => void } = {}) {
  const t = useTranslations();
  const router = useRouter();
  const [pendingLost, setPendingLost] = useState<Move | null>(null);
  const [isPending, startTransition] = useTransition();

  function send(move: Move, lost?: { reason: Enums<"lost_reason">; note: string }) {
    startTransition(async () => {
      const result = await moveDeal({ ...move, lost_reason: lost?.reason, lost_note: lost?.note });
      if (!result.ok) {
        toast.error(t("errors.generic"));
        onFailed?.();
        return;
      }
      if (move.stage === "won") toast.success(t("pipeline.wonToast"));
      else toast.success(t("pipeline.moved", { stage: t(`options.stage.${move.stage}`) }));
      router.refresh();
    });
  }

  return {
    isPending,
    request(move: Move) {
      if (move.stage === "lost") setPendingLost(move);
      else send(move);
    },
    lostDialog: {
      open: pendingLost !== null,
      onCancel() {
        setPendingLost(null);
        onFailed?.();
      },
      onConfirm(reason: Enums<"lost_reason">, note: string) {
        if (pendingLost) send(pendingLost, { reason, note });
        setPendingLost(null);
      },
    },
  };
}
