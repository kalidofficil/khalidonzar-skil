"use client";

import { useTranslations } from "next-intl";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/** Copies `value` to the clipboard and confirms with a toast. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const t = useTranslations("common");

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${t("copied")}: ${value}`);
    } catch {
      // Older browsers / non-HTTPS: fall back to a prompt the user can copy from.
      window.prompt(label, value);
    }
  }

  return (
    <Button type="button" variant="outline" size="icon-sm" onClick={copy} aria-label={label} title={label}>
      <Copy />
    </Button>
  );
}
