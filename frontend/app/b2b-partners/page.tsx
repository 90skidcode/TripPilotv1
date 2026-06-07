"use client";

import { useState, useEffect, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { b2bPartnersApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { SkeletonTable } from "@/components/SkeletonLoader";

const CATEGORIES = [
  { value: "dmc", label: "DMC" },
  { value: "hotel", label: "Hotel" },
  { value: "activity", label: "Activity" },
  { value: "transport", label: "Transport" },
  { value: "visa", label: "Visa" },
  { value: "flights", label: "Flights" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, string> = {
  dmc: "🌍", hotel: "🏨", activity: "🎯", transport: "🚗",
  visa: "📄", flights: "✈️", other: "📦",
};

export default function B2BPartnersPage() {
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("leads", "write");

  const [partners, setPartners] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Side panel
  const [showPanel, setShowPanel] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState({
    company_name: "", contact_person: "", phone: "", email: "",
    gst_number: "", city: "", country: "India", category: "dmc",
    commission_pct: "", notes: "", is_active: true,
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 20 };
      if (search) params.search = search;
      const data = await b2bPartnersApi.list(params);
      setPartners(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  function resetForm() {
    setForm({
      company_name: "", contact_person: "", phone: "", email: "",
      gst_number: "", city: "", country: "India", category: "dmc",
      commission_pct: "", notes: "", is_active: true,
    });
  }

  function openAdd() { resetForm(); setEditing(null); setShowPanel("add"); }

  function openEdit(p: any) {
    setForm({
      company_name: p.company_name || "", contact_person: p.contact_person || "",
      phone: p.phone || "", email: p.email || "", gst_number: p.gst_number || "",
      city: p.city || "", country: p.country || "India", category: p.category || "dmc",
      commission_pct: p.commission_pct != null ? String(p.commission_pct) : "",
      notes: p.notes || "", is_active: p.is_active !== false,
    });
    setEditing(p);
    setShowPanel("edit");
  }

  async function handleSave() {
    if (!form.company_name) {
      showToast({ type: "error", message: "Company name is required." });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        commission_pct: form.commission_pct ? parseFloat(form.commission_pct) : null,
        email: form.email || null,
        gst_number: form.gst_number || null,
        notes: form.notes || null,
      };
      if (showPanel === "edit" && editing) {
        await b2bPartnersApi.update(editing.id, payload);
        showToast({ type: "success", message: "Partner updated!" });
      } else {
        await b2bPartnersApi.create(payload);
        showToast({ type: "success", message: "Partner added!" });
      }
      setShowPanel(null);
      fetchPartners();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this B2B partner?")) return;
    try {
      await b2bPartnersApi.delete(id);
      showToast({ type: "success", message: "Partner deleted." });
      fetchPartners();
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    }
  }

  function setField(key: string, value: any) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AppShell title="B2B Partners">
      <PageContainer>
        <PageHeader
          title="B2B Partners"
          description="Manage DMCs, hotel suppliers, ground operators and other business partners."
        >
          {canWrite && <Button variant="primary" onClick={openAdd}>+ Add Partner</Button>}
        </PageHeader>

        <Card>
          <CardContent>
            <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
              <Input
                placeholder="Search company, contact, city..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                style={{ maxWidth: 400 }}
                id="b2b-search"
              />
              <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{total} partners</span>
            </div>

            {loading && partners.length === 0 ? (
              <SkeletonTable rows={5} />
            ) : partners.length === 0 ? (
              <div style={{ padding: "60px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🤝</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>No B2B partners yet</h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  Add your DMCs, hotel suppliers, and ground operators to link them with won leads.
                </p>
                {canWrite && <Button variant="primary" onClick={openAdd}>+ Add Partner</Button>}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 220 }}>Company</th>
                      <th style={{ width: 160 }}>Contact Person</th>
                      <th style={{ width: 140 }}>Phone</th>
                      <th style={{ width: 110 }}>Category</th>
                      <th style={{ width: 120 }}>City</th>
                      <th style={{ width: 100, textAlign: "center" }}>Commission</th>
                      <th style={{ width: 80, textAlign: "center" }}>Status</th>
                      <th style={{ width: 100, textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.id} style={!p.is_active ? { opacity: 0.5 } : undefined}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span>{CATEGORY_ICONS[p.category] || "📦"}</span>
                            <span style={{ fontWeight: 600 }}>{p.company_name}</span>
                          </div>
                        </td>
                        <td>{p.contact_person || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{p.phone || "—"}</td>
                        <td>
                          <span className="badge badge-blue" style={{ fontSize: 10, padding: "2px 8px", textTransform: "uppercase" }}>
                            {p.category || "—"}
                          </span>
                        </td>
                        <td>{p.city || "—"}</td>
                        <td style={{ textAlign: "center" }}>
                          {p.commission_pct != null ? `${p.commission_pct}%` : "—"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`badge ${p.is_active ? "badge-green" : "badge-gray"}`} style={{ fontSize: 10, padding: "2px 8px" }}>
                            {p.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {canWrite && (
                              <>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(p)} title="Edit">✏️</button>
                                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete" style={{ color: "var(--danger)" }}>🗑️</button>
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
        {showPanel && (
          <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowPanel(null)}>
            <div className="side-panel">
              <div className="side-panel-header">
                <h2 className="side-panel-title">{showPanel === "edit" ? "Edit Partner" : "Add B2B Partner"}</h2>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(null)}>✕</button>
              </div>
              <div className="side-panel-content" style={{ padding: 24 }}>
                <div style={{ display: "grid", gap: 18 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Company Name *</label>
                    <Input value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="e.g. SkyTravel DMC" id="b2b-company" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Contact Person</label>
                      <Input value={form.contact_person} onChange={(e) => setField("contact_person", e.target.value)} placeholder="Name" id="b2b-contact" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Phone</label>
                      <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+91 ..." id="b2b-phone" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Email</label>
                      <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@company.com" id="b2b-email" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>GST Number</label>
                      <Input value={form.gst_number} onChange={(e) => setField("gst_number", e.target.value)} placeholder="GST" id="b2b-gst" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setField("category", e.target.value)}
                        className="input"
                        id="b2b-category"
                        style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, background: "rgb(var(--color-card))", color: "rgb(var(--color-foreground))" }}
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Commission %</label>
                      <Input type="number" step="0.5" value={form.commission_pct} onChange={(e) => setField("commission_pct", e.target.value)} placeholder="e.g. 10" id="b2b-commission" />
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>City</label>
                      <Input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Dubai" id="b2b-city" />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Country</label>
                      <Input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="India" id="b2b-country" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      placeholder="Internal notes about this partner..."
                      rows={3}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 14, resize: "vertical", background: "rgb(var(--color-card))", color: "rgb(var(--color-foreground))" }}
                      id="b2b-notes"
                    />
                  </div>
                  {showPanel === "edit" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} id="b2b-active" />
                      <label htmlFor="b2b-active" style={{ fontSize: 13, fontWeight: 600 }}>Active Partner</label>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "flex-end" }}>
                  <Button variant="ghost" onClick={() => setShowPanel(null)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : showPanel === "edit" ? "Update Partner" : "Add Partner"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageContainer>
    </AppShell>
  );
}
