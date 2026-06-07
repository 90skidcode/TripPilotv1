"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";

interface PricingPlan {
  id: number;
  name: string;
  monthly_price: number;
  itineraries_limit: number;
  leads_limit: number;
  vouchers_limit: number;
  bills_limit: number;
  team_members_limit: number;
  storage_gb: number;
  trial_days: number;
  is_active: boolean;
}

const defaultFormData = {
  name: "",
  monthly_price: 0,
  itineraries_limit: 10,
  leads_limit: 50,
  vouchers_limit: 10,
  bills_limit: 10,
  team_members_limit: 3,
  storage_gb: 1,
  trial_days: 0,
  is_active: true
};

export default function PricingPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [statusModal, setStatusModal] = useState<{
    isOpen: boolean;
    plan: PricingPlan | null;
  }>({
    isOpen: false,
    plan: null
  });
  const [toggling, setToggling] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadPlans();
  }, []);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type, isOpen: true });
    setTimeout(() => {
      setToast(current => {
        if (current && current.message === message) {
          return { ...current, isOpen: false };
        }
        return current;
      });
    }, 4000);
  }

  async function loadPlans() {
    try {
      const data = await SuperAdminAPI.getAllPricingPlans();
      setPlans(data);
    } catch (error) {
      console.error("Failed to load plans:", error);
      if (error instanceof Error && error.message === "Unauthorized") {
        showToast("Session expired. Redirecting to login...", "error");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        showToast("Failed to load pricing plans", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenCreate() {
    setDrawerMode("create");
    setEditingId(null);
    setFormData(defaultFormData);
    setDrawerOpen(true);
  }

  function handleOpenEdit(plan: PricingPlan) {
    setDrawerMode("edit");
    setEditingId(plan.id);
    setFormData({
      name: plan.name,
      monthly_price: plan.monthly_price,
      itineraries_limit: plan.itineraries_limit,
      leads_limit: plan.leads_limit,
      vouchers_limit: plan.vouchers_limit,
      bills_limit: plan.bills_limit,
      team_members_limit: plan.team_members_limit,
      storage_gb: plan.storage_gb,
      trial_days: plan.trial_days,
      is_active: plan.is_active
    });
    setDrawerOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Plan name is required", "error");
      return;
    }

    setSaving(true);
    try {
      if (drawerMode === "create") {
        await SuperAdminAPI.createPricingPlan(formData);
        showToast("Pricing plan created successfully", "success");
      } else if (editingId) {
        await SuperAdminAPI.updatePricingPlan(editingId, formData);
        showToast("Pricing plan updated successfully", "success");
      }
      setDrawerOpen(false);
      loadPlans();
    } catch (error) {
      console.error("Error saving plan:", error);
      showToast(`Failed to save pricing plan: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setSaving(false);
    }
  }

  function handleToggleStatus(plan: PricingPlan) {
    setStatusModal({ isOpen: true, plan });
  }

  async function confirmToggleStatus(plan: PricingPlan) {
    const statusAction = plan.is_active ? "deactivate" : "activate";
    setToggling(true);
    try {
      if (plan.is_active) {
        await SuperAdminAPI.deletePricingPlan(plan.id);
        showToast(`Plan "${plan.name}" deactivated successfully`, "success");
      } else {
        await SuperAdminAPI.updatePricingPlan(plan.id, { ...plan, is_active: true });
        showToast(`Plan "${plan.name}" activated successfully`, "success");
      }
      await loadPlans();
      setStatusModal({ isOpen: false, plan: null });
    } catch (error) {
      console.error("Error toggling status:", error);
      showToast(`Failed to ${statusAction} plan: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading pricing plans...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>Pricing Plans</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage subscription tiers and usage limitations for agencies</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link href="/agencies" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            ← Back to Agencies
          </Link>
          <button onClick={handleOpenCreate} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            + New Plan
          </button>
        </div>
      </div>

      {/* Sliding Sidebar Drawer */}
      {drawerOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.3)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              animation: "fadeIn 0.2s ease-out"
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "50vw",
              minWidth: "480px",
              maxWidth: "90vw",
              background: "white",
              boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.12)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border)",
              animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {drawerMode === "create" ? "Create Pricing Plan" : "Edit Pricing Plan"}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "4px 0 0 0" }}>
                  {drawerMode === "create" ? "Add a new tier to standard pricing options" : "Modify limits and details for this tier"}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "var(--text-secondary)",
                  padding: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* SECTION 1: IDENTITY */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ width: "4px", height: "16px", background: "var(--brand)", borderRadius: "2px" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand)" }}>
                      1. Plan Identity
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div className="input-group">
                      <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Plan Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                        placeholder="e.g. Starter, Professional, Enterprise"
                        style={{ borderRadius: "8px" }}
                        required
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Monthly Price (₹)</label>
                        <input
                          type="number"
                          value={formData.monthly_price}
                          onChange={(e) => setFormData({ ...formData, monthly_price: Math.max(0, parseFloat(e.target.value) || 0) })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="0"
                          required
                        />
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Trial Duration (Days)</label>
                        <input
                          type="number"
                          value={formData.trial_days}
                          onChange={(e) => setFormData({ ...formData, trial_days: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="0"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: USAGE LIMITS */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ width: "4px", height: "16px", background: "var(--brand)", borderRadius: "2px" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand)" }}>
                      2. Core Usage Limits
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Itineraries Limit</label>
                        <input
                          type="number"
                          value={formData.itineraries_limit}
                          onChange={(e) => setFormData({ ...formData, itineraries_limit: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Leads Limit</label>
                        <input
                          type="number"
                          value={formData.leads_limit}
                          onChange={(e) => setFormData({ ...formData, leads_limit: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Vouchers Limit</label>
                        <input
                          type="number"
                          value={formData.vouchers_limit}
                          onChange={(e) => setFormData({ ...formData, vouchers_limit: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Bills Limit</label>
                        <input
                          type="number"
                          value={formData.bills_limit}
                          onChange={(e) => setFormData({ ...formData, bills_limit: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SECTION 3: ADVANCED LIMITS */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                    <div style={{ width: "4px", height: "16px", background: "var(--brand)", borderRadius: "2px" }} />
                    <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--brand)" }}>
                      3. Organization Limits
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Team Members</label>
                        <input
                          type="number"
                          value={formData.team_members_limit}
                          onChange={(e) => setFormData({ ...formData, team_members_limit: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                      <div className="input-group">
                        <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Storage Capacity (GB)</label>
                        <input
                          type="number"
                          value={formData.storage_gb}
                          onChange={(e) => setFormData({ ...formData, storage_gb: parseInt(e.target.value) || 0 })}
                          className="input"
                          style={{ borderRadius: "8px" }}
                          min="-1"
                          required
                        />
                        <span style={{ fontSize: "10.5px", color: "var(--text-secondary)", marginTop: "2px", display: "block" }}>Use -1 for unlimited</span>
                      </div>
                    </div>

                    {drawerMode === "edit" && (
                      <div style={{ marginTop: "8px", padding: "12px", background: "var(--bg-hover)", borderRadius: "8px", border: "1px solid var(--border)" }}>
                        <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13.5px", fontWeight: 600, color: "var(--text-primary)" }}>
                          <input
                            type="checkbox"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            style={{
                              width: "18px",
                              height: "18px",
                              accentColor: "var(--brand)",
                              cursor: "pointer"
                            }}
                          />
                          Active Tier (Enables subscription setups)
                        </label>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div
                style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--bg-hover)",
                  display: "flex",
                  gap: "12px"
                }}
              >
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, borderRadius: "8px", justifyContent: "center" }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 1, borderRadius: "8px", justifyContent: "center" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : drawerMode === "create" ? "Create Plan" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Premium Plans Table Container */}
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 20px rgba(15, 23, 42, 0.04)",
          overflow: "hidden"
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
            <thead>
              <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Plan Name</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Monthly Price</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Itineraries</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Leads</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Vouchers</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Bills</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Team Limit</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Storage Cap</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Trial Period</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Status</th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>🔍</div>
                    <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>No pricing plans found</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
                      There are no pricing plans available or the server could not be reached.
                    </div>
                    <button type="button" onClick={loadPlans} className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", margin: "0 auto", padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 600 }}>
                      🔄 Retry Loading
                    </button>
                  </td>
                </tr>
              ) : (
                plans.map((plan) => (
                <tr
                  key={plan.id}
                  style={{
                    borderBottom: "1px solid var(--border)",
                    opacity: plan.is_active ? 1 : 0.65,
                    transition: "background 0.2s ease, opacity 0.2s ease"
                  }}
                  className="table-row-hover"
                >
                  {/* Name */}
                  <td style={{ padding: "16px 20px", fontWeight: 700, color: "var(--text-primary)", fontSize: "15px" }}>
                    {plan.name}
                  </td>
                  
                  {/* Monthly Price */}
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    {plan.monthly_price === 0 ? (
                      <span className="badge badge-teal" style={{ fontWeight: 700, fontSize: "12px", padding: "4px 8px" }}>
                        Free
                      </span>
                    ) : (
                      <span style={{ fontWeight: 700, color: "var(--brand)", fontSize: "15px" }}>
                        ₹{plan.monthly_price}
                        <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-secondary)" }}>/mo</span>
                      </span>
                    )}
                  </td>
                  
                  {/* Itineraries */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.itineraries_limit === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      plan.itineraries_limit
                    )}
                  </td>
                  
                  {/* Leads */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.leads_limit === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      plan.leads_limit
                    )}
                  </td>
                  
                  {/* Vouchers */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.vouchers_limit === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      plan.vouchers_limit
                    )}
                  </td>
                  
                  {/* Bills */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.bills_limit === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      plan.bills_limit
                    )}
                  </td>
                  
                  {/* Team Members */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.team_members_limit === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      `${plan.team_members_limit} users`
                    )}
                  </td>
                  
                  {/* Storage */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-primary)", fontWeight: 600 }}>
                    {plan.storage_gb === -1 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "16px", fontWeight: 500 }}>∞</span>
                    ) : (
                      `${plan.storage_gb} GB`
                    )}
                  </td>
                  
                  {/* Trial Days */}
                  <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    {plan.trial_days === 0 ? (
                      <span style={{ color: "var(--text-secondary)", fontSize: "13px", fontStyle: "italic" }}>No Trial</span>
                    ) : (
                      <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{plan.trial_days} days</span>
                    )}
                  </td>
                  
                  {/* Status */}
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <span className={`badge ${plan.is_active ? "badge-green" : "badge-red"}`} style={{ display: "inline-block", padding: "4px 8px" }}>
                      {plan.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  
                  {/* Actions */}
                  <td style={{ padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                      <button
                        onClick={() => handleOpenEdit(plan)}
                        className="btn btn-sm btn-outline"
                        style={{ padding: "4px 10px", borderRadius: "6px", border: "1px solid var(--border)", fontSize: "12px" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(plan)}
                        className={`btn btn-sm ${plan.is_active ? "btn-outline btn-danger" : "btn-primary"}`}
                        style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "12px", border: plan.is_active ? "1px solid var(--error-border)" : "none" }}
                      >
                        {plan.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Premium Status Toggle Confirmation Dialog Modal */}
      {statusModal.isOpen && statusModal.plan && (
        <div
          className="modal-overlay"
          onClick={() => setStatusModal({ isOpen: false, plan: null })}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "440px" }}
          >
            <div className="modal-header" style={{ padding: "24px 24px 0 24px" }}>
              <h3 className="modal-title" style={{ fontSize: "18px", fontWeight: 700 }}>
                {statusModal.plan.is_active ? "Deactivate Pricing Plan" : "Activate Pricing Plan"}
              </h3>
              <button
                onClick={() => setStatusModal({ isOpen: false, plan: null })}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  color: "var(--text-secondary)",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-hover)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: statusModal.plan.is_active ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: statusModal.plan.is_active ? "var(--danger)" : "var(--success)",
                  flexShrink: 0
                }}>
                  {statusModal.plan.is_active ? "⚠️" : "✨"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.5" }}>
                    Are you sure you want to {statusModal.plan.is_active ? "deactivate" : "activate"} the plan <strong style={{ color: "var(--text-primary)" }}>{statusModal.plan.name}</strong>?
                  </p>
                  <p style={{ fontSize: "12.5px", color: "var(--text-muted)", margin: 0, lineHeight: "1.4" }}>
                    {statusModal.plan.is_active
                      ? "This will hide the plan from subscription options and disable new registrations for this tier."
                      : "This will make the plan active and visible for new registrations and subscriptions."}
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ padding: "0 24px 24px 24px" }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setStatusModal({ isOpen: false, plan: null })}
                style={{ borderRadius: "8px", padding: "8px 16px" }}
                disabled={toggling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`btn ${statusModal.plan.is_active ? "btn-danger" : "btn-primary"}`}
                onClick={() => confirmToggleStatus(statusModal.plan!)}
                style={{ borderRadius: "8px", padding: "8px 16px" }}
                disabled={toggling}
              >
                {toggling
                  ? (statusModal.plan.is_active ? "Deactivating..." : "Activating...")
                  : `Yes, ${statusModal.plan.is_active ? "Deactivate" : "Activate"}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toast && toast.isOpen && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              background: toast.type === "success" 
                ? "#E6F4EA" 
                : toast.type === "error" 
                ? "#FCE8E6" 
                : "var(--brand-light)",
              color: toast.type === "success" 
                ? "#137333" 
                : toast.type === "error" 
                ? "#C5221F" 
                : "var(--brand)",
              border: toast.type === "success" 
                ? "1px solid #A3E2AB" 
                : toast.type === "error" 
                ? "1px solid #FAD2CF" 
                : "1px solid #D8C1FF",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              zIndex: 2000,
              minWidth: "320px",
              maxWidth: "450px",
              fontSize: "14px",
              fontWeight: 600,
              animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <span style={{ fontSize: "18px" }}>
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span style={{ flex: 1, color: "var(--text-primary)" }}>{toast.message}</span>
            <button
              onClick={() => setToast(current => current ? { ...current, isOpen: false } : null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "16px",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
