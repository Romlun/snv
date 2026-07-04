import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "border-outline-variant/20 bg-surface-container text-secondary",
  primary: "border-primary-container/20 bg-primary-container/10 text-primary",
  success: "border-green-200 bg-green-100 text-green-800",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-100 text-red-800",
  info: "border-blue-200 bg-blue-100 text-blue-800",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-label-sm font-semibold uppercase tracking-wider",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
