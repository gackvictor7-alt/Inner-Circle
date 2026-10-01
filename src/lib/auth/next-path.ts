/**
 * Post-login return path. `requireUser()` sends signed-out visitors to
 * `/login?next=<path>`; the login action uses this helper so the deep link
 * (e.g. a notification pointing at `/app/inbox?c=…`) survives the login.
 *
 * Only same-site paths inside the signed-in areas are accepted, so the
 * parameter can never become an open redirect.
 */
const ALLOWED_PREFIXES = ["/app", "/admin"] as const;

export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.length === 0 || value.length > 300) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // Backslashes and control characters are treated as hostile by browsers.
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return null;
  // Dot segments and encoded separators would be normalised by the browser
  // (`/app/../login`), so they never count as a signed-in-area path.
  const path = value.split(/[?#]/, 1)[0];
  if (path.split("/").some((segment) => segment === "." || segment === "..")) return null;
  if (/%(2e|2f|5c)/i.test(value)) return null;
  const matches = ALLOWED_PREFIXES.some((prefix) => {
    if (!value.startsWith(prefix)) return false;
    const next = value.charAt(prefix.length);
    return next === "" || next === "/" || next === "?" || next === "#";
  });
  return matches ? value : null;
}
