/**
 * "Bakery, jumeirah ,VIP, bakery" -> ["Bakery", "jumeirah", "VIP"]
 * Trims, drops empties, removes duplicates (ignoring case), keeps first spelling.
 */
export function parseTags(input: string | null | undefined): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of (input ?? "").split(",")) {
    const tag = part.trim().replace(/\s+/g, " ");
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag.slice(0, 40));
    }
  }
  return tags;
}
