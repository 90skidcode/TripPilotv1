import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus-ring",
  {
    variants: {
      variant: {
        default:
          "border-border bg-card text-foreground hover:bg-card/80",
        primary:
          "border-primary/50 bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-secondary/50 bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-destructive/50 bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-foreground",
        success:
          "border-green-500/30 bg-green-50 text-green-700 hover:bg-green-100",
        warning:
          "border-yellow-500/30 bg-yellow-50 text-yellow-700 hover:bg-yellow-100",
        info: "border-blue-500/30 bg-blue-50 text-blue-700 hover:bg-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge Component
 * Compact element for displaying labels, tags, or status
 *
 * @example
 * <Badge>New</Badge>
 * <Badge variant="success">Active</Badge>
 * <Badge variant="destructive">Offline</Badge>
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
