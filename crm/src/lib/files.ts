// File helpers that are safe to use anywhere (no database access).

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** "Proposal (final) v2.pdf" -> "Proposal-final-v2.pdf": safe for a storage path. */
export function safeFileName(fullName: string): string {
  const name = fullName.split(/[\\/]/).pop() ?? ""; // drop any folder part
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).normalize("NFKD").replace(/[^\w.-]+/g, "-");
  const ext = dot > 0 ? name.slice(dot + 1).replace(/[^\w]/g, "") : "";
  const trimmed = base.replace(/\.+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "file";
  return ext ? `${trimmed}.${ext.toLowerCase()}` : trimmed;
}

/** 2_400_000 -> "2.3 MB" */
export function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
