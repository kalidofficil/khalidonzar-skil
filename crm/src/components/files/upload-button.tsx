"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadFiles, type UploadTarget } from "@/lib/upload";

/** Pick one or more files and attach them to a company (and optionally a deal). */
export function UploadButton(target: UploadTarget) {
  const t = useTranslations("files");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function upload(files: File[]) {
    if (!files.length) return;
    startTransition(async () => {
      const { failed, tooBig } = await uploadFiles(files, target);
      tooBig.forEach((name) => toast.error(t("tooBig", { name })));
      failed.forEach((name) => toast.error(t("failed", { name })));
      const done = files.length - failed.length - tooBig.length;
      if (done > 0) toast.success(t("uploaded", { count: done }));
      router.refresh();
    });
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={pending} onClick={() => inputRef.current?.click()}>
        {pending ? <LoaderCircle className="animate-spin" /> : <Upload />}
        {pending ? t("uploading") : t("upload")}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          upload(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </>
  );
}
