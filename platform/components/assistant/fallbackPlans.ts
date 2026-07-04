import type { HelpPlan, HelpStep, HomeworkCard, Profile } from "@/lib/types";

/**
 * Canned help plan used whenever /api/assist/vision fails — the student must
 * never be left hanging. Steps are tailored per card type but deliberately
 * generic (they teach a checking strategy, not the answer).
 */
export function buildFallbackPlan(
  card: HomeworkCard,
  profile: Profile,
): HelpPlan {
  const blind = profile === "blind";

  const step = (
    say: string,
    pointer?: HelpStep["pointer"],
    gate?: HelpStep["gate"],
  ): HelpStep => ({
    say,
    ...(blind ? {} : pointer ? { pointer } : {}),
    gate: blind ? { type: "got-it" } : (gate ?? { type: "got-it" }),
  });

  let steps: HelpStep[];
  switch (card.type) {
    case "mcq":
      steps = [
        step("Read the question once more, slowly.", {
          kind: "underline",
          targetSpot: "question",
        }),
        step(
          "Check each option against the question — which ones don't fit?",
          { kind: "circle", targetSpot: "question" },
          { type: "hover-target" },
        ),
        step("Trust your reasoning — pick the one that survives!"),
      ];
      break;
    case "short":
      steps = [
        step("Read the question once more, slowly.", {
          kind: "underline",
          targetSpot: "question",
        }),
        step(
          "Say your answer out loud first, then write it in your own words.",
          { kind: "circle", targetSpot: "question" },
          { type: "hover-target" },
        ),
        step("Short and clear beats long and fuzzy — you've got this!"),
      ];
      break;
    case "steps":
      steps = [
        step("Read the question once more, slowly.", {
          kind: "underline",
          targetSpot: "question",
        }),
        step(
          "What has to happen FIRST? Start there and go one step at a time.",
          { kind: "circle", targetSpot: "question" },
          { type: "hover-target" },
        ),
        step("One step at a time — the order matters more than speed!"),
      ];
      break;
    default:
      steps = [
        step("Read this part once more, slowly.", {
          kind: "underline",
          targetSpot: "question",
        }),
        step("Now say the big idea back in your own words."),
        step("That's the skill — explaining it makes it stick!"),
      ];
  }

  return { steps, mood: "encouraging" };
}
