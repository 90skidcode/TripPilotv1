"use client";
import { useState } from "react";
import { leadPaymentsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";

const PAYMENT_TYPES = [
  { value: "partial", label: "Partial Payment" },
  { value: "full", label: "Full Payment" },
];

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "card", label: "Card" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

interface Props {
  leadId: number;
  totalPrice: number;
  totalPaid: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddPaymentModal({ leadId, totalPrice, totalPaid, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const outstanding = Math.max(0, totalPrice - totalPaid);

  const [form, setForm] = useState({
    amount: outstanding > 0 ? String(outstanding) : "",
    payment_type: outstanding > 0 && totalPaid === 0 ? "full" : "partial",
    payment_method: "cash",
    payment_date: new Date().toISOString().slice(0, 10),
    reference_number: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await leadPaymentsApi.create(leadId, {
        amount: Number(form.amount),
        payment_type: form.payment_type,
        payment_method: form.payment_method,
        payment_date: new Date(form.payment_date).toISOString(),
        reference_number: form.reference_number || null,
        notes: form.notes || null,
      });
      showToast({ type: "success", message: "✓ Payment recorded successfully", duration: 3000 });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save payment");
      showToast({ type: "error", message: `✕ ${err.message || "Failed to save payment"}`, duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ backgroundColor: "white", borderRadius: "var(--radius,8px)", width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e3eaef", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Record Payment</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Summary bar */}
            {totalPrice > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "12px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "var(--radius,8px)" }}>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", margin: "0 0 2px" }}>Total Price</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", margin: 0 }}>₹{totalPrice.toLocaleString("en-IN")}</p>
                </div>
                <div style={{ textAlign: "center", borderLeft: "1px solid #e2e8f0", borderRight: "1px solid #e2e8f0" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", margin: "0 0 2px" }}>Paid</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#16a34a", margin: 0 }}>₹{totalPaid.toLocaleString("en-IN")}</p>
                </div>
                <div style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", margin: "0 0 2px" }}>Outstanding</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: outstanding > 0 ? "#dc2626" : "#16a34a", margin: 0 }}>₹{outstanding.toLocaleString("en-IN")}</p>
                </div>
              </div>
            )}

            {/* Payment Type */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {PAYMENT_TYPES.map((t) => (
                <label
                  key={t.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                    border: `2px solid ${form.payment_type === t.value ? "var(--primary,#7c3aed)" : "#e2e8f0"}`,
                    borderRadius: "var(--radius,8px)", cursor: "pointer",
                    background: form.payment_type === t.value ? "#f5f3ff" : "white",
                    transition: "all 0.15s",
                  }}
                >
                  <input type="radio" name="payment_type" value={t.value} checked={form.payment_type === t.value} onChange={(e) => update("payment_type", e.target.value)} style={{ accentColor: "var(--primary,#7c3aed)" }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: form.payment_type === t.value ? "var(--primary,#7c3aed)" : "#374151" }}>{t.label}</span>
                </label>
              ))}
            </div>

            {/* Amount */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Amount (₹) <span className="required">*</span></label>
              <input className="input" type="number" min="1" step="0.01" value={form.amount} onChange={(e) => update("amount", e.target.value)} placeholder="Enter amount" required />
            </div>

            {/* Method & Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Payment Method</label>
                <select className="input" value={form.payment_method} onChange={(e) => update("payment_method", e.target.value)}>
                  {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Payment Date</label>
                <input className="input" type="date" value={form.payment_date} onChange={(e) => update("payment_date", e.target.value)} />
              </div>
            </div>

            {/* Reference */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Reference / Transaction ID</label>
              <input className="input" value={form.reference_number} onChange={(e) => update("reference_number", e.target.value)} placeholder="e.g. UPI ref, cheque no." />
            </div>

            {/* Notes */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Notes</label>
              <textarea className="input" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} placeholder="Optional notes" />
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "var(--radius,8px)", fontSize: 13 }}>
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #e3eaef", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#f9fafb" }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
