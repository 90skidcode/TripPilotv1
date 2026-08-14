"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import SidePanel from "@/components/SidePanel";
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
  Edit, Trash2, Handshake, ChevronLeft, ChevronRight, X, MapPin, Users,
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

const INPUT_CLS = "flex h-9 w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50";

// ── Multi-country tag input ──────────────────────────────────────────────────
function CountriesInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function addCountry(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed || value.map(c => c.toLowerCase()).includes(trimmed.toLowerCase())) {
      setInputVal("");
      return;
    }
    onChange([...value, trimmed]);
    setInputVal("");
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addCountry(inputVal);
    } else if (e.key === "Backspace" && !inputVal && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className="min-h-[38px] w-full rounded-md border border-input bg-white px-2 py-1.5 text-sm focus-within:ring-1 focus-within:ring-ring cursor-text flex flex-wrap gap-1.5"
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((c) => (
        <span key={c} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
          <MapPin className="w-3 h-3" />{c}
          <button type="button" onClick={() => onChange(value.filter(x => x !== c))} className="ml-0.5 hover:text-destructive">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={inputVal}
        onChange={(e) => setInputVal(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => inputVal.trim() && addCountry(inputVal)}
        placeholder={value.length === 0 ? "Type country, press Enter…" : "Add more…"}
        className="flex-1 min-w-[120px] outline-none bg-transparent placeholder:text-muted-foreground text-sm"
      />
    </div>
  );
}

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
  const debouncedSearch = useDebounce(search);

  const [showPanel, setShowPanel] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: "", contact_person: "", phone: "", email: "",
    gst_number: "", city: "", country: "India", countries: [] as string[],
    category: "dmc", commission_pct: "", notes: "", is_active: true,
  });

  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, per_page: 20 };
      if (debouncedSearch) params.search = debouncedSearch;
      const data = await b2bPartnersApi.list(params);
      setPartners(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err: any) {
      showToast({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  function resetForm() {
    setForm({
      company_name: "", contact_person: "", phone: "", email: "",
      gst_number: "", city: "", country: "India", countries: [],
      category: "dmc", commission_pct: "", notes: "", is_active: true,
    });
  }

  function openAdd() { resetForm(); setEditing(null); setShowPanel("add"); }

  function openEdit(p: any) {
    setForm({
      company_name: p.company_name || "", contact_person: p.contact_person || "",
      phone: p.phone || "", email: p.email || "", gst_number: p.gst_number || "",
      city: p.city || "", country: p.country || "India",
      countries: Array.isArray(p.countries) ? p.countries : [],
      category: p.category || "dmc",
      commission_pct: p.commission_pct != null ? String(p.commission_pct) : "",
      notes: p.notes || "", is_active: p.is_active !== false,
    });
    setEditing(p);
    setShowPanel("edit");
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
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
                      <th className="px-4 py-3 w-[200px]">Company</th>
                      <th className="px-4 py-3 w-[140px]">Contact</th>
                      <th className="px-4 py-3 w-[130px]">Phone</th>
                      <th className="px-4 py-3 w-[90px]">Category</th>
                      <th className="px-4 py-3">Countries</th>
                      <th className="px-4 py-3 w-[80px] text-center">Leads</th>
                      <th className="px-4 py-3 w-[100px] text-center">Commission</th>
                      <th className="px-4 py-3 w-[80px] text-center">Status</th>
                      <th className="px-4 py-3 w-[90px] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => {
                      const IconComponent = CATEGORY_ICONS[p.category] || Package;
                      return (
                        <tr key={p.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${!p.is_active ? "opacity-50" : ""}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-muted-foreground shrink-0" />
                              <span className="font-semibold">{p.company_name}</span>
                            </div>
                            {p.city && <p className="text-xs text-muted-foreground mt-0.5 ml-6">{p.city}</p>}
                          </td>
                          <td className="px-4 py-3">{p.contact_person || "—"}</td>
                          <td className="px-4 py-3 whitespace-nowrap">{p.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 uppercase">
                              {p.category || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {p.countries && p.countries.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {p.countries.map((c: string) => (
                                  <span key={c} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-semibold">
                                    <MapPin className="w-2.5 h-2.5" />{c}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">{p.country || "—"}</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              (p.leads_count || 0) > 0
                                ? "bg-indigo-100 text-indigo-800 font-bold border border-indigo-200"
                                : "bg-gray-100 text-gray-400"
                            }`}>
                              <Users className="w-3 h-3" />
                              {p.leads_count || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
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
                <span className="text-sm text-muted-foreground px-2">Page {page} of {pages}</span>
                <Button variant="ghost" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add / Edit Side Panel */}
        {showPanel && (
          <SidePanel
            title={showPanel === "edit" ? "Edit Partner" : "Add B2B Partner"}
            subtitle={showPanel === "edit" ? "Update partner details" : "Add a new DMC, hotel or ground operator"}
            onClose={() => setShowPanel(null)}
            onSave={handleSave}
            saveLabel={showPanel === "edit" ? "Update Partner" : "Add Partner"}
            saving={saving}
          >
              <div className="p-6 space-y-4">
                {/* Company Name */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Company Name *</label>
                  <Input value={form.company_name} onChange={(e) => setField("company_name", e.target.value)} placeholder="e.g. SkyTravel DMC" id="b2b-company" className="h-9" />
                </div>

                {/* Contact + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Person</label>
                    <Input value={form.contact_person} onChange={(e) => setField("contact_person", e.target.value)} placeholder="Name" id="b2b-contact" className="h-9" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</label>
                    <Input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="+91 ..." id="b2b-phone" className="h-9" />
                  </div>
                </div>

                {/* Email + GST */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</label>
                    <Input value={form.email} onChange={(e) => setField("email", e.target.value)} placeholder="email@company.com" id="b2b-email" className="h-9" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">GST Number</label>
                    <Input value={form.gst_number} onChange={(e) => setField("gst_number", e.target.value)} placeholder="GST" id="b2b-gst" className="h-9" />
                  </div>
                </div>

                {/* Category + Commission */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</label>
                    <select value={form.category} onChange={(e) => setField("category", e.target.value)} id="b2b-category" className={INPUT_CLS}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Commission %</label>
                    <Input type="number" step="0.5" value={form.commission_pct} onChange={(e) => setField("commission_pct", e.target.value)} placeholder="e.g. 10" id="b2b-commission" className="h-9" />
                  </div>
                </div>

                {/* City + Base Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">City</label>
                    <Input value={form.city} onChange={(e) => setField("city", e.target.value)} placeholder="e.g. Dubai" id="b2b-city" className="h-9" />
                  </div>
                  <div>
                    <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Base Country</label>
                    <Input value={form.country} onChange={(e) => setField("country", e.target.value)} placeholder="India" id="b2b-country" className="h-9" />
                  </div>
                </div>

                {/* Countries operated in */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Countries Operated In
                  </label>
                  <CountriesInput
                    value={form.countries}
                    onChange={(v) => setField("countries", v)}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">Type a country name and press Enter to add. Used to filter partners when connecting to a lead.</p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setField("notes", e.target.value)}
                    placeholder="Internal notes about this partner..."
                    rows={3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                    id="b2b-notes"
                  />
                </div>

                {showPanel === "edit" && (
                  <div className="flex items-center gap-2 pt-1">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setField("is_active", e.target.checked)} id="b2b-active" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <label htmlFor="b2b-active" className="text-sm font-medium">Active Partner</label>
                  </div>
                )}
              </div>
          </SidePanel>
        )}
      </PageContainer>
    </AppShell>
  );
}
