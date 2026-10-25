// Small helpers for reading filters out of the URL safely.

export type SearchParams = Record<string, string | string[] | undefined>;

export function param(params: SearchParams, key: string): string | undefined {
  const v = params[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** The value if it's one of `allowed`, otherwise undefined. */
export function oneOf<T extends string>(allowed: readonly T[], value: string | undefined): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

export function pageParam(params: SearchParams): number {
  return Math.max(1, Number.parseInt(param(params, "page") ?? "1", 10) || 1);
}
