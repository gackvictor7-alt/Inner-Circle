import { afterEach, describe, expect, it } from "vitest";
import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { badgeApplications, membershipCards, privacySettings, trustScoreSummaries, userBadges, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { createTestUser, deleteTestUser } from "../helpers";
import { activateMembership } from "@/lib/membership/service";
import { ensureBadgeCatalog } from "@/lib/badges/catalog";
import { listDirectoryMembers, listDiscoverCandidates, memberProfileByHandle } from "@/lib/platform/queries";
import { reputationBadgesFor } from "@/lib/badges/queries";
import { findCardByPublicId } from "@/db/queries";

const created: string[] = [];
afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

async function networkMember(name: string) {
  const id = await createTestUser({ firstName: name, lastName: "Privacy" });
  created.push(id);
  await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
  return id;
}

describe("Discover badge and Trust privacy", () => {
  it("filters private reputation badges and Trust figures before Discover data reaches the client", async () => {
    const catalog = await ensureBadgeCatalog();
    const viewerId = await networkMember("Viewer");
    const privateOwnerId = await networkMember("Private");
    const sharedOwnerId = await networkMember("Shared");
    const now = new Date();

    await db.update(privacySettings).set({ performanceVisibility: "private" }).where(eq(privacySettings.userId, privateOwnerId));
    await db.update(privacySettings).set({ metricsVisibilityJson: JSON.stringify({ badgeNumbers: "members" }) }).where(eq(privacySettings.userId, sharedOwnerId));
    await db.insert(trustScoreSummaries).values([
      { userId: privateOwnerId, score10: 50, reviewCount: 2, verifiedReviewCount: 2, updatedAt: now },
      { userId: sharedOwnerId, score10: 46, reviewCount: 3, verifiedReviewCount: 3, updatedAt: now },
    ]);

    const verifiedBadgeId = catalog.get("verified-founder");
    const reputationBadgeId = catalog.get("deal-maker");
    expect(verifiedBadgeId).toBeTruthy();
    expect(reputationBadgeId).toBeTruthy();
    await db.insert(userBadges).values([
      {
        id: idFor.userBadge(),
        userId: privateOwnerId,
        badgeId: verifiedBadgeId!,
        source: "application",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
      },
      {
        id: idFor.userBadge(),
        userId: privateOwnerId,
        badgeId: reputationBadgeId!,
        source: "admin",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
        publicSummary: "3 confirmed deals",
      },
      {
        id: idFor.userBadge(),
        userId: sharedOwnerId,
        badgeId: reputationBadgeId!,
        source: "admin",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
        publicSummary: "4 confirmed deals",
      },
    ]);

    const candidates = await listDiscoverCandidates({ viewerId, limit: 20, locale: "en" });
    const privateCandidate = candidates.find((candidate) => candidate.id === privateOwnerId);
    const sharedCandidate = candidates.find((candidate) => candidate.id === sharedOwnerId);
    expect(privateCandidate).toBeTruthy();
    expect(privateCandidate?.trustScore10).toBeNull();
    expect(privateCandidate?.verifiedReviewCount).toBeNull();
    expect(privateCandidate?.badges.map((badge) => badge.slug)).toEqual(["verified-founder"]);
    expect(privateCandidate?.badges[0]?.publicSummary).toBeNull();

    expect(sharedCandidate?.trustScore10).toBe(46);
    expect(sharedCandidate?.verifiedReviewCount).toBe(3);
    expect(sharedCandidate?.badges.find((badge) => badge.slug === "deal-maker")?.publicSummary).toBe("4 confirmed deals");
  });

  it("requires verified, non-revoked grants across profile, Discover, and public-card paths", async () => {
    const catalog = await ensureBadgeCatalog();
    const viewerId = await networkMember("Verifier");
    const unverifiedId = await networkMember("Unverified");
    const verifiedId = await networkMember("Verified");
    const revokedId = await networkMember("Revoked");
    const suspendedId = await networkMember("Suspended");
    const rejectedId = await networkMember("Rejected");
    const now = new Date();
    const verifiedBadgeId = catalog.get("verified-founder");
    const foundingBadgeId = catalog.get("founding-member");
    expect(verifiedBadgeId).toBeTruthy();
    expect(foundingBadgeId).toBeTruthy();

    const assignedNumbers = new Set(
      (await db.select({ value: users.foundingMemberNumber }).from(users).where(isNotNull(users.foundingMemberNumber)))
        .map((row) => row.value),
    );
    const foundingMemberNumber = Array.from({ length: 50 }, (_, index) => index + 1)
      .find((number) => !assignedNumbers.has(number));
    expect(foundingMemberNumber).toBeDefined();
    await db.update(users)
      .set({ foundingMember: true, foundingMemberNumber: foundingMemberNumber! })
      .where(eq(users.id, unverifiedId));
    const [unverifiedUser] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, unverifiedId)).limit(1);
    expect(unverifiedUser).toBeTruthy();

    const unverifiedGrantId = idFor.userBadge();
    const unverifiedFoundingGrantId = idFor.userBadge();
    await db.insert(userBadges).values([
      {
        id: unverifiedGrantId,
        userId: unverifiedId,
        badgeId: verifiedBadgeId!,
        source: "application",
        grantedById: viewerId,
        grantedAt: now,
      },
      {
        id: unverifiedFoundingGrantId,
        userId: unverifiedId,
        badgeId: foundingBadgeId!,
        source: "admin",
        grantedById: viewerId,
        grantedAt: now,
      },
      {
        id: idFor.userBadge(),
        userId: verifiedId,
        badgeId: verifiedBadgeId!,
        source: "application",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
      },
      {
        id: idFor.userBadge(),
        userId: revokedId,
        badgeId: verifiedBadgeId!,
        source: "application",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
        revokedAt: now,
        revokedById: viewerId,
      },
      {
        id: idFor.userBadge(),
        userId: suspendedId,
        badgeId: verifiedBadgeId!,
        source: "application",
        grantedById: viewerId,
        grantedAt: now,
        verifiedAt: now,
      },
    ]);
    await db.update(users).set({ status: "suspended" }).where(eq(users.id, suspendedId));
    await db.insert(badgeApplications).values({
      id: idFor.badgeApplication(),
      userId: rejectedId,
      badgeId: verifiedBadgeId!,
      explanation: "The submitted claim was reviewed and rejected.",
      identityConfirmedAt: now,
      evidenceUrlsJson: "[\"https://registry.example.test/rejected\"]",
      status: "rejected",
      reviewedById: viewerId,
      reviewedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    const verifiedProfileBadges = await reputationBadgesFor(verifiedId, "en");
    expect(verifiedProfileBadges.map((badge) => badge.slug)).toContain("verified-founder");
    expect(await reputationBadgesFor(unverifiedId, "en")).toEqual([]);
    expect(await reputationBadgesFor(revokedId, "en")).toEqual([]);
    expect(await reputationBadgesFor(suspendedId, "en")).toEqual([]);
    expect(await reputationBadgesFor(rejectedId, "en")).toEqual([]);

    const candidates = await listDiscoverCandidates({ viewerId, limit: 20, locale: "en" });
    expect(candidates.find((candidate) => candidate.id === verifiedId)?.badges.map((badge) => badge.slug))
      .toContain("verified-founder");
    for (const userId of [unverifiedId, revokedId, rejectedId]) {
      expect(candidates.find((candidate) => candidate.id === userId)?.badges.map((badge) => badge.slug))
        .not.toContain("verified-founder");
    }
    expect(candidates.some((candidate) => candidate.id === suspendedId)).toBe(false);
    expect((await memberProfileByHandle(unverifiedUser!.handle))?.foundingMember).toBe(false);
    const directoryBeforeVerification = await listDirectoryMembers({ viewerId, limit: 20 });
    expect(directoryBeforeVerification.find((member) => member.id === unverifiedId)?.foundingMember).toBe(false);

    const [memberCard] = await db
      .select({ publicId: membershipCards.publicId })
      .from(membershipCards)
      .where(eq(membershipCards.userId, unverifiedId))
      .limit(1);
    expect(memberCard).toBeTruthy();
    expect((await findCardByPublicId(memberCard!.publicId))?.foundingMember).toBe(false);

    await db.update(userBadges).set({ verifiedAt: now }).where(eq(userBadges.id, unverifiedFoundingGrantId));
    expect((await reputationBadgesFor(unverifiedId, "en")).map((badge) => badge.slug)).toContain("founding-member");
    expect((await memberProfileByHandle(unverifiedUser!.handle))?.foundingMember).toBe(true);
    expect((await listDirectoryMembers({ viewerId, limit: 20 })).find((member) => member.id === unverifiedId)?.foundingMember)
      .toBe(true);
    expect((await findCardByPublicId(memberCard!.publicId))?.foundingMember).toBe(true);

    await db.update(userBadges).set({ revokedAt: now, revokedById: viewerId })
      .where(eq(userBadges.id, unverifiedFoundingGrantId));
    expect((await reputationBadgesFor(unverifiedId, "en")).map((badge) => badge.slug)).not.toContain("founding-member");
    expect((await memberProfileByHandle(unverifiedUser!.handle))?.foundingMember).toBe(false);
    expect((await listDirectoryMembers({ viewerId, limit: 20 })).find((member) => member.id === unverifiedId)?.foundingMember)
      .toBe(false);
    expect((await findCardByPublicId(memberCard!.publicId))?.foundingMember).toBe(false);
  });
});
