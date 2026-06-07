"use client";
import { useState } from "react";
import { followupsApi } from "@/lib/api";

interface Props {
  followups: any[];
  onUpdated: () => void;
  onDeleted: () => void;
  canWrite?: boolean;
}

export default function FollowupList({ followups, onUpdated, onDeleted, canWrite = true }: Props) {
  const [updating, setUpdating] = useState<number | null>(null);

  async function handleMarkComplete(id: number) {
    try {
      setUpdating(id);
      await followupsApi.update(id, { status: "completed" });
      onUpdated();
    } catch (err) {
      console.error("Failed to update follow-up:", err);
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this follow-up?")) return;
    try {
      setUpdating(id);
      await followupsApi.delete(id);
      onDeleted();
    } catch (err) {
      console.error("Failed to delete follow-up:", err);
    } finally {
      setUpdating(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {followups.map((followup) => {
        const scheduledDate = new Date(followup.scheduled_date);
        const now = new Date();
        const isOverdue = scheduledDate < now && followup.status === "pending";
        const isUpcoming = scheduledDate >= now && followup.status === "pending";

        return (
          <div
            key={followup.id}
            style={{
              padding: 12,
              border: `1px solid ${isOverdue ? "#fee2e2" : "var(--border)"}`,
              borderLeft: isOverdue ? "4px solid #dc2626" : "4px solid transparent",
              borderRadius: "8px",
              background: isOverdue ? "#fef2f2" : "var(--card)",
              transition: "all 0.2s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>
              <div style={{ flex: 1 }}>
                {/* Date & Status */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                    {scheduledDate.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>
                    {scheduledDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background:
                        followup.status === "completed"
                          ? "#dcfce7"
                          : isOverdue
                          ? "#fee2e2"
                          : isUpcoming
                          ? "#fef9c3"
                          : "#f3f4f6",
                      color:
                        followup.status === "completed"
                          ? "#16a34a"
                          : isOverdue
                          ? "#dc2626"
                          : isUpcoming
                          ? "#ca8a04"
                          : "#6b7280",
                    }}
                  >
                    {followup.status === "completed"
                      ? "✓ Done"
                      : isOverdue
                      ? "⚠ Overdue"
                      : isUpcoming
                      ? "⏰ Upcoming"
                      : "Rescheduled"}
                  </span>
                </div>

                {/* Notes */}
                {followup.notes && (
                  <p style={{ fontSize: 14, color: "var(--text-primary)", margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                    {followup.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              {canWrite && (
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {followup.status === "pending" && (
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => handleMarkComplete(followup.id)}
                      disabled={updating === followup.id}
                      title="Mark as complete"
                      style={{ fontSize: 14 }}
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    onClick={() => handleDelete(followup.id)}
                    disabled={updating === followup.id}
                    title="Delete"
                    style={{ fontSize: 14, color: "var(--danger)" }}
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
