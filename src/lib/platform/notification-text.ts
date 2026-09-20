import type { Dictionary } from "@/lib/i18n/dictionaries";

/**
 * Resolves a notification's i18n key (e.g. "app.notifications.types.message")
 * against the active dictionary and interpolates its stored parameters.
 * Client-safe: no database access.
 */
export function resolveNotificationText(
  t: Dictionary,
  titleKey: string,
  paramsJson: string | null | undefined,
): string {
  const parts = titleKey.split(".");
  let node: unknown = t;
  for (const part of parts) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return titleKey;
    }
  }
  if (typeof node !== "string") return titleKey;

  let params: Record<string, string | number> = {};
  if (paramsJson) {
    try {
      const parsed = JSON.parse(paramsJson);
      if (parsed && typeof parsed === "object") params = parsed as Record<string, string | number>;
    } catch {
      params = {};
    }
  }
  return node.replace(/\{(\w+)\}/g, (match, key: string) =>
    params[key] === undefined ? match : String(params[key]),
  );
}
