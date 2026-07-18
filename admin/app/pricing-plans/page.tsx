"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { TableSkeleton } from "@/components/SkeletonLoaders";
import { Edit2, Settings, ToggleRight } from "lucide-react";
import BillingCyclesManager from "@/components/BillingCyclesManager";

interface BillingCycle {
  id: number;
  plan_id: number;
  billing_cycle: string;
  monthly_price: number;
  discount_percent: number;
  display_price: string;
  is_active: boolean;
}

interface PricingPlan {
  id: number;
  name: string;
  itineraries_limit: number;
  leads_limit: number;
  vouchers_limit: number;
  bills_limit: number;
  team_members_limit: number;
  storage_gb: number;
  trial_days: number;
  is_active: boolean;
  // Prices live on billing cycles, not on the plan itself
  billing_cycles?: BillingCycle[];
}

function monthlyCycleOf(plan: PricingPlan): BillingCycle | undefined {
  return plan.billing_cycles?.find((c) => c.billing_cycle === "monthly" && c.is_active);
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
  const [billingCyclesModal, setBillingCyclesModal] = useState<{
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
  const { pagination, handlers } = usePagination(0);

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
      monthly_price: monthlyCycleOf(plan)?.monthly_price ?? 0,
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
      // The price is stored on the plan's "monthly" billing cycle, not the
      // plan row itself — keep that cycle in sync with the form's price.
      const monthlyPayload = {
        billing_cycle: "monthly",
        monthly_price: formData.monthly_price,
        discount_percent: 0,
        display_price: `₹${formData.monthly_price.toLocaleString("en-IN")}/month`,
      };

      if (drawerMode === "create") {
        const created = await SuperAdminAPI.createPricingPlan(formData);
        if (formData.monthly_price > 0) {
          await SuperAdminAPI.createBillingCycle(created.id, monthlyPayload);
        }
        showToast("Pricing plan created successfully", "success");
      } else if (editingId) {
        await SuperAdminAPI.updatePricingPlan(editingId, formData);
        const existingMonthly = plans
          .find((p) => p.id === editingId)
          ?.billing_cycles?.find((c) => c.billing_cycle === "monthly");
        if (existingMonthly) {
          if (existingMonthly.monthly_price !== formData.monthly_price) {
            await SuperAdminAPI.updateBillingCycle(existingMonthly.id, {
              ...monthlyPayload,
              discount_percent: existingMonthly.discount_percent,
            });
          }
        } else if (formData.monthly_price > 0) {
          await SuperAdminAPI.createBillingCycle(editingId, monthlyPayload);
        }
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
      <div style={{ padding: "28px" }}>
        <TableSkeleton rows={5} />
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

      {/* Pricing Plans Table */}
      {(() => {
        const columns: DataTableColumn<PricingPlan>[] = [
          { key: "name", header: "Plan Name" },
          {
            key: "billing_cycles",
            header: "Monthly Price",
            align: "center",
            render: (_value, plan) => {
              const monthly = monthlyCycleOf(plan);
              if (monthly && monthly.monthly_price > 0) {
                return (
                  <span className="font-bold text-blue-600">
                    ₹{monthly.monthly_price.toLocaleString("en-IN")}
                    <span className="text-xs text-slate-600 font-normal">/mo</span>
                  </span>
                );
              }
              if (plan.trial_days > 0 || monthly?.monthly_price === 0) {
                return (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                    Free
                  </span>
                );
              }
              const anyCycle = plan.billing_cycles?.find((c) => c.is_active);
              if (anyCycle) {
                return <span className="text-sm">{anyCycle.display_price}</span>;
              }
              return (
                <span className="text-xs text-slate-400 italic" title="Set a price via the Billing Cycles action">
                  Not set
                </span>
              );
            },
          },
          {
            key: "itineraries_limit",
            header: "Itineraries",
            align: "center",
            render: (value) => (value === -1 ? <span className="text-lg font-light">∞</span> : value),
          },
          {
            key: "leads_limit",
            header: "Leads",
            align: "center",
            render: (value) => (value === -1 ? <span className="text-lg font-light">∞</span> : value),
          },
          {
            key: "vouchers_limit",
            header: "Vouchers",
            align: "center",
            render: (value) => (value === -1 ? <span className="text-lg font-light">∞</span> : value),
          },
          {
            key: "bills_limit",
            header: "Bills",
            align: "center",
            render: (value) => (value === -1 ? <span className="text-lg font-light">∞</span> : value),
          },
          {
            key: "team_members_limit",
            header: "Team Limit",
            align: "center",
            render: (value) =>
              value === -1 ? <span className="text-lg font-light">∞</span> : `${value} users`,
          },
          {
            key: "storage_gb",
            header: "Storage",
            align: "center",
            render: (value) =>
              value === -1 ? <span className="text-lg font-light">∞</span> : `${value} GB`,
          },
          {
            key: "trial_days",
            header: "Trial",
            align: "center",
            render: (value) =>
              value === 0 ? (
                <span className="text-sm text-slate-500 italic">No Trial</span>
              ) : (
                <span className="font-semibold">{value} days</span>
              ),
          },
          {
            key: "is_active",
            header: "Status",
            align: "center",
            render: (value) => (
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  value
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {value ? "Active" : "Inactive"}
              </span>
            ),
          },
        ];

        const actions = [
          {
            id: "cycles",
            icon: <Settings className="w-4 h-4" />,
            label: "Billing Cycles",
            tooltip: "Manage billing cycles",
            onClick: (plan: PricingPlan) =>
              setBillingCyclesModal({ isOpen: true, plan }),
          },
          {
            id: "edit",
            icon: <Edit2 className="w-4 h-4" />,
            label: "Edit",
            onClick: (plan: PricingPlan) => handleOpenEdit(plan),
          },
          {
            id: "toggle",
            icon: <ToggleRight className="w-4 h-4" />,
            label: "Toggle Status",
            variant: "warning" as const,
            onClick: (plan: PricingPlan) => handleToggleStatus(plan),
          },
        ];

        return (
          <DataTable<PricingPlan>
            columns={columns}
            data={plans}
            actions={actions as any}
            pagination={{ ...pagination, total: plans.length }}
            onPaginationChange={handlers.onPaginationChange}
            isLoading={loading}
            emptyMessage="No pricing plans found"
            emptyIcon="💰"
            compact={false}
            striped={true}
            hoverable={true}
          />
        );
      })()}

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

      {/* Billing Cycles Manager Modal */}
      {billingCyclesModal.isOpen && billingCyclesModal.plan && (
        <BillingCyclesManager
          planId={billingCyclesModal.plan.id}
          planName={billingCyclesModal.plan.name}
          onClose={() => setBillingCyclesModal({ isOpen: false, plan: null })}
        />
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
