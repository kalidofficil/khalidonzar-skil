/** "palmbakery.ae" -> "https://palmbakery.ae". Returns null if empty. */
export function normalizeWebsite(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

/** Display a website without the "https://www." noise. */
export function displayWebsite(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
}

/**
 * Accepts "@palmbakery", "palmbakery" or "https://instagram.com/palmbakery/"
 * and returns just the handle: "palmbakery".
 */
export function normalizeInstagram(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  const fromUrl = raw.match(/instagram\.com\/([^/?#]+)/i);
  const handle = (fromUrl ? fromUrl[1] : raw).replace(/^@/, "").trim();
  return handle || null;
}

export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle}`;
}

/**
 * Only allow redirects to pages inside this app ("/companies"), never to
 * another site ("//evil.com" or "https://evil.com").
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  return next;
}
