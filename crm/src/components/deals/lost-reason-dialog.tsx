"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { LOST_REASONS } from "@/lib/pipeline";
import type { Enums } from "@/lib/database.types";

/** Asks why a deal was lost before moving it to "Lost". */
export function LostReasonDialog({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: (reason: Enums<"lost_reason">, note: string) => void;
}) {
  const t = useTranslations();
  const [reason, setReason] = useState<Enums<"lost_reason"> | "">("");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent closeLabel={t("common.close")}>
        <DialogTitle>{t("pipeline.lostDialog.title")}</DialogTitle>
        <DialogDescription>{t("pipeline.lostDialog.description")}</DialogDescription>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason) onConfirm(reason, note);
            setReason("");
            setNote("");
          }}
        >
          <Field id="lost_reason_dialog" label={t("pipeline.lostDialog.reason")}>
            <NativeSelect
              id="lost_reason_dialog"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value as Enums<"lost_reason">)}
            >
              <option value="">—</option>
              {LOST_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`options.lostReason.${r}`)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field id="lost_note_dialog" label={t("pipeline.lostDialog.note")} optional>
            <Textarea id="lost_note_dialog" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="destructive" disabled={!reason}>
              {t("pipeline.lostDialog.confirm")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
