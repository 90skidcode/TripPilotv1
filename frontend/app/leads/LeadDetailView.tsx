"use client";
import { useState, useEffect } from "react";
import { leadsApi, followupsApi, leadCostingApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import AddFollowupModal from "./AddFollowupModal";
import FollowupList from "./FollowupList";

interface Props {
  leadId: number;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

export default function LeadDetailView({ leadId, onClose, onLeadUpdated }: Props) {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("leads", "write");
  const [lead, setLead] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [otherLeads, setOtherLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [costing, setCosting] = useState({ b2b_cost: 0, customer_price: 0, notes: "" });
  const [costingSaving, setCostingSaving] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchFollowups();
    fetchCosting();
  }, [leadId]);

  async function fetchLead() {
    try {
      const data = await leadsApi.get(leadId);
      setLead(data);
      if (data?.customer_id) {
        fetchOtherLeads(data.customer_id, data.id);
      }
    } catch (err) {
      console.error("Failed to fetch lead:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOtherLeads(customerId: number, currentLeadId: number) {
    try {
      const data = await leadsApi.list({ customer_id: customerId });
      if (data?.items) {
        setOtherLeads(data.items.filter((item: any) => item.id !== currentLeadId));
      }
    } catch (err) {
      console.error("Failed to fetch other leads:", err);
    }
  }

  async function fetchFollowups() {
    try {
      const data = await followupsApi.listForLead(leadId);
      setFollowups(data.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime()));
    } catch (err) {
      console.error("Failed to fetch followups:", err);
    }
  }

  async function fetchCosting() {
    try {
      const data = await leadCostingApi.get(leadId);
      setCosting({ b2b_cost: data.b2b_cost || 0, customer_price: data.customer_price || 0, notes: data.notes || "" });
    } catch { /* no costing yet */ }
  }

  async function saveCosting() {
    setCostingSaving(true);
    try {
      await leadCostingApi.upsert(leadId, costing);
    } catch (err) {
      console.error("Failed to save costing:", err);
    } finally {
      setCostingSaving(false);
    }
  }

  function handleFollowupAdded() {
    setShowAddFollowup(false);
    fetchFollowups();
  }

  function handleFollowupUpdated() {
    fetchFollowups();
  }

  function handleFollowupDeleted() {
    fetchFollowups();
  }

  if (loading) {
    return (
      <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="side-panel">
          <div className="side-panel-header">
            <h2 className="side-panel-title">Lead Details</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--text-muted)" }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="side-panel">
          <div className="side-panel-header">
            <h2 className="side-panel-title">Lead Details</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>
          <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--danger)" }}>
            Lead not found
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="side-panel">
          <div className="side-panel-header">
            <div>
              <h2 className="side-panel-title">{lead.name}</h2>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Lead Details & Follow-ups</p>
            </div>
            <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
          </div>

          <div className="side-panel-content" style={{ padding: "24px" }}>
            {/* Contact & Trip Details - Side by Side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 32 }}>
              {/* Customer Info Section */}
              <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                Customer Information
              </h3>
              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Name</label>
                  <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.customer?.name || "—"}</p>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Phone</label>
                  <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.customer?.phone || "—"}</p>
                </div>
                {lead.customer?.email && (
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Email</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.customer.email}</p>
                  </div>
                )}
                {lead.customer?.whatsapp_number && (
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>WhatsApp</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.customer.whatsapp_number}</p>
                  </div>
                )}
              </div>

              {/* Other inquiries of this customer */}
              {otherLeads.length > 0 && (
                <div style={{ marginTop: 24, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    🔄 Other Leads ({otherLeads.length})
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                    {otherLeads.map((ol: any) => (
                      <div
                        key={ol.id}
                        style={{
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid var(--border)",
                          fontSize: "12px",
                          backgroundColor: "rgba(var(--color-muted), 0.1)"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}>
                          <span>📍 {ol.destination || "General Inquiry"}</span>
                          <span style={{ color: "var(--text-secondary)" }}>
                            {ol.created_at ? new Date(ol.created_at).toLocaleDateString("en-IN") : ""}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, color: "var(--text-secondary)" }}>
                          <span>Source: {ol.source || "—"}</span>
                          <span className="badge badge-teal" style={{ fontSize: "10px", padding: "1px 6px" }}>{ol.stage?.replace("_", " ")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* B2B Partner Section */}
            {lead.b2b_partner && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                  🤝 B2B Partner
                </h3>
                <div style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "rgba(var(--color-muted), 0.1)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{lead.b2b_partner.company_name}</span>
                    <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 8px", textTransform: "uppercase" }}>
                      {lead.b2b_partner.category || "partner"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Costing Section (only for won / qualified_hot / qualified_warm) */}
            {(lead.stage === "won" || lead.stage === "qualified_hot" || lead.stage === "qualified_warm") && (
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                  💰 Costing
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 4 }}>B2B Cost (₹)</label>
                    <input
                      type="number"
                      className="input"
                      value={costing.b2b_cost}
                      onChange={(e) => setCosting({ ...costing, b2b_cost: parseFloat(e.target.value) || 0 })}
                      disabled={!canWrite}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 4 }}>Customer Price (₹)</label>
                    <input
                      type="number"
                      className="input"
                      value={costing.customer_price}
                      onChange={(e) => setCosting({ ...costing, customer_price: parseFloat(e.target.value) || 0 })}
                      disabled={!canWrite}
                      style={{ width: "100%" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, display: "block", marginBottom: 4 }}>Margin (₹)</label>
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      fontSize: 15,
                      fontWeight: 700,
                      color: (costing.customer_price - costing.b2b_cost) >= 0 ? "#15803d" : "#dc2626",
                      background: (costing.customer_price - costing.b2b_cost) >= 0 ? "#dcfce7" : "#fee2e2",
                    }}>
                      ₹{(costing.customer_price - costing.b2b_cost).toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
                {canWrite && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={saveCosting}
                    disabled={costingSaving}
                    style={{ fontSize: 12 }}
                  >
                    {costingSaving ? "Saving..." : "✔ Save Costing"}
                  </button>
                )}
              </div>
            )}

            {/* Lead Details Section */}
            <div>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                  Trip Details
                </h3>
                <div style={{ display: "grid", gap: 16 }}>
                  {lead.destination && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Destination</label>
                      <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.destination}</p>
                    </div>
                  )}
                  {lead.trip_type && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Trip Type</label>
                      <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.trip_type}</p>
                    </div>
                  )}
                  {lead.budget && (
                    <div>
                      <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Budget</label>
                      <p style={{ fontSize: 15, fontWeight: 600, marginTop: 6, color: "var(--text-primary)" }}>{lead.budget}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Follow-ups Section */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.6px" }}>
                  📞 Follow-ups ({followups.length})
                </h3>
                {canWrite && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowAddFollowup(true)}
                    style={{ fontSize: 12 }}
                  >
                    + Add
                  </button>
                )}
              </div>

              {followups.length === 0 ? (
                <div style={{
                  padding: "28px",
                  textAlign: "center",
                  background: "var(--brand-light)",
                  borderRadius: "12px",
                  border: "1px solid #e9d5ff"
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>📞</div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--brand)", marginBottom: 8 }}>
                    No follow-ups scheduled
                  </p>
                  <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: canWrite ? 16 : 0 }}>
                    {canWrite ? "Schedule a follow-up to stay on top of this lead's progress" : "No scheduled follow-up activities."}
                  </p>
                  {canWrite && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddFollowup(true)}
                    >
                      + Schedule First Follow-up
                    </button>
                  )}
                </div>
              ) : (
                <FollowupList
                  followups={followups}
                  onUpdated={handleFollowupUpdated}
                  onDeleted={handleFollowupDeleted}
                  canWrite={canWrite}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {showAddFollowup && (
        <AddFollowupModal
          leadId={leadId}
          onClose={() => setShowAddFollowup(false)}
          onSaved={handleFollowupAdded}
        />
      )}
    </>
  );
}
