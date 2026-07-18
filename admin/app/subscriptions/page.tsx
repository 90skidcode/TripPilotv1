"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { TableSkeleton } from "@/components/SkeletonLoaders";
import ExtendSubscriptionModal from "@/components/ExtendSubscriptionModal";
import RecordPaymentModal from "@/components/RecordPaymentModal";

interface Subscription {
  subscription_id: number | null;
  org_id: number;
  org_name: string;
  plan_id: number | null;
  plan_name: string | null;
  billing_cycle: string | null;
  status: string;
  effective_status: string;
  start_date: string | null;
  renewal_date: string | null;
  trial_ends_at: string | null;
  days_left: number | null;
  last_extended_at: string | null;
  pending_plan_name: string | null;
}

interface DueInvoice {
  id: number;
  org_id: number;
  org_name: string | null;
  invoice_type: string;
  plan_name: string | null;
  billing_cycle: string | null;
  period_start: string | null;
  period_end: string | null;
  amount: number;
  status: string;
  due_date: string | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [dueInvoices, setDueInvoices] = useState<DueInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "trialing" | "active" | "past_due" | "expired">("all");
  const [extending, setExtending] = useState<Subscription | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<DueInvoice | null>(null);
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
      const [subs, invoices] = await Promise.all([
        SuperAdminAPI.getSubscriptions(),
        SuperAdminAPI.getInvoices("due"),
      ]);
      setSubscriptions(subs);
      setDueInvoices(invoices);
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
        return { bg: "#dcfce7", color: "#15803d", text: "Active" };
      case "trialing":
        return { bg: "#E0F2FE", color: "#0369a1", text: "Trial" };
      case "past_due":
        return { bg: "#fef3c7", color: "#92400e", text: "Past Due" };
      case "expired":
      case "cancelled":
        return { bg: "#fee2e2", color: "#991b1b", text: status === "expired" ? "Expired" : "Cancelled" };
      case "no_subscription":
        return { bg: "#f1f5f9", color: "#475569", text: "No Subscription" };
      default:
        return { bg: "#f1f5f9", color: "#475569", text: status };
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === "all") return true;
    return sub.effective_status === filter;
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
            Extend subscriptions manually after collecting payment — there is no auto-pay
          </p>
        </div>
        <Link href="/pricing-plans" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back to Plans
        </Link>
      </div>

      {/* Renewals due — the collection queue */}
      {dueInvoices.length > 0 && (
        <div
          style={{
            border: "1px solid #fcd34d",
            background: "#fffbeb",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "24px",
          }}
        >
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#92400e", marginBottom: "12px" }}>
            Renewals due ({dueInvoices.length}) — collect payment and record it here
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {dueInvoices.map((inv) => {
              const overdue = inv.due_date && new Date(inv.due_date) < new Date();
              return (
                <div
                  key={inv.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: "14px" }}>{inv.org_name || `Org #${inv.org_id}`}</span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                      {" "}· {inv.plan_name} {inv.billing_cycle && `(${inv.billing_cycle.replace("_", "-")})`}
                      {inv.invoice_type === "upgrade" && " · upgrade charge"}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: "14px" }}>₹{inv.amount.toLocaleString("en-IN")}</span>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: overdue ? "var(--danger)" : "var(--text-secondary)" }}>
                    {overdue ? "Overdue since " : "Due "}
                    {inv.due_date ? formatDate(inv.due_date) : "—"}
                  </span>
                  <button
                    onClick={() => setPayingInvoice(inv)}
                    style={{
                      padding: "6px 14px",
                      background: "#10b981",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Record Payment
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
        {(["all", "trialing", "active", "past_due", "expired"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            style={{
              padding: "8px 16px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
              color: filter === status ? "var(--brand)" : "var(--text-secondary)",
              borderBottom: filter === status ? "2px solid var(--brand)" : "none",
              marginBottom: "-13px",
              paddingBottom: "21px",
            }}
          >
            {status === "all" ? "All" : getStatusBadge(status).text}
            <span style={{ marginLeft: "6px", opacity: 0.6 }}>
              ({subscriptions.filter(s => status === "all" || s.effective_status === status).length})
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
            render: (value, sub) => (
              <Link href={`/agencies/${sub.org_id}`} style={{ color: "var(--brand)", fontWeight: 600 }}>
                {value || `Org #${sub.org_id}`}
              </Link>
            ),
          },
          {
            key: "plan_name",
            header: "Plan",
            render: (value, sub) => (
              <span>
                {value || (sub.plan_id ? `Plan #${sub.plan_id}` : "—")}
                {sub.pending_plan_name && (
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)" }}>
                    → {sub.pending_plan_name} at renewal
                  </span>
                )}
              </span>
            ),
          },
          {
            key: "billing_cycle",
            header: "Billing Cycle",
            align: "center",
            render: (value) => value ? value.replace("_", "-").charAt(0).toUpperCase() + value.replace("_", "-").slice(1) : "—",
          },
          {
            key: "renewal_date",
            header: "Renewal Date",
            align: "center",
            render: (value, sub) => value ? formatDate(value) : sub.trial_ends_at ? formatDate(sub.trial_ends_at) : "—",
          },
          {
            key: "days_left",
            header: "Days Left",
            align: "center",
            render: (value, sub) => {
              if (value == null) return "—";
              const critical = sub.effective_status === "expired" || value <= 3;
              return (
                <span style={{ fontWeight: 600, color: critical ? "var(--error)" : "var(--text-primary)" }}>
                  {sub.effective_status === "expired" ? "0" : value}
                </span>
              );
            },
          },
          {
            key: "last_extended_at",
            header: "Last Extended",
            align: "center",
            render: (value) => value ? formatDate(value) : "—",
          },
          {
            key: "effective_status",
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
          {
            key: "org_id",
            header: "Actions",
            align: "center",
            render: (_value, sub) => (
              <button
                onClick={() => setExtending(sub)}
                style={{
                  padding: "6px 14px",
                  background: "var(--brand)",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Extend
              </button>
            ),
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
              {subscriptions.filter(s => s.effective_status === "active").length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Past Due</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#92400e", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.effective_status === "past_due").length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Expired</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "var(--danger)", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.effective_status === "expired").length}
            </p>
          </div>
          <div style={{ background: "white", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)" }}>
            <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: 0 }}>Trialing</p>
            <p style={{ fontSize: "24px", fontWeight: 700, color: "#0369a1", margin: "8px 0 0 0" }}>
              {subscriptions.filter(s => s.effective_status === "trialing").length}
            </p>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingInvoice && (
        <RecordPaymentModal
          invoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onSuccess={() => {
            showToast(`Payment recorded for ${payingInvoice.org_name}`);
            loadSubscriptions();
          }}
        />
      )}

      {/* Extend Modal */}
      {extending && (
        <ExtendSubscriptionModal
          agencyId={extending.org_id}
          agencyName={extending.org_name}
          currentPlanId={extending.plan_id}
          currentBillingCycle={extending.billing_cycle}
          renewalDate={extending.renewal_date}
          trialEndsAt={extending.trial_ends_at}
          onClose={() => setExtending(null)}
          onSuccess={() => {
            showToast(`Subscription extended for ${extending.org_name}`);
            loadSubscriptions();
          }}
        />
      )}
    </div>
  );
}
