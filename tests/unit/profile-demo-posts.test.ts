import { describe, expect, it } from "vitest";
import { DEMO_PROFILE_POSTS, showsProfileDemoPosts } from "@/lib/demo";

describe("profile sample posts (demo/real separation)", () => {
  it("never shows sample posts on a real member's own profile", () => {
    expect(showsProfileDemoPosts({ isDemo: false })).toBe(false);
  });

  it("still shows them on fictional demo accounts", () => {
    expect(DEMO_PROFILE_POSTS.length).toBeGreaterThan(0);
    expect(showsProfileDemoPosts({ isDemo: true })).toBe(true);
  });
});
