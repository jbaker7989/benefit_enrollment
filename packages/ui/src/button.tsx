import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

/**
 * Shared action button. Green is intentionally not used for primary actions:
 * it is reserved for completed/success status throughout the enrollment UI.
 */
export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--mc-focus)] disabled:cursor-not-allowed disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-[var(--mc-primary)] text-white hover:bg-[var(--mc-primary-hover)]"
      : "border border-[var(--mc-border)] bg-white text-[var(--mc-ink)] hover:bg-[var(--mc-bg)]";
  return (
    <button className={[base, styles, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
