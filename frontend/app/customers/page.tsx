"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { customersApi, leadsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { SkeletonTable } from "@/components/SkeletonLoader";
import TravelLoader from "@/components/TravelLoader";
import { cn } from "@/lib/cn";
import CustomerCsvImportModal from "./CustomerCsvImportModal";
import {
  Eye,
  Pencil,
  Trash2,
  Plus,
  X,
  Search,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Calendar,
  Users,
  Handshake,
  ChevronLeft,
  ChevronRight,
  FileText,
  Hotel,
  Plane,
  Receipt,
  Clock,
  ExternalLink,
  Download,
  Upload,
} from "lucide-react";

const TH = "text-left font-semibold text-xs uppercase tracking-wide text-muted-foreground px-4 py-3";

const STAGE_STYLES: Record<string, string> = {
  won: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-gray-100 text-gray-600 border-gray-200",
  fresh: "bg-teal-50 text-teal-700 border-teal-200",
};

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
  const [workspace, setWorkspace] = useState<any>(null);
  const [detailTab, setDetailTab] = useState<"overview" | "itineraries" | "vouchers" | "flights" | "partners" | "invoices" | "timeline">("overview");

  // Form state
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formWhatsapp, setFormWhatsapp] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCsvImport, setShowCsvImport] = useState(false);

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

  async function handleExport() {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/customers/export/csv`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("trippilot_token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to export customers");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      showToast({
        type: "success",
        message: "✓ Customers exported successfully",
        duration: 3000,
      });
    } catch (err: any) {
      showToast({
        type: "error",
        message: `✕ Failed to export: ${err.message}`,
        duration: 4000,
      });
    }
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
    setWorkspace(null);
    setDetailTab("overview");
    setDetailLoading(true);
    setShowPanel("detail");
    try {
      const [leadsData, wsData] = await Promise.all([
        leadsApi.list({ customer_id: c.id, per_page: 50 }),
        customersApi.workspace(c.id),
      ]);
      setDetailLeads(leadsData.items || []);
      setWorkspace(wsData);
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
          action={canWrite ? (
            <Button variant="primary" onClick={openAddPanel}>
              <Plus className="h-4 w-4" /> Add Customer
            </Button>
          ) : undefined}
        />

        <Card>
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-border">
              <div className="relative flex-1 min-w-64 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search by name, phone, email…"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9"
                  id="customer-search"
                />
              </div>
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">{total}</strong> customers
              </span>
              <div className="flex gap-2 ml-auto">
                {canWrite && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCsvImport(true)}
                      title="Bulk import customers from CSV"
                    >
                      <Upload className="h-4 w-4" /> Import
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                      title="Export all customers as CSV"
                    >
                      <Download className="h-4 w-4" /> Export
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Table */}
            {loading && customers.length === 0 ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : customers.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">No customers found</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Customers are created automatically when you add leads, or add one manually.
                </p>
                {canWrite && (
                  <Button variant="primary" size="lg" onClick={openAddPanel}>
                    <Plus className="h-4 w-4" /> Add Customer
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className={TH}>Customer</th>
                      <th className={TH}>Phone</th>
                      <th className={TH}>WhatsApp</th>
                      <th className={cn(TH, "text-center")}>Leads</th>
                      <th className={TH}>Added</th>
                      <th className={cn(TH, "text-right")}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr key={c.id} className="border-b border-border last:border-0 transition-colors group hover:bg-muted/40">
                        {/* Customer */}
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => openDetailPanel(c)}
                            className="flex items-center gap-3 text-left"
                          >
                            <Avatar name={c.name} />
                            <div className="min-w-0">
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {c.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {c.email || "No email"}
                              </div>
                            </div>
                          </button>
                        </td>

                        {/* Phone */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2 text-foreground">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            {c.phone}
                          </span>
                        </td>

                        {/* WhatsApp */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          {c.whatsapp_number ? (
                            <a
                              href={`https://wa.me/${c.whatsapp_number?.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700"
                              title="Open WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                              {c.whatsapp_number}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Leads count */}
                        <td className="px-4 py-3 text-center">
                          <Badge variant={c.lead_count > 0 ? "info" : "default"} className="font-medium">
                            {c.lead_count}
                          </Badge>
                        </td>

                        {/* Added */}
                        <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString("en-IN") : "—"}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => openDetailPanel(c)} title="View details">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canWrite && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => openEditPanel(c)} title="Edit customer">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(c.id)}
                                  title="Delete customer"
                                  className="hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
              <div className="flex items-center justify-between gap-2 p-4 border-t border-border bg-muted/30">
                <span className="text-sm text-muted-foreground">
                  Page <strong className="text-foreground">{page}</strong> of {pages}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
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
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(null)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="side-panel-content" style={{ padding: 24 }}>
                <div className="grid gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                    <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Deepika Gandhi" id="customer-name" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone *</label>
                    <Input value={formPhone} onChange={(e) => setFormPhone(e.target.value)} placeholder="e.g. +91 98765 43210" id="customer-phone" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email</label>
                    <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="e.g. deepika@gmail.com" id="customer-email" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5">WhatsApp Number</label>
                    <Input value={formWhatsapp} onChange={(e) => setFormWhatsapp(e.target.value)} placeholder="e.g. +91 98765 43210" id="customer-whatsapp" />
                  </div>
                </div>
                <div className="flex gap-3 mt-8 justify-end">
                  <Button variant="ghost" onClick={() => setShowPanel(null)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : showPanel === "edit" ? "Update Customer" : "Add Customer"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detail Side Panel */}
        {showPanel === "detail" && detailCustomer && workspace && (
          <div className="side-panel-overlay" onClick={(e) => e.target === e.currentTarget && setShowPanel(null)}>
            <div className="side-panel">
              <div className="side-panel-header">
                <div className="flex items-center gap-3">
                  <Avatar name={detailCustomer.name} className="h-10 w-10" />
                  <div>
                    <h2 className="side-panel-title">{detailCustomer.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Customer workspace</p>
                  </div>
                </div>
                <button className="btn btn-ghost btn-icon" onClick={() => setShowPanel(null)} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-border px-6 pt-3 overflow-x-auto">
                <div className="flex gap-1">
                  {[
                    { id: "overview", label: "Overview", count: workspace.counts?.leads },
                    { id: "itineraries", label: "Itineraries", count: workspace.counts?.itineraries },
                    { id: "vouchers", label: "Vouchers", count: workspace.counts?.vouchers },
                    { id: "flights", label: "Flights", count: workspace.counts?.flights },
                    { id: "partners", label: "Partners", count: workspace.counts?.partners },
                    { id: "invoices", label: "Invoices", count: workspace.counts?.invoices },
                    { id: "timeline", label: "Timeline", count: workspace.counts?.activities },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setDetailTab(tab.id as any)}
                      className={cn(
                        "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                        detailTab === tab.id
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label} <span className="text-xs ml-1">({tab.count || 0})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="side-panel-content" style={{ padding: 24 }}>
                {detailLoading && (
                  <TravelLoader text="Fetching customer details" size="md" />
                )}

                {!detailLoading && detailTab === "overview" && (
                  <>
                    <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <InfoItem icon={Phone} label="Phone" value={detailCustomer.phone} />
                      <InfoItem icon={Mail} label="Email" value={detailCustomer.email || "—"} />
                      <InfoItem icon={MessageCircle} label="WhatsApp" value={detailCustomer.whatsapp_number || "—"} />
                      <InfoItem
                        icon={Calendar}
                        label="Since"
                        value={detailCustomer.created_at ? new Date(detailCustomer.created_at).toLocaleDateString("en-IN") : "—"}
                      />
                    </div>

                    <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      <Users className="h-3.5 w-3.5" /> Leads ({detailLeads.length})
                    </h3>
                    {detailLeads.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No leads for this customer
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {detailLeads.map((lead: any) => (
                          <Link
                            key={lead.id}
                            href={`/leads/${lead.id}`}
                            className="block rounded-lg border border-border bg-muted/30 p-3 hover:border-primary/50 hover:bg-muted/60 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm">{lead.destination || "Inquiry"}</span>
                              <Badge className="text-[10px]">{lead.stage?.replace("_", " ")}</Badge>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "itineraries" && (
                  <>
                    {workspace.itineraries?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No itineraries
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workspace.itineraries?.map((i: any) => (
                          <div key={i.id} className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="font-semibold text-sm">{i.title}</p>
                            <p className="text-xs text-muted-foreground">{i.destination || "—"} • {i.total_days || 0} days</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "vouchers" && (
                  <>
                    {workspace.vouchers?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No vouchers
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workspace.vouchers?.map((v: any) => (
                          <div key={v.id} className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="font-semibold text-sm">{v.hotel_name}</p>
                            <p className="text-xs text-muted-foreground">{v.room_type || "—"} • {v.check_in ? new Date(v.check_in).toLocaleDateString("en-IN") : "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "flights" && (
                  <>
                    {workspace.flights?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No flights
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workspace.flights?.map((f: any) => (
                          <div key={f.id} className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="font-semibold text-sm">{f.airline} {f.flight_number || ""}</p>
                            <p className="text-xs text-muted-foreground">{f.origin} → {f.destination}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "partners" && (
                  <>
                    {workspace.partners?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No partners
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workspace.partners?.map((p: any) => (
                          <div key={p.id} className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="font-semibold text-sm">{p.company_name}</p>
                            <p className="text-xs text-muted-foreground">{p.role || "—"} • ₹{p.cost?.toLocaleString("en-IN") || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "invoices" && (
                  <>
                    {workspace.invoices?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No invoices
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {workspace.invoices?.map((inv: any) => (
                          <div key={inv.id} className="rounded-lg border border-border bg-muted/30 p-3">
                            <p className="font-semibold text-sm">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">₹{inv.grand_total?.toLocaleString("en-IN") || "—"} • {inv.status || "—"}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!detailLoading && detailTab === "timeline" && (
                  <>
                    {workspace.activities?.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No activity
                      </div>
                    ) : (
                      <ol className="relative space-y-4">
                        {workspace.activities?.map((a: any, idx: number) => (
                          <li key={a.id} className="relative flex gap-3">
                            {idx < (workspace.activities?.length || 0) - 1 && (
                              <span className="absolute left-[15px] top-8 bottom-[-16px] w-px bg-border" />
                            )}
                            <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs">
                              {idx + 1}
                            </span>
                            <div className="min-w-0 flex-1 pb-1">
                              <p className="font-semibold text-sm">{a.title}</p>
                              {a.description && <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>}
                              {a.actor_name && <p className="text-xs text-muted-foreground">by {a.actor_name}</p>}
                              <p className="text-xs text-muted-foreground mt-1">{a.created_at ? new Date(a.created_at).toLocaleString("en-IN") : "—"}</p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* CSV Import Modal */}
        {showCsvImport && (
          <CustomerCsvImportModal
            onClose={() => setShowCsvImport(false)}
            onImported={() => {
              setShowCsvImport(false);
              fetchCustomers();
            }}
          />
        )}
      </PageContainer>
    </AppShell>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </label>
      <p className="text-sm font-semibold text-foreground mt-1 break-words">{value}</p>
    </div>
  );
}
