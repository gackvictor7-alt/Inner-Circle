import { afterEach, describe, expect, it } from "vitest";

/**
 * The public site header uses a NON-httpOnly presence flag (set/cleared in
 * lockstep with the httpOnly session cookie) so the homepage can stay
 * statically pre-rendered. These tests pin the flag name and the cookie reader
 * behaviour (Error 1102 regression: `/` must never ask the server for auth).
 */
import { AUTH_PRESENCE_COOKIE, SESSION_COOKIE } from "@/lib/auth/cookie-name";
import { readPresenceCookie } from "@/lib/auth/presence";

const g = globalThis as { document?: { cookie: string } };

afterEach(() => {
  if (g.document) delete g.document;
});

function setDocumentCookie(cookie: string) {
  g.document = { cookie };
}

describe("public presence flag (header CTA, no identity)", () => {
  it("uses a fixed, non-httpOnly presence flag next to the session cookie", () => {
    expect(SESSION_COOKIE).toBe("ic_session");
    expect(AUTH_PRESENCE_COOKIE).toBe("ic_presence");
    expect(AUTH_PRESENCE_COOKIE).not.toBe(SESSION_COOKIE);
  });

  it("reports signed in when the presence flag is set", () => {
    setDocumentCookie("ic_presence=1; ic_locale=de");
    expect(readPresenceCookie()).toBe(true);
  });

  it("reports signed out when the flag is missing or empty", () => {
    setDocumentCookie("ic_locale=de; ic_theme=light");
    expect(readPresenceCookie()).toBe(false);

    setDocumentCookie("ic_presence=");
    expect(readPresenceCookie()).toBe(false);
  });

  it("is safe when document.cookie is unavailable", () => {
    delete g.document;
    expect(readPresenceCookie()).toBe(false);
  });
});
