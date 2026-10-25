import { getFormatter, getTranslations } from "next-intl/server";
import { FileImage, FileText, File as FileIcon } from "lucide-react";
import { DeleteButton } from "@/components/delete-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { deleteAttachment } from "@/lib/actions/attachments";
import { hasRole, type CurrentUser } from "@/lib/auth";
import type { AttachmentItem } from "@/lib/data/attachments";
import { formatBytes } from "@/lib/files";
import { UploadButton } from "./upload-button";

function iconFor(mime: string | null) {
  if (mime?.startsWith("image/")) return FileImage;
  if (mime === "application/pdf" || mime?.startsWith("text/")) return FileText;
  return FileIcon;
}

/** Files attached to a company or deal, with upload and delete. */
export async function FilesCard({
  files,
  user,
  companyId,
  dealId,
}: {
  files: AttachmentItem[];
  user: CurrentUser;
  companyId: string;
  dealId?: string;
}) {
  const t = await getTranslations("files");
  const format = await getFormatter();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <UploadButton companyId={companyId} dealId={dealId} />
      </CardHeader>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <ul className="divide-y">
            {files.map((file) => {
              const Icon = iconFor(file.mime_type);
              return (
                <li key={file.id} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0">
                  <Icon className="size-5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/files/${file.id}`}
                      target="_blank"
                      rel="noopener"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {file.file_name}
                    </a>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(file.size_bytes)} · {format.dateTime(new Date(file.created_at), { day: "numeric", month: "short" })}
                    </p>
                  </div>
                  {(hasRole(user, "owner") || file.created_by === user.id) && (
                    <DeleteButton
                      size="icon-sm"
                      action={deleteAttachment.bind(null, file.id)}
                      title={t("deleteTitle", { name: file.file_name })}
                      description={t("deleteBody")}
                      successText={t("deleted")}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
