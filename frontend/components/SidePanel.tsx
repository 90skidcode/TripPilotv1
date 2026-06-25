"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  /** Called when the primary action button is clicked. Omit to hide the button. */
  onSave?: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  saveDisabled?: boolean;
  /** Override the entire footer with custom content. */
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export default function SidePanel({
  title,
  subtitle,
  onClose,
  onSave,
  saveLabel = "Save",
  cancelLabel = "Cancel",
  saving = false,
  saveDisabled = false,
  footer,
  children,
}: Props) {
  const [closing, setClosing] = useState(false);

  function close() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 270);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`side-panel-overlay${closing ? " is-closing" : ""}`}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div className={`side-panel${closing ? " is-closing" : ""}`}>
        {/* Header */}
        <div className="side-panel-header">
          <div>
            <h2 className="side-panel-title">{title}</h2>
            {subtitle && <p className="side-panel-subtitle">{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={close} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="side-panel-content">{children}</div>

        {/* Footer */}
        <div className="side-panel-footer">
          {footer ?? (
            <>
              <Button variant="outline" onClick={close}>{cancelLabel}</Button>
              {onSave && (
                <Button variant="primary" onClick={onSave} disabled={saving || saveDisabled}>
                  {saving ? "Saving…" : saveLabel}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
