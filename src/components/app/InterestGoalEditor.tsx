"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";
import { updateInterestsAction } from "@/app/actions/profile";
import { initialActionState } from "@/app/actions/state";
import { CheckIcon } from "@/components/ui/icons";

export type TaxonomyInterest = {
  id: string;
  slug: string;
  labelDe: string;
  labelEn: string;
  groupDe: string;
  groupEn: string;
};

export type TaxonomyGoal = { id: string; slug: string; labelDe: string; labelEn: string };

const GROUP_ORDER = ["business", "finance", "growth", "technology", "professional", "creative", "lifestyle", "other"];

/**
 * Interests & goals after onboarding (spec §23).
 *
 * Reuses the exact onboarding taxonomy (`Interest` / `Goal` tables) and the
 * same interaction pattern – there is deliberately no second interest system.
 */
export function InterestGoalEditor({
  interests,
  goals,
  selectedInterests,
  selectedGoals,
}: {
  interests: TaxonomyInterest[];
  goals: TaxonomyGoal[];
  selectedInterests: string[];
  selectedGoals: string[];
}) {
  const { t, locale, tf } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(updateInterestsAction, initialActionState);
  const [pickedInterests, setPickedInterests] = useState<string[]>(selectedInterests);
  const [pickedGoals, setPickedGoals] = useState<string[]>(selectedGoals);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state.status, router]);

  const toggle = (list: string[], setList: (value: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);

  const grouped = interests.reduce<Record<string, TaxonomyInterest[]>>((acc, interest) => {
    const group = locale === "de" ? interest.groupDe : interest.groupEn;
    acc[group] = acc[group] ? [...acc[group], interest] : [interest];
    return acc;
  }, {});

  const sortedGroups = Object.entries(grouped).sort(([a], [b]) => {
    const posA = GROUP_ORDER.indexOf(a.toLowerCase());
    const posB = GROUP_ORDER.indexOf(b.toLowerCase());
    return (posA >= 0 ? posA : 999) - (posB >= 0 ? posB : 999);
  });

  const ready = pickedInterests.length >= 3;

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight">{t.app.profile.interestsSection}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
            {t.app.profile.interestsLead}
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
            ready ? "border-forest-500/30 text-forest-600 dark:text-forest-300" : "border-border text-foreground-muted"
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${ready ? "bg-forest-500" : "bg-warning-500"}`} />
          {tf(t.app.profile.interestsSelected, { count: pickedInterests.length })}
        </span>
      </div>

      <form action={action} className="mt-6 space-y-6">
        {state.status === "error" && (
          <p className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
            {t.app.errors[(state.errorCode ?? "generic") as keyof typeof t.app.errors] ?? t.app.errors.generic}
          </p>
        )}

        <div className="space-y-5">
          {sortedGroups.map(([group, items]) => (
            <section key={group} className="rounded-2xl border border-border bg-surface-muted/40 p-4">
              <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-foreground-subtle">{group}</h3>
              <div className="flex flex-wrap gap-2">
                {items.map((interest) => {
                  const active = pickedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      name="interests"
                      value={interest.id}
                      aria-pressed={active}
                      onClick={() => toggle(pickedInterests, setPickedInterests, interest.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                        active
                          ? "border border-electric-500 bg-electric-500/10 text-electric-600 dark:text-electric-300"
                          : "border border-border bg-surface text-foreground hover:border-electric-500/40 hover:bg-surface-muted"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          active ? "bg-electric-500 text-white" : "border border-border-strong text-transparent"
                        }`}
                      >
                        <CheckIcon size={11} />
                      </span>
                      <span>{locale === "de" ? interest.labelDe : interest.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Buttons only submit their value while active – mirrors the onboarding form. */}
        <div className="hidden" aria-hidden="true">
          {pickedInterests.map((id) => (
            <input key={id} type="hidden" name="interests" value={id} readOnly />
          ))}
          {pickedGoals.map((id) => (
            <input key={id} type="hidden" name="goals" value={id} readOnly />
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <h3 className="text-base font-bold tracking-tight">{t.app.profile.goalsTitle}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {goals.map((goal) => {
              const active = pickedGoals.includes(goal.id);
              return (
                <button
                  key={goal.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggle(pickedGoals, setPickedGoals, goal.id)}
                  className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
                    active
                      ? "border-forest-500 bg-forest-500/10 text-forest-700 dark:text-forest-200"
                      : "border-border bg-surface text-foreground hover:border-forest-500/40 hover:bg-surface-muted"
                  }`}
                >
                  <span
                    className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                      active ? "bg-forest-500 text-white" : "border border-border-strong text-transparent"
                    }`}
                  >
                    <CheckIcon size={11} />
                  </span>
                  {locale === "de" ? goal.labelDe : goal.labelEn}
                </button>
              );
            })}
          </div>
        </section>

        {!ready && <p className="text-xs text-foreground-subtle">{t.app.profile.interestsMinNotice}</p>}

        <div className="flex justify-end">
          <Button type="submit" loading={pending} disabled={!ready}>
            {t.app.common.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
