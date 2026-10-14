"use client";

import { useMemo, useState } from "react";

import { Button } from "../button";
import { Card } from "./card";
import { OrbitGuide } from "./orbit-guide";
import { StatusBadge } from "./status-badge";
import { StepIndicator, type Step } from "./step-indicator";

export type OrbitStep = "profile" | "medical" | "dependents" | "review" | "confirmation";

export interface EnrollmentPlan {
  id: string;
  name: string;
  description: string;
  payrollDeductionCents: number;
}

export interface EnrollmentSummary {
  plan: EnrollmentPlan | null;
  coveredDependentIds: string[];
  payrollDeductionCents: number;
}

export interface OrbitEnrollmentProps {
  plans: EnrollmentPlan[];
  dependents: Array<{ id: string; name: string }>;
  employeeName: string;
}

const FLOW_STEPS: Step[] = [
  { id: "profile", label: "Profile" },
  { id: "medical", label: "Medical coverage" },
  { id: "dependents", label: "Dependents" },
  { id: "review", label: "Review" },
  { id: "confirmation", label: "Confirmation" },
];

const STEP_COPY: Record<OrbitStep, { title: string; next: string }> = {
  profile: { title: "Confirm your household", next: "Choose medical coverage" },
  medical: { title: "Choose medical coverage", next: "Choose covered dependents" },
  dependents: { title: "Choose covered dependents", next: "Review enrollment" },
  review: { title: "Review before submitting", next: "Submit enrollment" },
  confirmation: { title: "Enrollment confirmation", next: "Enrollment submitted" },
};

export function getStepPosition(step: OrbitStep) {
  const index = FLOW_STEPS.findIndex((item) => item.id === step);
  return { current: index + 1, total: FLOW_STEPS.length, label: FLOW_STEPS[index]?.label ?? "" };
}

/** STORY-038: the UI stays inside the benefit-enrollment task boundary. */
export function classifyEmployeePrompt(value: string): "in_scope" | "redirect" {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "in_scope";
  return /benefit|medical|dental|vision|plan|coverage|dependent|cost|deduction|enroll/.test(normalized)
    ? "in_scope"
    : "redirect";
}

/** STORY-040: cost is supplied by the application; this function only maps it for display. */
export function buildEnrollmentSummary(
  plans: EnrollmentPlan[],
  selectedPlanId: string | null,
  coveredDependentIds: string[],
): EnrollmentSummary {
  const plan = plans.find((item) => item.id === selectedPlanId) ?? null;
  return {
    plan,
    coveredDependentIds,
    payrollDeductionCents: plan?.payrollDeductionCents ?? 0,
  };
}

function money(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function SummaryRow({ label, value, onChange }: { label: string; value: string; onChange: () => void }) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-sky-100">{label}</p>
          <p className="mt-1 text-sm text-white">{value}</p>
        </div>
        <button type="button" onClick={onChange} className="rounded px-2 py-1 text-sm font-semibold text-sky-100 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          Change
        </button>
      </div>
    </div>
  );
}

