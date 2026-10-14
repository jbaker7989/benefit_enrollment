import { describe, expect, test } from "bun:test";

import { buildEnrollmentSummary, classifyEmployeePrompt, getStepPosition, type EnrollmentPlan } from "../../src";

const plans: EnrollmentPlan[] = [
  { id: "value", name: "Value PPO", description: "Lower premium", payrollDeductionCents: 8400 },
  { id: "choice", name: "Choice PPO", description: "Predictable costs", payrollDeductionCents: 12200 },
];

describe("Orbit enrollment pure behavior (small)", () => {
  test("STORY-038 exposes a text-based current step and total", () => {
    expect(getStepPosition("medical")).toEqual({ current: 2, total: 5, label: "Medical coverage" });
  });

  test("STORY-038 redirects unrelated prompts instead of treating them as general chat", () => {
    expect(classifyEmployeePrompt("What is the weather tomorrow?")).toBe("redirect");
    expect(classifyEmployeePrompt("Compare my medical plan cost")).toBe("in_scope");
  });

  test("STORY-039 and STORY-040 display application-supplied price without calculating it", () => {
    expect(buildEnrollmentSummary(plans, "choice", ["jordan"])).toEqual({
      plan: plans[1],
      coveredDependentIds: ["jordan"],
      payrollDeductionCents: 12200,
    });
  });

  test("STORY-040 leaves the deduction at zero when no plan is selected", () => {
    expect(buildEnrollmentSummary(plans, null, [])).toEqual({
      plan: null,
      coveredDependentIds: [],
      payrollDeductionCents: 0,
    });
  });
});
