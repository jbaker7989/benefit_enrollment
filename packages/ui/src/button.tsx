import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  children: ReactNode;
}

/**
 * Minimal starter button for the shared UI package. Styling is intentionally
 * light — swap in the design system (e.g. shadcn/ui) when it lands.
 */
export function Button({
  variant = "primary",
  children,
  className,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-foreground text-background hover:opacity-90"
      : "border border-black/10 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/10";
  return (
    <button className={[base, styles, className].filter(Boolean).join(" ")} {...props}>
      {children}
    </button>
  );
}
