import React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
}

/**
 * Input Component
 * Text input with optional label, error state, and helper text
 *
 * @example
 * <Input placeholder="Enter name" />
 * <Input label="Email" type="email" error={true} errorMessage="Invalid email" />
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      errorMessage,
      helperText,
      label,
      disabled,
      ...props
    },
    ref
  ) => (
    <div className="flex flex-col gap-1">
      {label && (
        <label
          htmlFor={props.id}
          className="text-sm font-medium text-foreground"
        >
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-ring",
          error && "border-destructive bg-destructive/5",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
        ref={ref}
        disabled={disabled}
        {...props}
      />
      {errorMessage && (
        <p className="text-sm font-medium text-destructive">{errorMessage}</p>
      )}
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
    </div>
  )
);
Input.displayName = "Input";

export { Input };