export function OrbitEnrollment({ plans, dependents, employeeName }: OrbitEnrollmentProps) {
  const [step, setStep] = useState<OrbitStep>("profile");
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [coveredDependentIds, setCoveredDependentIds] = useState<string[]>([]);
  const [comparisonOpen, setComparisonOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [promptStatus, setPromptStatus] = useState("");
  const [draftSaved, setDraftSaved] = useState(false);
  const summary = useMemo(
    () => buildEnrollmentSummary(plans, selectedPlanId, coveredDependentIds),
    [plans, selectedPlanId, coveredDependentIds],
  );
  const stepPosition = getStepPosition(step);
  const selectedDependents = dependents.filter((dependent) => coveredDependentIds.includes(dependent.id));

  const goTo = (next: OrbitStep) => {
    setDraftSaved(false);
    setStep(next);
  };
  const toggleDependent = (id: string) => {
    setCoveredDependentIds((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  };
  const handlePrompt = () => {
    const kind = classifyEmployeePrompt(prompt);
    setPromptStatus(kind === "redirect"
      ? "I can help with benefit choices, dependents, costs, and enrollment confirmation. For other questions, I will point you to the right team."
      : "I can help with this enrollment question. Choose a guided option below to continue.");
  };

  return (
    <main className="min-h-screen bg-[var(--mc-bg)] px-4 py-8 text-[var(--mc-ink)] sm:px-8">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-[var(--mc-border)] bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-4 bg-[var(--mc-sky,#ddf3f4)] px-6 py-4">
          <div className="flex items-center gap-3">
            <OrbitGuide status={step === "confirmation" ? "success" : "listening"} statusText="Orbit Guide" />
            <div>
              <p className="text-lg font-bold">New Employee Enrollment</p>
              <p className="text-sm text-[var(--mc-ink-secondary)]">Welcome, {employeeName}</p>
            </div>
          </div>
          <StatusBadge kind={draftSaved ? "success" : "info"} label={draftSaved ? "Draft saved" : "Guided enrollment"} />
        </header>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:p-8">
          <section aria-labelledby="employee-flow-title" className="min-w-0">
            <StepIndicator steps={FLOW_STEPS} currentStepId={step} />
            <div className="mt-7 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[var(--mc-ink-secondary)]">Step {stepPosition.current} of {stepPosition.total}</p>
                <h1 id="employee-flow-title" className="mt-1 text-3xl font-bold tracking-tight">{STEP_COPY[step].title}</h1>
                <p className="mt-2 text-[var(--mc-ink-secondary)]">Next: {STEP_COPY[step].next}</p>
              </div>
              <StatusBadge kind="info" label="Benefit-only guide" />
            </div>

            <div className="mt-6 rounded-2xl bg-sky-50 p-4">
              <p className="font-semibold">I can help with benefit choices, dependents, costs, and confirmation.</p>
              <p className="mt-1 text-sm text-[var(--mc-ink-secondary)]">For other questions, I will point you to the right team.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label className="sr-only" htmlFor="orbit-prompt">Ask an enrollment question</label>
                <input id="orbit-prompt" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask about this enrollment" className="min-w-56 flex-1 rounded-lg border border-[var(--mc-border)] bg-white px-3 py-2 text-sm" />
                <Button type="button" onClick={handlePrompt}>Ask guide</Button>
              </div>
              {promptStatus && <p className="mt-3 text-sm" role="status">{promptStatus}</p>}
            </div>

            {step === "profile" && (
              <Card className="mt-6">
                <h2 className="text-xl font-bold">Your household</h2>
                <p className="mt-2 text-[var(--mc-ink-secondary)]">You can update covered dependents in the next step. We will show the selected coverage before you submit.</p>
                <Button className="mt-5" onClick={() => goTo("medical")}>Continue to medical coverage</Button>
              </Card>
            )}

            {step === "medical" && (
              <div className="mt-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {plans.map((plan) => {
                    const selected = plan.id === selectedPlanId;
                    return (
                      <Card key={plan.id} variant={selected ? "selected" : "default"}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h2 className="text-xl font-bold">{plan.name}</h2>
                            <p className="mt-1 text-sm text-[var(--mc-ink-secondary)]">{plan.description}</p>
                          </div>
                          {selected && <StatusBadge kind="success" label="Selected" />}
                        </div>
                        <p className="mt-5 text-lg font-bold">{money(plan.payrollDeductionCents)} <span className="text-sm font-normal text-[var(--mc-ink-secondary)]">per pay period</span></p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button variant="secondary" type="button" onClick={() => setComparisonOpen(true)}>Compare</Button>
                          <Button type="button" onClick={() => setSelectedPlanId(plan.id)}>{selected ? "Selected plan" : "Select plan"}</Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                {!selectedPlanId && <p className="mt-4 text-sm font-medium text-[var(--mc-error)]" role="status">Select a medical plan to continue.</p>}
                <div className="mt-6 flex justify-end"><Button disabled={!selectedPlanId} onClick={() => goTo("dependents")}>Continue to dependents</Button></div>
                {comparisonOpen && (
                  <div className="mt-5 rounded-2xl border border-[var(--mc-primary)] bg-blue-50 p-5" role="dialog" aria-modal="false" aria-label="Medical plan comparison">
                    <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">Plan comparison</h2><p className="mt-1 text-sm text-[var(--mc-ink-secondary)]">Comparing plans does not change your selection.</p></div><Button variant="secondary" onClick={() => setComparisonOpen(false)}>Close comparison</Button></div>
                    <ul className="mt-4 grid gap-2 text-sm">{plans.map((plan) => <li key={plan.id} className="rounded-lg bg-white p-3"><strong>{plan.name}</strong> — {plan.description}; {money(plan.payrollDeductionCents)} per pay period.</li>)}</ul>
                  </div>
                )}
              </div>
            )}

            {step === "dependents" && (
              <Card className="mt-6">
                <h2 className="text-xl font-bold">Who should this medical plan cover?</h2>
                <p className="mt-2 text-sm text-[var(--mc-ink-secondary)]">Choose all covered dependents. You can change this from the summary before submission.</p>
                <fieldset className="mt-5 space-y-3"><legend className="sr-only">Covered dependents</legend>{dependents.map((dependent) => <label key={dependent.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--mc-border)] p-4"><input type="checkbox" checked={coveredDependentIds.includes(dependent.id)} onChange={() => toggleDependent(dependent.id)} /><span className="font-semibold">{dependent.name}</span></label>)}</fieldset>
                <div className="mt-6 flex flex-wrap justify-between gap-3"><Button variant="secondary" onClick={() => goTo("medical")}>Back to medical coverage</Button><Button disabled={!selectedPlanId} onClick={() => goTo("review")}>Review enrollment</Button></div>
              </Card>
            )}

            {step === "review" && (
              <Card className="mt-6">
                <h2 className="text-xl font-bold">Ready to review your enrollment?</h2>
                <p className="mt-2 text-[var(--mc-ink-secondary)]">Submit sends the selections shown here for processing. Save draft keeps this enrollment available for later; it does not submit it.</p>
                <div className="mt-6 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => { setDraftSaved(true); }}>Save draft</Button><Button disabled={!summary.plan} onClick={() => goTo("confirmation")}>Submit enrollment</Button></div>
              </Card>
            )}

            {step === "confirmation" && (
              <Card className="mt-6">
                <StatusBadge kind="success" label="Ready for deterministic submission" />
                <h2 className="mt-4 text-xl font-bold">Review complete</h2>
                <p className="mt-2 text-[var(--mc-ink-secondary)]">This prototype confirms the exact information that the application would submit. Production persistence remains a protected deterministic server action.</p>
                <Button className="mt-5" variant="secondary" onClick={() => goTo("review")}>Return to review</Button>
              </Card>
            )}
          </section>

          <aside aria-label="Enrollment summary" className="h-fit rounded-2xl bg-slate-900 p-5 text-white lg:sticky lg:top-6">
            <p className="text-sm font-bold tracking-wide text-sky-100">YOUR ENROLLMENT</p>
            <div className="mt-5 space-y-3">
              <SummaryRow label="Medical" value={summary.plan?.name ?? "Not selected"} onChange={() => goTo("medical")} />
              <SummaryRow label="Covered dependents" value={selectedDependents.length ? selectedDependents.map((dependent) => dependent.name).join(", ") : "None selected"} onChange={() => goTo("dependents")} />
            </div>
            <div className="mt-6 border-t border-slate-700 pt-5"><p className="text-sm text-sky-100">Estimated payroll deduction</p><p className="mt-1 text-2xl font-bold">{money(summary.payrollDeductionCents)} <span className="text-sm font-medium">per pay period</span></p><p className="mt-2 text-sm text-sky-100">Calculated by the application from the selected plan.</p></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
