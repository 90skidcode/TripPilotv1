"use client";

import { useState } from "react";
import { leadExpensesApi } from "@/lib/api";
import { useToast } from "@/components/Toast";

const EXPENSE_CATEGORIES = [
  { value: "b2b_partner", label: "🤝 B2B Partner / DMC Supplier" },
  { value: "visa", label: "🛂 Visa Fees & Processing" },
  { value: "insurance", label: "🛡️ Travel Insurance" },
  { value: "flight", label: "✈️ Flight / Transport Booking" },
  { value: "hotel", label: "🏨 Hotel / Accommodation" },
  { value: "activity", label: "🎟️ Activity / Tour Supplier" },
  { value: "other", label: "📌 Other Miscellaneous Expense" },
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
  onClose: () => void;
  onSaved: () => void;
}

export default function AddExpenseModal({ leadId, onClose, onSaved }: Props) {
  const { showToast } = useToast();

  const [form, setForm] = useState({
    category: "b2b_partner",
    title: "",
    amount: "",
    payment_status: "paid",
    payment_method: "bank_transfer",
    payment_date: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Please enter a vendor name or expense description");
      return;
    }
    if (!form.amount || Number(form.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await leadExpensesApi.createExpense(leadId, {
        category: form.category,
        title: form.title.trim(),
        amount: Number(form.amount),
        payment_status: form.payment_status,
        payment_method: form.payment_method,
        payment_date: form.payment_date ? new Date(form.payment_date).toISOString() : null,
        notes: form.notes.trim() || null,
      });

      showToast({ type: "success", message: "✓ Expense recorded successfully", duration: 3000 });
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to record expense");
      showToast({ type: "error", message: `✕ ${err.message || "Failed to record expense"}`, duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "var(--radius,8px)",
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e3eaef",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Record Lead Expense / Vendor Cost</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Category */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Expense Category <span className="required">*</span></label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Vendor / Title */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Vendor Name / Item Description <span className="required">*</span></label>
              <input
                className="input"
                type="text"
                placeholder="e.g. Dubai DMC, VFS Visa 2 Pax, TATA AIG Insurance"
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
              />
            </div>

            {/* Amount & Payment Status */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Cost Amount (₹) <span className="required">*</span></label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => update("amount", e.target.value)}
                  placeholder="Enter amount"
                  required
                />
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Status</label>
                <select
                  className="input"
                  value={form.payment_status}
                  onChange={(e) => update("payment_status", e.target.value)}
                >
                  <option value="paid">Paid Out</option>
                  <option value="pending">Pending / Payable</option>
                </select>
              </div>
            </div>

            {/* Method & Date */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Payment Method</label>
                <select
                  className="input"
                  value={form.payment_method}
                  onChange={(e) => update("payment_method", e.target.value)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group" style={{ margin: 0 }}>
                <label className="input-label">Expense Date</label>
                <input
                  className="input"
                  type="date"
                  value={form.payment_date}
                  onChange={(e) => update("payment_date", e.target.value)}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Notes</label>
              <textarea
                className="input"
                rows={2}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Optional vendor reference, PNR, or payment note"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "#fee2e2",
                  color: "#dc2626",
                  padding: "10px 14px",
                  borderRadius: "var(--radius,8px)",
                  fontSize: 13,
                }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e3eaef",
              display: "flex",
              justifyContent: "flex-end",
              gap: 12,
              backgroundColor: "#f9fafb",
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Record Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
