import type { ReactNode } from "react";

export type StatusKind = "success" | "warning" | "error" | "info";

export interface StatusBadgeProps {
  kind: StatusKind;
  label: string;
  icon?: ReactNode;
}

const iconMap: Record<StatusKind, string> = {
  success: "✓",
  warning: "!",
  error: "✕",
  info: "i",
};

/**
 * Status text plus icon. Color is never the only signal.
 * `kind=success` uses green because green is reserved for status/success.
 */
export function StatusBadge({ kind, label, icon }: StatusBadgeProps) {
  const tone =
    kind === "success"
      ? "text-green-700 bg-green-100"
      : kind === "warning"
        ? "text-yellow-700 bg-yellow-100"
        : kind === "error"
          ? "text-red-700 bg-red-100"
          : "text-blue-700 bg-blue-100";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}
      data-testid="status-badge"
      data-status={kind}
    >
      <span aria-hidden="true">{icon ?? iconMap[kind]}</span>
      <span>{label}</span>
    </span>
  );
}
