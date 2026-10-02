import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import type { Database } from "@/db/client";
import { applyMigrationsThrough } from "../d1-helpers";

const d1Ref = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock("@/db/client", () => ({
  get db() {
    if (!d1Ref.db) throw new Error("test D1 database not initialised yet");
    return d1Ref.db;
  },
}));

let mf: Miniflare;
let listDiscoverCandidates: typeof import("@/lib/platform/queries").listDiscoverCandidates;
let listDirectoryMembers: typeof import("@/lib/platform/queries").listDirectoryMembers;

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "discover-pre-0007-test" },
    }),
  );
  const d1 = await mf.getD1Database("DB");
  // A pre-0007 schema: 0007 is the first migration that adds
  // User.foundingMemberNumber. A version upload does not apply D1 migrations.
  await applyMigrationsThrough(d1, "0006_message_read_state");

  const now = Date.now();
  await d1.exec(
    [
      `INSERT INTO User (id, firstName, lastName, handle, emailVerifiedAt, createdAt, updatedAt) VALUES ('viewer', 'View', 'Er', 'viewer', ${now}, ${now}, ${now}), ('candidate', 'Can', 'Didate', 'candidate', ${now}, ${now}, ${now})`,
      `INSERT INTO Profile (id, userId, onboardingCompletedAt, createdAt, updatedAt) VALUES ('profile-candidate', 'candidate', ${now}, ${now}, ${now})`,
      `INSERT INTO BetaAccess (id, userId, startsAt, endsAt, createdAt, updatedAt) VALUES ('beta-candidate', 'candidate', ${now - 1_000}, ${now + 86_400_000}, ${now}, ${now})`,
    ].join(";"),
  );

  d1Ref.db = drizzleD1(d1, { schema }) as unknown as Database;
  ({ listDiscoverCandidates, listDirectoryMembers } = await import("@/lib/platform/queries"));
}, 120_000);

afterAll(async () => {
  await mf?.dispose();
});

describe("queries against the pre-0007 D1 schema", () => {
  it("lists candidates when User.foundingMemberNumber has not been added yet", async () => {
    const candidates = await listDiscoverCandidates({ viewerId: "viewer", limit: 10 });

    expect(candidates.map((candidate) => candidate.id)).toContain("candidate");
    expect(candidates.find((candidate) => candidate.id === "candidate")?.foundingMemberNumber).toBeNull();
  });

  it("lists network members when User.foundingMemberNumber has not been added yet", async () => {
    const members = await listDirectoryMembers({ viewerId: "viewer", limit: 10 });

    expect(members.map((member) => member.id)).toContain("candidate");
    expect(members.find((member) => member.id === "candidate")?.foundingMember).toBe(false);
  });
});
