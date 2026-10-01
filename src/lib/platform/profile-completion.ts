/**
 * Profile completion – ONE definition shared by the profile page and the
 * profile edit form, so both always show the same percentage. The steps are
 * exactly the fields the unified edit form asks for.
 */
export type ProfileCompletionInput = {
  hasAvatar: boolean;
  hasName: boolean;
  hasRole: boolean;
  hasCompany: boolean;
  hasLocation: boolean;
  interestCount: number;
  goalCount: number;
  lookingForCount: number;
  offeringCount: number;
  hasBio: boolean;
};

export function profileCompletionSteps(input: ProfileCompletionInput): { key: string; done: boolean }[] {
  return [
    { key: "app.beta.stepPhoto", done: input.hasAvatar },
    { key: "app.beta.stepName", done: input.hasName },
    { key: "app.beta.stepRole", done: input.hasRole },
    { key: "app.beta.stepCompany", done: input.hasCompany },
    { key: "app.beta.stepLocation", done: input.hasLocation },
    { key: "app.beta.stepInterests", done: input.interestCount > 0 },
    { key: "app.beta.stepGoals", done: input.goalCount > 0 },
    { key: "app.beta.stepLookingFor", done: input.lookingForCount > 0 },
    { key: "app.beta.stepOffering", done: input.offeringCount > 0 },
    { key: "app.beta.stepBio", done: input.hasBio },
  ];
}

export function profileCompletionPercent(input: ProfileCompletionInput): number {
  const steps = profileCompletionSteps(input);
  return Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
}
