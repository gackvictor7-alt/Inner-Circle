import { describe, expect, it } from "vitest";
import Link from "next/link";
import { renderToStaticMarkup } from "react-dom/server";
import {
  parseProfileTab,
  profileTabHref,
  ProfileView,
  type ProfileIdentity,
  type ProfileTabKey,
} from "@/components/app/ProfileView";

function identity(overrides: Partial<ProfileIdentity> = {}): ProfileIdentity {
  return {
    firstName: "Alma",
    lastName: "Test",
    handle: "alma",
    avatarUrl: null,
    headline: "Founder · SaaS",
    jobTitle: "CEO",
    company: "Test GmbH",
    location: "Berlin",
    bio: "Building things.",
    roleAdmin: false,
    isDemo: false,
    memberSinceIso: null,
    completionPercent: null,
    ...overrides,
  };
}

const ALL_TABS: ProfileTabKey[] = ["activity", "overview", "performance", "offers", "interests"];

function render(props: Partial<Parameters<typeof ProfileView>[0]> = {}) {
  return renderToStaticMarkup(
    <ProfileView
      locale="de"
      isSelf
      baseUrl="/app/profile"
      tab="activity"
      tabs={ALL_TABS}
      identity={identity()}
      badges={[]}
      stats={{ followers: 12, following: 8, connections: 3 }}
      people={null}
      actions={<Link href="/app/profile/edit">edit-action-slot</Link>}
      trust={null}
      trustAside={null}
      contactLinks={null}
      {...props}
    />,
  );
}

describe("one profile layout for own and foreign profiles", () => {
  it("renders the same header structure for own and foreign profiles", () => {
    const own = render();
    const foreign = render({
      isSelf: false,
      baseUrl: "/app/people/alma",
      identity: identity({ memberSinceIso: "2026-01-01T00:00:00.000Z" }),
    });

    for (const html of [own, foreign]) {
      // Identity block: avatar column, name, @handle, bio.
      expect(html).toContain("Alma Test");
      expect(html).toContain("@alma");
      expect(html).toContain("Building things.");
      // Relationship counters with the same labels.
      expect(html).toContain("Follower");
      expect(html).toContain("Folgt");
      expect(html).toContain("Business Connections");
      expect(html).toContain(">12<");
      expect(html).toContain(">8<");
      expect(html).toContain(">3<");
      // The verified-badge area stays visible, with the same mobile ordering
      // (trust directly after the identity block, badges before the tabs).
      expect(html).toContain("Verifizierte Badges");
      expect(html).toContain("order-3 min-w-0 p-4 sm:p-6 xl:order-2");
      // One shared surface + xl three-column header.
      expect(html).toContain("xl:grid-cols-3");
    }

    // Tab links only differ by the base route, never by structure.
    for (const tab of ["overview", "performance", "offers", "interests"] as const) {
      expect(own).toContain(`href="/app/profile?tab=${tab}"`);
      expect(foreign).toContain(`href="/app/people/alma?tab=${tab}"`);
    }
    expect(own).toContain('href="/app/profile"');
    expect(foreign).toContain('href="/app/people/alma"');
  });

  it("shows all five tabs in the founder order (Beiträge first, Interessen last)", () => {
    const html = render();
    const labels = ["Beiträge", "Übersicht", "Performance", "Angebote", "Interessen"];
    const positions = labels.map((label) => html.indexOf(`>${label}<`));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it("keeps the badge area visible without badges – empty state with explanation", () => {
    const own = render({ isSelf: true });
    expect(own).toContain("Noch keine Badges");
    // Owner variant explains how badges are earned and links to the badge pages.
    expect(own).toContain('href="/app/profile/badges/available"');
    expect(own).toContain("Mehr über Badges");

    const foreign = render({ isSelf: false, baseUrl: "/app/people/alma" });
    expect(foreign).toContain("Noch keine Badges");
    // Foreign profiles never expose owner-only application actions.
    expect(foreign).not.toContain('href="/app/profile/badges/available"');
    expect(foreign).not.toContain("Badge beantragen");
  });

  it("hides the tab bar and badge section on reduced foreign profiles", () => {
    const limited = render({
      isSelf: false,
      baseUrl: "/app/people/alma",
      tabs: [],
      stats: null,
      showBadgesSection: false,
      identity: identity({ bio: null }),
    });
    expect(limited).not.toContain("<nav");
    expect(limited).not.toContain("Verifizierte Badges");
    expect(limited).not.toContain("Business Connections");
    // The reduced profile never renders the bio.
    expect(limited).not.toContain("Building things.");
  });

  it("renders the action slot (own buttons vs. foreign social actions)", () => {
    expect(render()).toContain("edit-action-slot");
    const foreign = render({
      isSelf: false,
      baseUrl: "/app/people/alma",
      actions: <button type="button">follow-action-slot</button>,
    });
    expect(foreign).toContain("follow-action-slot");
    expect(foreign).not.toContain("edit-action-slot");
  });
});

describe("profile tab routing helpers", () => {
  it("falls back to the first allowed tab for unknown or forbidden values", () => {
    expect(parseProfileTab("offers", ALL_TABS)).toBe("offers");
    expect(parseProfileTab("secret", ALL_TABS)).toBe("activity");
    expect(parseProfileTab(undefined, ALL_TABS)).toBe("activity");
    expect(parseProfileTab("performance", ["overview", "offers"])).toBe("overview");
  });

  it("keeps the default tab as the clean URL", () => {
    expect(profileTabHref("/app/profile", "activity")).toBe("/app/profile");
    expect(profileTabHref("/app/profile", "interests")).toBe("/app/profile?tab=interests");
  });
});
