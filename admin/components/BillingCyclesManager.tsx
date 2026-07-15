"use client";

import { useState, useEffect } from "react";
import { SuperAdminAPI } from "@/lib/api";

interface BillingCycle {
  id: number;
  plan_id: number;
  billing_cycle: string;
  monthly_price: number;
  discount_percent: number;
  display_price: string;
  is_active: boolean;
}

interface BillingCyclesManagerProps {
  planId: number;
  planName: string;
  onClose: () => void;
}

const CYCLE_TYPES = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "half_yearly", label: "Half-Yearly" },
  { value: "yearly", label: "Yearly" },
];

export default function BillingCyclesManager({
  planId,
  planName,
  onClose,
}: BillingCyclesManagerProps) {
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    billing_cycle: "monthly",
    monthly_price: 0,
    discount_percent: 0,
    display_price: "",
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadCycles();
  }, [planId]);

  async function loadCycles() {
    try {
      const data = await SuperAdminAPI.getPlanBillingCycles(planId);
      setCycles(data);
    } catch (error) {
      showToast(
        `Failed to load billing cycles: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({
      billing_cycle: "monthly",
      monthly_price: 0,
      discount_percent: 0,
      display_price: "",
    });
    setShowForm(true);
  }

  function handleOpenEdit(cycle: BillingCycle) {
    setEditingId(cycle.id);
    setFormData({
      billing_cycle: cycle.billing_cycle,
      monthly_price: cycle.monthly_price,
      discount_percent: cycle.discount_percent,
      display_price: cycle.display_price,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formData.monthly_price < 0) {
      showToast("Price must be >= 0", "error");
      return;
    }
    if (formData.discount_percent < 0 || formData.discount_percent > 100) {
      showToast("Discount must be between 0-100%", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await SuperAdminAPI.updateBillingCycle(editingId, formData);
        showToast("Billing cycle updated successfully", "success");
      } else {
        await SuperAdminAPI.createBillingCycle(planId, formData);
        showToast("Billing cycle created successfully", "success");
      }
      setShowForm(false);
      loadCycles();
    } catch (error) {
      showToast(
        `Failed to save: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(cycleId: number) {
    if (!confirm("Are you sure you want to delete this billing cycle?")) return;

    setSaving(true);
    try {
      await SuperAdminAPI.deleteBillingCycle(cycleId);
      showToast("Billing cycle deleted successfully", "success");
      loadCycles();
    } catch (error) {
      showToast(
        `Failed to delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        "error"
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
        Loading billing cycles...
      </div>
    );
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
          maxWidth: "600px",
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
              Billing Cycles for {planName}
            </h2>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              Manage pricing tiers for different billing periods
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "24px",
              color: "#64748b",
            }}
          >
            ✕
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div
            style={{
              padding: "12px 16px",
              margin: "12px",
              borderRadius: "8px",
              background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
              color: toast.type === "error" ? "#991b1b" : "#166534",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {toast.message}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Cycles List */}
          {cycles.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {cycles.map((cycle) => (
                <div
                  key={cycle.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        textTransform: "capitalize",
                        color: "#1e293b",
                      }}
                    >
                      {cycle.billing_cycle}
                    </div>
                    <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
                      ₹{cycle.monthly_price.toLocaleString()} {cycle.display_price && `• ${cycle.display_price}`}
                    </div>
                    {cycle.discount_percent > 0 && (
                      <div style={{ fontSize: "12px", color: "#059669", marginTop: "4px" }}>
                        Save {cycle.discount_percent}%
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleOpenEdit(cycle)}
                      style={{
                        padding: "6px 12px",
                        background: "#e0f2fe",
                        color: "#0369a1",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(cycle.id)}
                      style={{
                        padding: "6px 12px",
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: 500,
                      }}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "24px",
                background: "#f8fafc",
                borderRadius: "8px",
                color: "#64748b",
              }}
            >
              No billing cycles found. Create one to get started.
            </div>
          )}

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Billing Cycle Type
                </label>
                <select
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                  }}
                  disabled={editingId !== null}
                >
                  {CYCLE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.monthly_price}
                    onChange={(e) =>
                      setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    value={formData.discount_percent}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_percent: parseFloat(e.target.value) || 0 })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "6px",
                      fontSize: "13px",
                      boxSizing: "border-box",
                    }}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Display Price (e.g., "₹999/month")
                </label>
                <input
                  type="text"
                  value={formData.display_price}
                  onChange={(e) => setFormData({ ...formData, display_price: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  placeholder="₹999/month"
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#e2e8f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "13px",
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "8px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 500,
                    fontSize: "13px",
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          )}

          {!showForm && (
            <button
              onClick={handleOpenCreate}
              style={{
                padding: "10px 16px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              + Add Billing Cycle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
