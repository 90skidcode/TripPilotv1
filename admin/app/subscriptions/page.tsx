"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { TableSkeleton } from "@/components/SkeletonLoaders";

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
  const { pagination, handlers } = usePagination(0);

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
      {(() => {
        const columns: DataTableColumn<Subscription>[] = [
          {
            key: "org_name",
            header: "Organization",
            render: (value, sub) => value || `Org #${sub.org_id}`,
          },
          {
            key: "plan_name",
            header: "Plan",
            render: (value, sub) => value || `Plan #${sub.plan_id}`,
          },
          {
            key: "billing_cycle",
            header: "Billing Cycle",
            align: "center",
            render: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : "—",
          },
          {
            key: "start_date",
            header: "Started",
            align: "center",
            render: (value) => formatDate(value),
          },
          {
            key: "renewal_date",
            header: "Renewal Date",
            align: "center",
            render: (value, sub) => value ? formatDate(value) : sub.trial_ends_at ? formatDate(sub.trial_ends_at) : "—",
          },
          {
            key: "status",
            header: "Status",
            align: "center",
            render: (value) => {
              const badgeStyle = getStatusBadge(value);
              return (
                <span
                  className="inline-block px-3 py-1 rounded text-xs font-semibold"
                  style={{
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                  }}
                >
                  {badgeStyle.text}
                </span>
              );
            },
          },
        ];

        return (
          <DataTable<Subscription>
            columns={columns}
            data={filteredSubscriptions}
            pagination={{ ...pagination, total: filteredSubscriptions.length }}
            onPaginationChange={handlers.onPaginationChange}
            isLoading={loading}
            emptyMessage={
              filter === "all"
                ? "No subscriptions yet. Organizations will appear here once they subscribe."
                : `No ${filter} subscriptions found.`
            }
            emptyIcon="📋"
            compact={false}
            striped={true}
            hoverable={true}
          />
        );
      })()}

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
