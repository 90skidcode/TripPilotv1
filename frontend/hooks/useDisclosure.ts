"use client";

import { useState, useCallback } from "react";

export interface UseDisclosureReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Hook for managing disclosure state (modals, dialogs, popovers, etc.)
 *
 * @example
 * const { isOpen, open, close, toggle } = useDisclosure();
 *
 * return (
 *   <>
 *     <button onClick={open}>Open Dialog</button>
 *     <Dialog open={isOpen} onOpenChange={close}>
 *       <DialogContent>...</DialogContent>
 *     </Dialog>
 *   </>
 * );
 */
export function useDisclosure(initialState: boolean = false): UseDisclosureReturn {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return { isOpen, open, close, toggle };
}
