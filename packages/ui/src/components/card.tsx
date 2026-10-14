import type { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  variant?: "default" | "selected";
  className?: string;
}

/**
 * Bordered surface with optional selected state communicated by border + label,
 * not color alone.
 */
export function Card({ children, variant = "default", className }: CardProps) {
  const base = "rounded-lg border bg-white p-5 shadow-sm";
  const selected =
    variant === "selected"
      ? "border-blue-600 ring-1 ring-blue-600"
      : "border-gray-200";

  return (
    <div
      className={[base, selected, className].filter(Boolean).join(" ")}
      data-variant={variant}
    >
      {children}
    </div>
  );
}
