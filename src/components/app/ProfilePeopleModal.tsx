"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/app/AppShell";
import { Dialog } from "@/components/ui/Dialog";

export type ProfileListMember = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  headline: string | null;
  company: string | null;
  avatarUrl: string | null;
  score10: number | null;
  verifiedReviewCount: number | null;
};

/**
 * Profile relationship counter with a real modal list. Keeping the trigger
 * and dialog together makes the interaction predictable: the same counter
 * toggles its own list, while Dialog provides the shared close, backdrop and
 * Escape behaviour.
 */
export function ProfilePeopleModal({
  label,
  count,
  members,
  locale,
  openProfileLabel,
  emptyLabel,
  closeLabel,
}: {
  label: string;
  count: number;
  members: ProfileListMember[];
  locale: "de" | "en";
  openProfileLabel: string;
  emptyLabel: string;
  closeLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const title = `${count} ${label}`;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="min-w-[6rem] rounded-md text-left transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-electric-500"
      >
        <span className="block text-sm font-bold">{count}</span>
        <span className="text-xs text-foreground-muted">{label}</span>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={title} closeLabel={closeLabel}>
        {/* The dialog itself owns the scrolling (and keeps title + X pinned), so
            the list is never cut off by a second, smaller scroll area. */}
        <div>
          {members.length > 0 ? (
            <ul className="divide-y divide-border">
              {members.map((member) => {
                const memberScore =
                  member.verifiedReviewCount && member.score10 !== null
                    ? member.score10 / 10
                    : null;
                const roleAndCompany = [member.headline, member.company].filter(Boolean).join(" · ");

                return (
                  <li key={member.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                    <Link href={`/app/people/${member.handle}`} className="shrink-0" onClick={() => setOpen(false)}>
                      <Avatar
                        user={{
                          firstName: member.firstName,
                          lastName: member.lastName,
                          avatarUrl: member.avatarUrl,
                        }}
                        size={40}
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/app/people/${member.handle}`}
                        className="block truncate text-sm font-semibold hover:underline"
                        onClick={() => setOpen(false)}
                      >
                        {member.firstName} {member.lastName}
                      </Link>
                      <p className="truncate text-xs text-foreground-muted">@{member.handle}</p>
                      {roleAndCompany && (
                        <p className="truncate text-xs text-foreground-subtle">{roleAndCompany}</p>
                      )}
                      {memberScore !== null && (
                        <p className="mt-0.5 text-xs font-medium text-forest-700 dark:text-forest-300">
                          ★ {memberScore.toLocaleString(locale === "en" ? "en-GB" : "de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Trust
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/app/people/${member.handle}`}
                      className="shrink-0 text-xs font-semibold text-electric-600 hover:underline dark:text-electric-300"
                      onClick={() => setOpen(false)}
                    >
                      {openProfileLabel}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-1 py-4 text-sm text-foreground-muted">{emptyLabel}</p>
          )}
        </div>
      </Dialog>
    </>
  );
}
