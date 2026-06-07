"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { customersApi, leadsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { SkeletonTable } from "@/components/SkeletonLoader";

export default function CustomersPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("leads", "write");

  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Side panel state
  const [showPanel, setShowPanel] = useState<"add" | "edit" | "detail" | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [detailCustomer, setDetailCustomer] = useState<any>(null);
  const [detailLeads, setDetailLeads] = useState<any[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 20 };
      if (search) params.search = search;
      const data = await customersApi.list(params);
      setCustomers(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function openAddPanel() {
    setFormName(""); setFormPhone(""); setFormEmail(""); setFormWhatsapp("");
    setEditingCustomer(null);
    setShowPanel("add");
  }

  function openEditPanel(c: any) {
    setFormName(c.name || ""); setFormPhone(c.phone || "");
    setFormEmail(c.email || ""); setFormWhatsapp(c.whatsapp_number || "");
    setEditingCustomer(c);
    setShowPanel("edit");
  }

  async function openDetailPanel(c: any) {
    setDetailCustomer(c);
    setDetailLeads([]);
    setDetailLoading(true);
    setShowPanel("detail");
    try {
      const data = await leadsApi.list({ customer_id: c.id, per_page: 50 });
      setDetailLeads(data.items || []);
    } catch { /* ignore */ } finally {
      setDetailLoading(false);
    }
  }

  async function handleSave() {
    if (!formName || !formPhone) {
      showToast({ type: "error", message: "Name and Phone are required." });
      return;
    }
    setSaving(true);
    try {
      const payload = { name: formName, phone: formPhone, email: formEmail || null, whatsapp_number: formWhatsapp || null };
      if (showPanel === "edit" && editingCustomer) {
        await customersApi.update(editingCustomer.id, payload);
        showToast({ type: "success", message: "Customer updated!" });
      } else {
        await customersApi.create(payload);
        showToast({ type: "success", message: "Customer created!" });
      }
      setShowPanel(null);
      fetchCustomers();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await customersApi.delete(id);
      showToast({ type: "success", message: "Customer deleted." });
      fetchCustomers();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    }
  }

  return (
    <AppShell title="Customer Master">
      <PageContainer>
        <PageHeader
          title="Customer Master"
          description="Manage all your customers in one place."
          action={canWrite ? <Button variant="primary" onClick={openAddPanel}>+ Add Customer</Button> : undefined}
        />

        <Card>
          <CardContent>
            {/* Search */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <Input
                placeholder="Search by name, phone, email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ maxWidth: 400 }}
                id="customer-search"
              />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{total} customers</span>
            </div>

            {/* Table */}
            {loading && customers.length === 0 ? (
              <SkeletonTable rows={5} />
            ) : customers.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No customers found</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  Customers are created automatically when you add leads, or add one manually.
                </p>
                {canWrite && <Button variant="primary" onClick={openAddPanel}>+ Add Customer</Button>}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 200 }}>Name</th>
                      <th style={{ width: 160 }}>Phone</th>
                      <th style={{ width: 220 }}>Email</th>
                      <th style={{ width: 140 }}>WhatsApp</th>
                      <th style={{ width: 100, textAlign: "center" }}>Leads</th>
                      <th style={{ width: 120 }}>Added On</th>
                      <th style={{ width: 100, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <button
                            onClick={() => openDetailPanel(c)}
                            style={{ background: "none", border: "none", padding: 0, fontWeight: 600, color: "rgb(var(--color-primary))", cursor: "pointer", textDecoration: "underline" }}
                          >{c.name}</button>
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{c.phone}</td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{c.email || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{c.whatsapp_number || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${c.lead_count > 0 ? "badge-blue" : "badge-gray"}`}>{c.lead_count}</span>
                        </td>
                        <td style={{ fontSize: 13, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openDetailPanel(c)} title="View Details">👁️</button>
                            {canWrite && (
                              <>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEditPanel(c)} title="Edit">✏️</button>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(c.id)} title="Delete" style={{ color: "var(--danger)" }}>🗑️</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 20 }}>
                <Button variant="ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</Button>
                <span style={{ display: "flex", alignItems: "center", fontSize: 13, color: "var(--text-secondary)" }}>
                  Page {page} of {pages}
                </span>
                <Button variant="ghost" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add / Edit Side Panel */}
        {(showPanel === "add" || showPanel === "edit") && (
          <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowPanel(null)}>
            <div className="side-panel">
              <div className="side-panel-header">
                <h2 className="side-panel-title">{showPanel === "edit" ? "Edit Customer" : "Add Customer"}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(null)}>✕</button>
              </div>
              <div className="side-panel-content" style={{ padding: 24 }}>
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Full Name *</label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Deepika Gandhi" id="customer-name" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Phone *</label>
                    <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g. +91 98765 43210" id="customer-phone" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Email</label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. deepika@gmail.com" id="customer-email" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>WhatsApp Number</label>
                    <Input value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="e.g. +91 98765 43210" id="customer-whatsapp" />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => setShowPanel(null)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : showPanel === "edit" ? "Update Customer" : "Add Customer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Side Panel */}
        {showPanel === "detail" && detailCustomer && (
          <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowPanel(null)}>
            <div className="side-panel">
              <div className="side-panel-header">
                <div>
                  <h2 className="side-panel-title">{detailCustomer.name}</h2>
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Customer Details & Lead History</p>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(null)}>✕</button>
              </div>
              <div className="side-panel-content" style={{ padding: 24 }}>
                {/* Customer Info */}
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                  Contact Information
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Phone</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{detailCustomer.phone}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Email</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{detailCustomer.email || "—"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>WhatsApp</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>{detailCustomer.whatsapp_number || "—"}</p>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>Since</label>
                    <p style={{ fontSize: 15, fontWeight: 600, marginTop: 4 }}>
                      {detailCustomer.created_at ? new Date(detailCustomer.created_at).toLocaleDateString("en-IN") : "—"}
                    </p>
                  </div>
                </div>

                {/* Lead History */}
                <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>
                  📋 Lead History ({detailLeads.length})
                </h3>
                {detailLoading ? (
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading leads...</p>
                ) : detailLeads.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", borderRadius: 8, border: "1px dashed var(--border)", color: "var(--text-muted)" }}>
                    No leads found for this customer
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {detailLeads.map((lead: any) => (
                      <div key={lead.id} style={{ padding: 14, borderRadius: 8, border: "1px solid var(--border)", backgroundColor: "rgba(var(--color-muted), 0.1)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>📍 {lead.destination || "General Inquiry"}</span>
                          <span className={`badge ${lead.stage === "won" ? "badge-green" : lead.stage === "lost" ? "badge-gray" : "badge-teal"}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                            {lead.stage?.replace("_", " ")}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                          <span>Source: {lead.source || "—"} | Budget: {lead.budget || "—"}</span>
                          <span>{lead.created_at ? new Date(lead.created_at).toLocaleDateString("en-IN") : ""}</span>
                        </div>
                        {lead.b2b_partner && (
                          <div style={{ marginTop: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                            🤝 B2B: {lead.b2b_partner.company_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
