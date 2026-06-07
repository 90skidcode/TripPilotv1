"use client";
import { useState } from "react";
import { followupsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";

interface Props {
  leadId: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddFollowupModal({ leadId, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const [form, setForm] = useState({
    scheduled_date: new Date().toISOString().slice(0, 16),
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await followupsApi.create(leadId, {
        scheduled_date: new Date(form.scheduled_date).toISOString(),
        notes: form.notes || null,
      });
      showToast({
        type: "success",
        message: "✓ Follow-up scheduled successfully",
        duration: 3000,
      });
      onSaved();
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create follow-up";
      setError(errorMsg);
      showToast({
        type: "error",
        message: `✕ ${errorMsg}`,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "var(--radius, 8px)",
          width: "100%",
          maxWidth: 500,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e3eaef",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Schedule Follow-up</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="followup-modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(85vh - 120px)" }}>
            <div style={{ display: "grid", gap: 16 }}>
              <div className="input-group">
                <label className="input-label">When? <span className="required">*</span></label>
                <input
                  id="followup-date"
                  type="datetime-local"
                  className="input"
                  value={form.scheduled_date}
                  onChange={(e) => update("scheduled_date", e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label">Notes</label>
                <textarea
                  id="followup-notes"
                  className="input"
                  rows={4}
                  placeholder="e.g. Call to discuss budget, send Maldives package quote, etc."
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </div>

              {error && (
                <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: "6px", fontSize: 13 }}>
                  {error}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e3eaef",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              backgroundColor: "#f1f3fa"
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose} id="followup-cancel-btn">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="followup-save-btn">
              {loading ? "Scheduling…" : "Schedule Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
