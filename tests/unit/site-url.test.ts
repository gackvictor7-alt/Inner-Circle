import { afterEach, describe, expect, it, vi } from "vitest";
import { getAppUrl, getPublicUrl } from "@/lib/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("public site URL resolution", () => {
  it("uses NEXT_PUBLIC_SITE_URL as the canonical base and normalizes its trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example.test/path/");
    vi.stubEnv("APP_URL", "https://legacy.example.test");

    expect(getAppUrl()).toBe("https://site.example.test");
    expect(getPublicUrl("/reset-password?token=Abc-DEF_123")).toBe(
      "https://site.example.test/reset-password?token=Abc-DEF_123",
    );
  });

  it("uses APP_URL only when NEXT_PUBLIC_SITE_URL is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("APP_URL", "https://legacy.example.test/");

    expect(getAppUrl()).toBe("https://legacy.example.test");
    expect(getPublicUrl("/register")).toBe("https://legacy.example.test/register");
  });

  it("rejects paths that could replace the configured host", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://site.example.test");

    expect(() => getPublicUrl("//outside.example.test/path")).toThrow(
      "Public URLs must use a root-relative application path",
    );
    expect(() => getPublicUrl("https://outside.example.test/path")).toThrow(
      "Public URLs must use a root-relative application path",
    );
  });
});
