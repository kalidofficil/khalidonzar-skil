"use client";

import { createClient } from "@/lib/supabase/client";
import { recordAttachment } from "@/lib/actions/attachments";
import { MAX_FILE_BYTES, safeFileName } from "@/lib/files";

export type UploadTarget = { companyId: string; dealId?: string | null; activityId?: string | null };

/**
 * Uploads files straight from the browser to Supabase Storage (so big files
 * don't pass through our server), then records each one in the database.
 * Returns the names of files that failed.
 */
export async function uploadFiles(files: File[], target: UploadTarget): Promise<{ failed: string[]; tooBig: string[] }> {
  const supabase = createClient();
  const failed: string[] = [];
  const tooBig: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      tooBig.push(file.name);
      continue;
    }
    const path = `${target.companyId}/${crypto.randomUUID()}/${safeFileName(file.name)}`;
    const { error } = await supabase.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) {
      failed.push(file.name);
      continue;
    }
    const result = await recordAttachment({
      company_id: target.companyId,
      deal_id: target.dealId ?? null,
      activity_id: target.activityId ?? null,
      storage_path: path,
      file_name: file.name,
      mime_type: file.type || null,
      size_bytes: file.size,
    });
    if (!result.ok) failed.push(file.name);
  }
  return { failed, tooBig };
}
