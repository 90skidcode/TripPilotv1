"use client";
import { stageLabel, sourceLabel } from "@/components/Sidebar";
import { SkeletonTable } from "@/components/SkeletonLoader";

interface Props {
  leads: any[];
  loading: boolean;
  onEdit: (lead: any) => void;
  onDelete: (id: number) => void;
  onViewDetails: (id: number) => void;
  onAdd?: () => void;
  canWrite?: boolean;
  onSearchCustomer?: (query: string) => void;
}

export default function LeadTable({
  leads,
  loading,
  onEdit,
  onDelete,
  onViewDetails,
  onAdd,
  canWrite,
  onSearchCustomer,
}: Props) {
  if (loading && leads.length === 0) {
    return <SkeletonTable rows={5} />;
  }

  if (!leads.length) {
    return (
      <div className="empty-state" style={{ padding: "80px 20px" }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>👥</div>
        <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-primary)" }}>
          No leads found
        </h3>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
          Get started by adding your first lead or adjusting your filters
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {canWrite && onAdd && (
            <button className="btn btn-primary btn-sm" onClick={onAdd}>+ Add Lead</button>
          )}
        </div>
      </div>
    );
  }

  // Count leads per customer (by phone or email) on the current page to detect duplicates
  const customerCounts = leads.reduce((acc: Record<string, number>, item) => {
    const phone = item.customer?.phone;
    const email = item.customer?.email;
    if (phone) acc[phone] = (acc[phone] || 0) + 1;
    else if (email) acc[email] = (acc[email] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "40px" }}><input type="checkbox" /></th>
            <th style={{ width: "120px" }}>Date Added</th>
            <th style={{ width: "240px" }}>Lead Name</th>
            <th style={{ width: "180px" }}>Phone</th>
            <th style={{ width: "130px" }}>Source</th>
            <th style={{ width: "130px" }}>Destination</th>
            <th style={{ width: "150px" }}>Stage</th>
            <th style={{ width: "130px" }}>Assigned To</th>
            <th style={{ width: "100px", textAlign: "right" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const stage = stageLabel(lead.stage);
            const customer = lead.customer;
            const phone = customer?.phone;
            const email = customer?.email;
            const isDuplicate = (phone && customerCounts[phone] > 1) || (email && customerCounts[email] > 1);

            return (
              <tr key={lead.id} style={isDuplicate ? { backgroundColor: "rgba(245, 158, 11, 0.04)" } : undefined}>
                <td><input type="checkbox" /></td>
                <td style={{ color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>
                  {lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN") : "—"}
                </td>
                <td>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 600 }}>{customer?.name || "Unknown"}</span>
                      {isDuplicate && (
                        <span 
                          className="badge badge-yellow"
                          title="This customer has multiple inquiries/leads on the current page"
                          style={{ fontSize: "10px", padding: "2px 6px", display: "inline-flex", alignItems: "center", gap: 3 }}
                        >
                          ⚠️ Duplicate
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{customer?.email || "—"}</span>
                      {isDuplicate && onSearchCustomer && (
                        <button
                          onClick={() => onSearchCustomer(phone || email || customer?.name || "")}
                          style={{
                            background: "none",
                            border: "none",
                            padding: "0",
                            color: "rgb(var(--color-primary))",
                            cursor: "pointer",
                            fontSize: "11px",
                            fontWeight: 500,
                            textDecoration: "underline"
                          }}
                          title="Search all leads for this customer"
                        >
                          Show all
                        </button>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span>{customer?.phone || "—"}</span>
                    {customer?.whatsapp_number && (
                      <a
                        href={`https://wa.me/${customer.whatsapp_number?.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open WhatsApp"
                        style={{ fontSize: 16 }}
                      >💬</a>
                    )}
                  </div>
                </td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span title={lead.source}>
                    {sourceLabel(lead.source)} {lead.source ? (lead.source.toLowerCase() === "whatsapp" ? "WhatsApp" : lead.source.charAt(0).toUpperCase() + lead.source.slice(1).toLowerCase()) : "—"}
                  </span>
                </td>
                <td>{lead.destination || "—"}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <span className={`badge ${stage.cls}`}>{stage.label}</span>
                </td>
                <td style={{ color: "var(--text-secondary)", fontSize: 13, whiteSpace: "nowrap" }}>
                  {lead.assigned_to ? `Agent #${lead.assigned_to}` : "Unassigned"}
                </td>
                <td style={{ whiteSpace: "nowrap", textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      onClick={() => onViewDetails(lead.id)}
                      id={`lead-view-${lead.id}`}
                      title="View Details & Follow-ups"
                    >👁️</button>
                    {canWrite && (
                      <>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => onEdit(lead)}
                          id={`lead-edit-${lead.id}`}
                          title="Edit"
                        >✏️</button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          onClick={() => onDelete(lead.id)}
                          id={`lead-delete-${lead.id}`}
                          title="Delete"
                          style={{ color: "var(--danger)" }}
                        >🗑️</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
