import { describe, expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { OrbitEnrollment, OrbitGuide, StatusBadge } from "../../src";

describe("Orbit enrollment composition (integrated)", () => {
  test("STORY-037 through STORY-041 render accessible guide, progress, actions, and summary from supplied fixtures", () => {
    const markup = renderToStaticMarkup(
      <OrbitEnrollment
        employeeName="Avery Morgan"
        plans={[{ id: "choice", name: "Choice PPO", description: "Predictable costs", payrollDeductionCents: 12200 }]}
        dependents={[{ id: "jordan", name: "Jordan Morgan" }]}
      />,
    );

    expect(markup).toContain('aria-label="Enrollment steps"');
    expect(markup).toContain("Step 1 of 5");
    expect(markup).toContain("Benefit-only guide");
    expect(markup).toContain("Estimated payroll deduction");
    expect(markup).toContain("Change");
    expect(markup).toContain("Continue to medical coverage");
  });

  test("STORY-037 communicates guide and success state with accessible text", () => {
    const guide = renderToStaticMarkup(<OrbitGuide status="success" statusText="Enrollment ready" />);
    const badge = renderToStaticMarkup(<StatusBadge kind="success" label="Draft saved" />);

    expect(guide).toContain('aria-label="Guide status: Enrollment ready"');
    expect(guide).toContain("Enrollment ready");
    expect(badge).toContain("Draft saved");
    expect(badge).toContain("✓");
  });
});
