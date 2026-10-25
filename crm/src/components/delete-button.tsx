"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { FormState } from "@/lib/forms";

/** Delete button with an "are you sure?" pop-up. Calls a Server Action. */
export function DeleteButton({
  action,
  title,
  description,
  successText,
  redirectTo,
  size = "sm",
}: {
  action: () => Promise<FormState>;
  title: string;
  description: string;
  successText: string;
  /** Page to open afterwards; leave out to stay and refresh. */
  redirectTo?: string;
  size?: "sm" | "icon-sm";
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        setOpen(false);
        toast.success(successText);
        if (redirectTo) router.push(redirectTo);
        else router.refresh();
      } else {
        const key = `errors.${result.message ?? "generic"}`;
        toast.error(t.has(key as never) ? t(key as never) : (result.message ?? t("errors.generic")));
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size={size} className="text-destructive" aria-label={t("common.delete")}>
          <Trash2 />
          {size !== "icon-sm" && t("common.delete")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{t("common.cancel")}</AlertDialogCancel>
          <Button variant="destructive" onClick={confirm} disabled={pending}>
            {pending && <LoaderCircle className="animate-spin" />}
            {pending ? t("common.deleting") : t("common.delete")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
