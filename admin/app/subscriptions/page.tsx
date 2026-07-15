"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";

interface Subscription {
  id: number;
  org_id: number;
  plan_id: number;
  billing_cycle: string;
  status: string;
  start_date: string;
  renewal_date: string;
  trial_ends_at: string | null;
  plan_name?: string;
  org_name?: string;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "expired" | "trial">("all");
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

    loadSubscriptions();
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

  async function loadSubscriptions() {
    try {
      const plans = await SuperAdminAPI.getAllPricingPlans();
      const agencies = await SuperAdminAPI.getAgencies();

      setSubscriptions([]);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
      showToast("Failed to load subscriptions", "error");
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "var(--success-light)", color: "var(--success)", text: "Active" };
      case "trial":
        return { bg: "#E0F2FE", color: "#0369a1", text: "Trial" };
      case "expired":
        return { bg: "var(--error-light)", color: "var(--error)", text: "Expired" };
      default:
        return { bg: "var(--bg-hover)", color: "var(--text-secondary)", text: status };
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === "all") return true;
    return sub.status === filter;
  });

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading subscriptions...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
            Subscriptions
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            View and manage all organization subscriptions
          </p>
        </div>
        <Link href="/pricing-plans" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back to Plans
        </Link>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        {["all", "active", "expired", "trial"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status as any)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              color: filter === status ? "var(--brand)" : "var(--text-secondary)",
              borderBottom: filter === status ? "2px solid var(--brand)" : "none",
              textTransform: "capitalize",
              marginBottom: "-13px",
              paddingBottom: "21px",
            }}
          >
            {status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1)}
            <span style={{ marginLeft: "6px", opacity: 0.6 }}>
              ({subscriptions.filter(s => status === "all" || s.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && toast.isOpen && (
        <div
          style={{
            padding: "12px 16px",
            margin: "12px 0",
            borderRadius: "8px",
            background: toast.type === "error" ? "#fee2e2" : toast.type === "success" ? "#dcfce7" : "#dbeafe",
            color: toast.type === "error" ? "#991b1b" : toast.type === "success" ? "#166534" : "#0c4a6e",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Subscriptions Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
            <thead>
              <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Organization
                </th>
                <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Plan
                </th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Billing Cycle
                </th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Started
                </th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Renewal Date
                </th>
                <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
                    <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>No subscriptions found</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {filter === "all"
                        ? "No subscriptions yet. Organizations will appear here once they subscribe."
                        : `No ${filter} subscriptions found.`}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => {
                  const badgeStyle = getStatusBadge(sub.status);
                  return (
                    <tr
                      key={sub.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        transition: "background 0.2s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-primary)" }}>
                        {sub.org_name || `Org #${sub.org_id}`}
                      </td>
                      <td style={{ padding: "16px 20px", color: "var(--text-primary)" }}>
                        {sub.plan_name || `Plan #${sub.plan_id}`}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", textTransform: "capitalize", color: "var(--text-primary)", fontWeight: 500 }}>
                        {sub.billing_cycle || "—"}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                        {formatDate(sub.start_date)}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                        {sub.renewal_date ? formatDate(sub.renewal_date) : sub.trial_ends_at ? formatDate(sub.trial_ends_at) : "—"}
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 12px",
                            background: badgeStyle.bg,
                            color: badgeStyle.color,
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: 600,
                            textTransform: "capitalize",
                          }}
                        >
                          {badgeStyle.text}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      {subscriptions.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "24px" }}>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Total Subscriptions</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)", margin: "8px 0 0 0" }}>
              {subscriptions.length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Active</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--success)", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.status === "active").length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Expired</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--error)", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.status === "expired").length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Trial</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#0369a1", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.status === "trial").length}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
