"use client";

import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface RowAction {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "destructive" | "outline" | "ghost" | "link";
  disabled?: boolean;
}

export interface RowActionsProps {
  actions: RowAction[];
  className?: string;
}

/**
 * RowActions Component
 * Dropdown menu for row-level actions
 *
 * @example
 * <RowActions
 *   actions={[
 *     { label: "Edit", onClick: handleEdit },
 *     { label: "Delete", variant: "destructive", onClick: handleDelete },
 *   ]}
 * />
 */
export function RowActions({ actions, className }: RowActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          title="Row actions"
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-48">
        <DialogHeader>
          <DialogTitle className="text-left">Actions</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={(action.variant || "ghost") as any}
              size="sm"
              className="justify-start"
              onClick={async () => {
                await action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
            >
              {action.icon && (
                <span className="mr-2">{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
