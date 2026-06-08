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
import { 
  Globe, Hotel, Target, Car, FileText, Plane, Package, 
  Edit, Trash2, Handshake, ChevronLeft, ChevronRight, X
} from "lucide-react";

const CATEGORIES = [
  { value: "dmc", label: "DMC" },
  { value: "hotel", label: "Hotel" },
  { value: "activity", label: "Activity" },
  { value: "transport", label: "Transport" },
  { value: "visa", label: "Visa" },
  { value: "flights", label: "Flights" },
  { value: "other", label: "Other" },
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  dmc: Globe, hotel: Hotel, activity: Target, transport: Car,
  visa: FileText, flights: Plane, other: Package,
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
            <div className="flex items-center gap-3 mb-5">
              <Input
                placeholder="Search company, contact, city..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="max-w-[400px]"
                id="b2b-search"
              />
              <span className="text-sm text-muted-foreground">{total} partners</span>
            </div>

            {loading && partners.length === 0 ? (
              <SkeletonTable rows={5} />
            ) : partners.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="flex justify-center mb-3">
                  <Handshake className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No B2B partners yet</h3>
                <p className="text-muted-foreground mb-5">
                  Add your DMCs, hotel suppliers, and ground operators to link them with won leads.
                </p>
                {canWrite && <Button variant="primary" onClick={openAdd}>+ Add Partner</Button>}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 w-[220px]">Company</th>
                      <th className="px-4 py-3 w-[160px]">Contact Person</th>
                      <th className="px-4 py-3 w-[140px]">Phone</th>
                      <th className="px-4 py-3 w-[110px]">Category</th>
                      <th className="px-4 py-3 w-[120px]">City</th>
                      <th className="px-4 py-3 w-[100px] text-center">Commission</th>
                      <th className="px-4 py-3 w-[80px] text-center">Status</th>
                      <th className="px-4 py-3 w-[100px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => {
                      const IconComponent = CATEGORY_ICONS[p.category] || Package;
                      return (
                        <tr key={p.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${!p.is_active ? 'opacity-50' : ''}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold">{p.company_name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">{p.contact_person || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{p.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 uppercase">
                              {p.category || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">{p.city || "—"}</td>
                          <td className="px-4 py-3 text-center num">
                            {p.commission_pct != null ? `${p.commission_pct}%` : "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium ${p.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                              {p.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center gap-1 justify-end">
                              {canWrite && (
                                <>
                                  <button className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors" onClick={() => openEdit(p)} title="Edit">
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors" onClick={() => handleDelete(p.id)} title="Delete">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
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
            )}

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Button>
                <span className="flex items-center text-sm text-muted-foreground px-2">
                  Page {page} of {pages}
                </span>
                <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add / Edit Side Panel */}
        {showPanel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex justify-end transition-opacity" onClick={(e) => e.target === e.currentTarget && setShowPanel(null)}>
            <div className="w-full max-w-lg bg-card h-full flex flex-col shadow-[-4px_0_24px_rgba(0,0,0,0.1)] animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">{showPanel === "edit" ? "Edit Partner" : "Add B2B Partner"}</h2>
                <button className="p-2 -mr-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors" onClick={() => setShowPanel(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="grid gap-4 md:gap-5">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name *</label>
                    <Input value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="e.g. SkyTravel DMC" id="b2b-company" className="h-9" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</label>
                      <Input value={form.contact_person} onChange={(e) => setField("contact_person", e.target.value)} placeholder="Name" id="b2b-contact" className="h-9" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
                      <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+91 ..." id="b2b-phone" className="h-9" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                      <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@company.com" id="b2b-email" className="h-9" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Number</label>
                      <Input value={form.gst_number} onChange={(e) => setField("gst_number", e.target.value)} placeholder="GST" id="b2b-gst" className="h-9" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                      <select
                        value={form.category}
                        onChange={(e) => setField("category", e.target.value)}
                        id="b2b-category"
                        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission %</label>
                      <Input type="number" step="0.5" value={form.commission_pct} onChange={(e) => setField("commission_pct", e.target.value)} placeholder="e.g. 10" id="b2b-commission" className="h-9" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                      <Input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Dubai" id="b2b-city" className="h-9" />
                    </div>
                    <div>
                      <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</label>
                      <Input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="India" id="b2b-country" className="h-9" />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setField("notes", e.target.value)}
                      placeholder="Internal notes about this partner..."
                      rows={3}
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                      id="b2b-notes"
                    />
                  </div>
                  {showPanel === "edit" && (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} id="b2b-active" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                      <label htmlFor="b2b-active" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active Partner</label>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 mt-8">
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
