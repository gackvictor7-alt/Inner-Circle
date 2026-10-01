import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/next-path";

describe("safeNextPath", () => {
  it("keeps same-site paths inside the signed-in areas", () => {
    expect(safeNextPath("/app")).toBe("/app");
    expect(safeNextPath("/app/events")).toBe("/app/events");
    expect(safeNextPath("/app/inbox?c=abc")).toBe("/app/inbox?c=abc");
    expect(safeNextPath("/admin/users")).toBe("/admin/users");
  });

  it("rejects everything that could become an open redirect", () => {
    expect(safeNextPath("https://evil.example/app")).toBeNull();
    expect(safeNextPath("//evil.example/app")).toBeNull();
    expect(safeNextPath("/\\evil.example")).toBeNull();
    expect(safeNextPath("/app\n/x")).toBeNull();
    expect(safeNextPath("javascript:alert(1)")).toBeNull();
  });

  it("rejects dot segments and encoded separators that the browser would normalise", () => {
    expect(safeNextPath("/app/../login")).toBeNull();
    expect(safeNextPath("/app/./events")).toBeNull();
    expect(safeNextPath("/app/%2e%2e/login")).toBeNull();
    expect(safeNextPath("/app%2f..%2flogin")).toBeNull();
    expect(safeNextPath("/app/events?next=../x")).toBe("/app/events?next=../x");
  });

  it("rejects paths outside /app and /admin and look-alike prefixes", () => {
    expect(safeNextPath("/login")).toBeNull();
    expect(safeNextPath("/verify")).toBeNull();
    expect(safeNextPath("/application")).toBeNull();
    expect(safeNextPath("/administrator")).toBeNull();
  });

  it("handles empty and oversized input", () => {
    expect(safeNextPath("")).toBeNull();
    expect(safeNextPath(null)).toBeNull();
    expect(safeNextPath(undefined)).toBeNull();
    expect(safeNextPath(`/app/${"a".repeat(400)}`)).toBeNull();
  });
});
