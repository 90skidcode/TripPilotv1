import React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  label?: string;
  maxLength?: number;
  showCharCount?: boolean;
}

/**
 * Textarea Component
 * Multi-line text input with optional character counter
 *
 * @example
 * <Textarea placeholder="Enter message" />
 * <Textarea label="Notes" maxLength={500} showCharCount={true} />
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      error,
      errorMessage,
      helperText,
      label,
      disabled,
      maxLength,
      showCharCount,
      defaultValue,
      value,
      ...props
    },
    ref
  ) => {
    const [charCount, setCharCount] = React.useState(
      typeof value === "string"
        ? value.length
        : typeof defaultValue === "string"
          ? defaultValue.length
          : 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      props.onChange?.(e);
    };

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={props.id}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <textarea
          className={cn(
            "flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-ring resize-vertical",
            error && "border-destructive bg-destructive/5",
            disabled && "cursor-not-allowed opacity-50",
            className
          )}
          ref={ref}
          disabled={disabled}
          maxLength={maxLength}
          onChange={handleChange}
          value={value}
          {...props}
        />
        <div className="flex justify-between gap-2">
          <div>
            {errorMessage && (
              <p className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
            )}
            {helperText && !error && (
              <p className="text-xs text-muted-foreground">{helperText}</p>
            )}
          </div>
          {maxLength && showCharCount && (
            <p className="text-xs text-muted-foreground">
              {charCount}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
