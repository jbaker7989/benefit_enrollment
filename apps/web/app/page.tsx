import { OrbitEnrollment, type EnrollmentPlan } from "@benefit/ui";

const PLANS: EnrollmentPlan[] = [
  { id: "value-ppo", name: "Value PPO", description: "Lower premium with a higher deductible.", payrollDeductionCents: 8400 },
  { id: "choice-ppo", name: "Choice PPO", description: "More predictable costs when you need care.", payrollDeductionCents: 12200 },
];

export default function Home() {
  return (
    <OrbitEnrollment
      employeeName="Avery Morgan"
      plans={PLANS}
      dependents={[{ id: "jordan", name: "Jordan Morgan" }, { id: "riley", name: "Riley Morgan" }]}
    />
  );
}
