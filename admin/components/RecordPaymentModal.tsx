"use client";

import { useState } from "react";
import { SuperAdminAPI } from "@/lib/api";

interface RecordPaymentModalProps {
  invoice: {
    id: number;
    org_name: string | null;
    invoice_type: string;
    plan_name: string | null;
    billing_cycle: string | null;
    period_start: string | null;
    period_end: string | null;
    amount: number;
    due_date: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const PAYMENT_MODES = [
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: "6px",
  fontSize: "13px",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  marginBottom: "6px",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
}

export default function RecordPaymentModal({ invoice, onClose, onSuccess }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState(String(invoice.amount ?? 0));
  const [paymentMode, setPaymentMode] = useState("upi");
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await SuperAdminAPI.payInvoice(invoice.id, {
        amount: amount === "" ? undefined : parseFloat(amount),
        payment_mode: paymentMode || undefined,
        payment_reference: paymentReference || undefined,
        note: note || undefined,
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record payment");
    } finally {
      setSaving(false);
    }
  }

  async function handleWaive() {
    if (!confirm("Waive this invoice? The period will be granted for free.")) return;
    setError(null);
    setSaving(true);
    try {
      await SuperAdminAPI.waiveInvoice(invoice.id);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to waive invoice");
    } finally {
      setSaving(false);
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
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          maxWidth: "480px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>Record Payment</h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              {invoice.org_name} — {invoice.invoice_type === "upgrade" ? "upgrade charge" : "renewal"}{" "}
              {invoice.plan_name && `· ${invoice.plan_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#64748b" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handlePay} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              fontSize: "13px",
              color: "#475569",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <span>
              Period: <strong>{formatDate(invoice.period_start)} → {formatDate(invoice.period_end)}</strong>
            </span>
            <span>
              Due date: <strong>{formatDate(invoice.due_date)}</strong> · Suggested amount:{" "}
              <strong>₹{(invoice.amount ?? 0).toLocaleString("en-IN")}</strong>
            </span>
          </div>

          {error && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fee2e2",
                color: "#991b1b",
                fontSize: "13px",
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Amount received (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Payment mode</label>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} style={inputStyle}>
                {PAYMENT_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>Reference number</label>
            <input
              type="text"
              maxLength={100}
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              style={inputStyle}
              placeholder="UTR / transaction / cheque number"
            />
          </div>

          <div>
            <label style={labelStyle}>Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ ...inputStyle, minHeight: "48px", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={handleWaive}
              disabled={saving}
              style={{
                padding: "10px 14px",
                background: "#fef3c7",
                color: "#92400e",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              Waive
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1,
                padding: "10px",
                background: "#e2e8f0",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "13px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1,
                padding: "10px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {saving ? "Saving..." : "Mark as Paid"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
