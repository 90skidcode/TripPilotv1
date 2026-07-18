"use client";

import { useState, useEffect } from "react";
import { SuperAdminAPI } from "@/lib/api";

interface ExtendSubscriptionModalProps {
  agencyId: number;
  agencyName: string;
  currentPlanId?: number | null;
  currentBillingCycle?: string | null;
  renewalDate?: string | null;
  trialEndsAt?: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CYCLE_TYPES = [
  { value: "monthly", label: "Monthly", days: 30 },
  { value: "quarterly", label: "Quarterly", days: 90 },
  { value: "half_yearly", label: "Half-Yearly", days: 180 },
  { value: "yearly", label: "Yearly", days: 365 },
];

const PAYMENT_MODES = [
  { value: "", label: "— Not recorded —" },
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

export default function ExtendSubscriptionModal({
  agencyId,
  agencyName,
  currentPlanId,
  currentBillingCycle,
  renewalDate,
  trialEndsAt,
  onClose,
  onSuccess,
}: ExtendSubscriptionModalProps) {
  const [plans, setPlans] = useState<any[]>([]);
  const [mode, setMode] = useState<"billing_cycle" | "months" | "exact_date">("billing_cycle");
  const [months, setMonths] = useState(1);
  const [exactDate, setExactDate] = useState("");
  const [planId, setPlanId] = useState<number | "">(currentPlanId || "");
  const [billingCycle, setBillingCycle] = useState(currentBillingCycle || "monthly");
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTrial = !!trialEndsAt && !renewalDate;

  useEffect(() => {
    SuperAdminAPI.getAllPricingPlans()
      .then(setPlans)
      .catch(() => setPlans([]));
  }, []);

  // Informational preview only — the server computes the authoritative date.
  function previewDate(): string | null {
    const currentExpiry = renewalDate || trialEndsAt;
    const base = currentExpiry && new Date(currentExpiry) > new Date() ? new Date(currentExpiry) : new Date();
    let result: Date;
    if (mode === "billing_cycle") {
      const days = CYCLE_TYPES.find((c) => c.value === billingCycle)?.days || 30;
      result = new Date(base.getTime() + days * 86400000);
    } else if (mode === "months") {
      result = new Date(base.getTime() + months * 30 * 86400000);
    } else {
      if (!exactDate) return null;
      result = new Date(exactDate);
    }
    return result.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: any = { mode, billing_cycle: billingCycle };
    if (planId) payload.plan_id = planId;
    if (mode === "months") {
      if (!months || months < 1) {
        setError("Enter a valid number of months (1-60)");
        return;
      }
      payload.months = months;
    }
    if (mode === "exact_date") {
      if (!exactDate) {
        setError("Pick the new renewal date");
        return;
      }
      payload.new_renewal_date = exactDate;
    }
    if (amount !== "") payload.amount = parseFloat(amount);
    if (paymentMode) payload.payment_mode = paymentMode;
    if (paymentReference) payload.payment_reference = paymentReference;
    if (note) payload.note = note;

    setSaving(true);
    try {
      await SuperAdminAPI.extendSubscription(agencyId, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extend subscription");
    } finally {
      setSaving(false);
    }
  }

  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

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
          maxWidth: "560px",
          width: "90%",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>
              Extend Subscription
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              {agencyName} — record an offline payment and extend access
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "24px", color: "#64748b" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {isTrial && (
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "8px",
                background: "#fef3c7",
                color: "#92400e",
                fontSize: "13px",
              }}
            >
              This agency is on a trial. Extending will convert it to a paid subscription.
            </div>
          )}

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

          {/* Extension mode */}
          <div>
            <label style={labelStyle}>Extend by</label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { value: "billing_cycle", label: "One billing cycle" },
                { value: "months", label: "Custom months" },
                { value: "exact_date", label: "Exact date" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setMode(opt.value as any)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: mode === opt.value ? "1px solid #3b82f6" : "1px solid #e2e8f0",
                    background: mode === opt.value ? "#eff6ff" : "white",
                    color: mode === opt.value ? "#1d4ed8" : "#475569",
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {mode === "months" && (
            <div>
              <label style={labelStyle}>Number of months (1 month = 30 days)</label>
              <input
                type="number"
                min={1}
                max={60}
                value={months}
                onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
                style={inputStyle}
              />
            </div>
          )}

          {mode === "exact_date" && (
            <div>
              <label style={labelStyle}>New renewal date</label>
              <input
                type="date"
                min={tomorrow}
                value={exactDate}
                onChange={(e) => setExactDate(e.target.value)}
                style={inputStyle}
              />
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value ? parseInt(e.target.value) : "")}
                style={inputStyle}
              >
                <option value="">Keep current plan</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Billing cycle</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value)}
                style={inputStyle}
              >
                {CYCLE_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Offline payment details */}
          <div
            style={{
              padding: "16px",
              background: "#f8fafc",
              borderRadius: "8px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>
              Payment received (optional)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={inputStyle}
                  placeholder="0.00"
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
                style={{ ...inputStyle, minHeight: "56px", resize: "vertical" }}
                placeholder="e.g. July renewal collected by phone"
              />
            </div>
          </div>

          {previewDate() && (
            <div style={{ fontSize: "13px", color: "#475569" }}>
              New renewal date will be approximately <strong>{previewDate()}</strong>
            </div>
          )}

          <div style={{ display: "flex", gap: "8px" }}>
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
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {saving ? "Extending..." : "Extend Subscription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
