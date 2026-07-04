import {
  forwardRef,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

type FieldVariant = "underline" | "box" | "search";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  variant?: FieldVariant;
};

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  variant?: Exclude<FieldVariant, "search">;
};

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  variant?: Exclude<FieldVariant, "search">;
};

const fieldVariants: Record<FieldVariant, string> = {
  underline:
    "border-0 border-b border-outline-variant/30 bg-paper-neutral px-2 py-3 focus-visible:border-primary",
  box:
    "rounded-lg border border-outline-variant/20 bg-surface px-3 py-2.5 focus-visible:border-primary",
  search:
    "rounded-full border-0 bg-paper-neutral px-4 py-2.5 focus-visible:ring-primary",
};

const baseFieldClasses =
  "focus-ring w-full text-sm text-on-surface outline-none transition-colors placeholder:text-on-surface-variant/60 disabled:cursor-not-allowed disabled:opacity-50";

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ variant = "underline", className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(baseFieldClasses, fieldVariants[variant], className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ variant = "underline", className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        baseFieldClasses,
        fieldVariants[variant],
        "min-h-24 resize-y",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ variant = "underline", className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(baseFieldClasses, fieldVariants[variant], className)}
      {...props}
    />
  ),
);
Select.displayName = "Select";
