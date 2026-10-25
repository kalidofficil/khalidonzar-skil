"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/lib/forms";

/** Submit button that shows a spinner while the form is saving. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
  variant,
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const { pending } = useFormStatus();
  const t = useTranslations("common");
  return (
    <Button type="submit" disabled={pending} className={className} variant={variant}>
      {pending && <LoaderCircle className="animate-spin" />}
      {pending ? (pendingLabel ?? t("saving")) : children}
    </Button>
  );
}

/** Error banner at the top of a form. */
export function FormMessage({ state }: { state: FormState }) {
  const t = useTranslations("errors");
  if (state.ok || !state.message) return null;
  const text = t.has(state.message as never) ? t(state.message as never) : state.message;
  return (
    <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {text}
    </p>
  );
}

/**
 * After a successful save: show a toast and go to `redirectTo`.
 * The success text is passed in already translated.
 */
export function useFormSuccess(state: FormState, successText: string) {
  const router = useRouter();
  useEffect(() => {
    if (!state.ok) return;
    toast.success(successText);
    if (state.redirectTo) router.push(state.redirectTo);
    else router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per new result
  }, [state]);
}
