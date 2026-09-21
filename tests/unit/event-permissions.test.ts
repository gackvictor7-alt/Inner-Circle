import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { entitlementsFor, type AccessLevel } from "@/lib/access/levels";

const ROOT = resolve(__dirname, "..", "..");
const LEVELS: AccessLevel[] = ["visitor", "free", "trial", "member", "admin"];

function actionSources(): { file: string; code: string }[] {
  const dir = resolve(ROOT, "src/app/actions");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".ts"))
    .map((file) => ({ file, code: readFileSync(resolve(dir, file), "utf8") }));
}

/**
 * Events are curated and released exclusively by INNER CIRCLE (spec §14).
 * Members may view, apply for and attend events – never publish them.
 * These assertions fail as soon as an event-creation path is introduced.
 */
describe("members cannot create events", () => {
  it("grants no event-creation entitlement on any access level", () => {
    for (const level of LEVELS) {
      const entitlements = entitlementsFor(level);
      const forbidden = Object.keys(entitlements).filter((key) =>
        /event(s)?(create|manage|publish|organize)/i.test(key),
      );
      expect(forbidden, `${level} must not gain event authoring rights`).toEqual([]);
      // What members do get is strictly read + apply.
      expect(Object.keys(entitlements).filter((key) => key.startsWith("events"))).toEqual([
        "eventsBrowse",
        "eventsApply",
      ]);
    }
  });

  it("exposes no server action that writes an Event row", () => {
    for (const { file, code } of actionSources()) {
      expect(code, `${file} must not insert into the events table`).not.toMatch(/insert\(\s*events\s*\)/);
      expect(code, `${file} must not update the events table`).not.toMatch(/update\(\s*events\s*\)/);
      expect(code, `${file} must not delete from the events table`).not.toMatch(/delete\(\s*events\s*\)/);
    }
  });

  it("keeps event creation out of the member create menu", () => {
    const shell = readFileSync(resolve(ROOT, "src/components/app/AppShell.tsx"), "utf8");
    const createBlock = shell.slice(shell.indexOf("const createOptions"), shell.indexOf("const bottomItems"));

    expect(createBlock).not.toContain("/app/events");
    expect(createBlock).not.toMatch(/createEvent/);
    // The sheet explains the rule instead of offering a dead entry.
    expect(createBlock).toContain("eventLockedTitle");
    expect(createBlock).toContain("eventLockedDesc");
  });

  it("documents the rule on the events area itself", () => {
    const page = readFileSync(resolve(ROOT, "src/app/(app)/app/events/page.tsx"), "utf8");
    expect(page).toContain("app.events.curatedNotice");
  });
});
