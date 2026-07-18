"use client";

import { useEffect, useState } from "react";
import { SuperAdminAPI } from "@/lib/api";

interface HistoryEvent {
  id: number;
  action: string;
  plan_name: string | null;
  billing_cycle: string | null;
  old_renewal_date: string | null;
  new_renewal_date: string | null;
  amount: number | null;
  payment_mode: string | null;
  payment_reference: string | null;
  note: string | null;
  actor_name: string | null;
  created_at: string | null;
}

interface SubscriptionTimelineProps {
  agencyId: number;
  refreshKey?: number;
}

const ACTION_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  extended: { bg: "#dcfce7", color: "#166534", label: "Extended" },
  created: { bg: "#e0f2fe", color: "#0369a1", label: "Created" },
  plan_changed: { bg: "#ede9fe", color: "#6d28d9", label: "Plan Changed" },
  activated: { bg: "#e0f2fe", color: "#0369a1", label: "Activated" },
  expired: { bg: "#fee2e2", color: "#991b1b", label: "Expired" },
  cancelled: { bg: "#f1f5f9", color: "#475569", label: "Cancelled" },
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

function formatDate(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateString: string | null) {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SubscriptionTimeline({ agencyId, refreshKey }: SubscriptionTimelineProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    SuperAdminAPI.getSubscriptionHistory(agencyId)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [agencyId, refreshKey]);

  if (loading) {
    return (
      <div style={{ padding: "16px", color: "#64748b", fontSize: "13px" }}>
        Loading subscription history...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "24px",
          background: "#f8fafc",
          borderRadius: "8px",
          color: "#64748b",
          fontSize: "13px",
        }}
      >
        No subscription events yet.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {events.map((event, idx) => {
        const style = ACTION_STYLES[event.action] || { bg: "#f1f5f9", color: "#475569", label: event.action };
        return (
          <div key={event.id} style={{ display: "flex", gap: "12px" }}>
            {/* Timeline rail */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: style.color,
                  marginTop: "6px",
                  flexShrink: 0,
                }}
              />
              {idx < events.length - 1 && (
                <div style={{ width: "2px", flex: 1, background: "#e2e8f0" }} />
              )}
            </div>

            {/* Event card */}
            <div style={{ flex: 1, paddingBottom: idx < events.length - 1 ? "16px" : 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 600,
                    background: style.bg,
                    color: style.color,
                  }}
                >
                  {style.label}
                </span>
                {event.plan_name && (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1e293b" }}>
                    {event.plan_name}
                    {event.billing_cycle && (
                      <span style={{ fontWeight: 400, color: "#64748b", textTransform: "capitalize" }}>
                        {" "}· {event.billing_cycle.replace("_", "-")}
                      </span>
                    )}
                  </span>
                )}
                <span style={{ fontSize: "12px", color: "#94a3b8", marginLeft: "auto" }}>
                  {formatDateTime(event.created_at)}
                </span>
              </div>

              {(event.old_renewal_date || event.new_renewal_date) && (
                <div style={{ fontSize: "13px", color: "#475569", marginTop: "6px" }}>
                  {event.action === "expired"
                    ? `Expired on ${formatDate(event.old_renewal_date)}`
                    : event.old_renewal_date
                      ? `Valid until ${formatDate(event.old_renewal_date)} → ${formatDate(event.new_renewal_date)}`
                      : `Valid until ${formatDate(event.new_renewal_date)}`}
                </div>
              )}

              {(event.amount != null || event.payment_mode || event.payment_reference) && (
                <div style={{ fontSize: "13px", color: "#166534", marginTop: "4px" }}>
                  {event.amount != null && <strong>₹{event.amount.toLocaleString("en-IN")}</strong>}
                  {event.payment_mode && <> · {PAYMENT_MODE_LABELS[event.payment_mode] || event.payment_mode}</>}
                  {event.payment_reference && <> · Ref: {event.payment_reference}</>}
                </div>
              )}

              {event.note && (
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px", fontStyle: "italic" }}>
                  {event.note}
                </div>
              )}

              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                by {event.actor_name || "System"}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
