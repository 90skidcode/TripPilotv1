"use client";
import { useState, useEffect } from "react";
import { leadsApi, authApi, customersApi, b2bPartnersApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import SidePanel from "@/components/SidePanel";
import AddCustomerModal from "./AddCustomerModal";
import { useMasterDataByCategory } from "@/hooks/useMasterData";

interface Props {
  lead?: any;
  initialUseAi?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddLeadSidePanel({ lead, initialUseAi, onClose, onSaved }: Props) {
  const { showToast } = useToast();
  const isEdit = !!lead;
  const { data: stagesData } = useMasterDataByCategory("lead_stages");
  const { data: sourcesData } = useMasterDataByCategory("lead_sources");

  const [form, setForm] = useState({
    customer_id: lead?.customer_id || "",
    source: lead?.source || "manual",
    stage: lead?.stage || "fresh",
    destination: lead?.destination || "",
    trip_type: lead?.trip_type || "",
    travel_date: lead?.travel_date ? new Date(lead.travel_date).toISOString().split("T")[0] : "",
    num_nights: lead?.num_nights || "",
    num_days: lead?.num_days || "",
    budget: lead?.budget || "",
    num_adults: lead?.num_adults || "",
    num_children: lead?.num_children || "",
    num_infants: lead?.num_infants || "",
    notes: lead?.notes || "",
    assigned_to: lead?.assigned_to || "",
    b2b_partner_id: lead?.b2b_partner_id || "",
    ai_text: "",
    use_ai: lead?.use_ai || initialUseAi || false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [b2bPartners, setB2bPartners] = useState<any[]>([]);
  const [loadingError, setLoadingError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (form.customer_id && customers.length > 0) {
      const selected = customers.find((c) => String(c.id) === String(form.customer_id));
      if (selected) {
        setSearchText(`${selected.name} (${selected.phone})`);
      }
    } else if (!form.customer_id) {
      setSearchText("");
    }
  }, [form.customer_id, customers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchCustomer) {
        searchCustomers();
      } else {
        loadCustomers();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchCustomer]);

  async function loadData() {
    try {
      setCustomersLoading(true);
      setLoadingError("");
      const [customersRes, usersList, b2bRes] = await Promise.all([
        customersApi.list({ per_page: 100 }),
        authApi.listUsers(),
        b2bPartnersApi.list({ per_page: 100 }),
      ]);
      setCustomers(customersRes.items || customersRes);
      setUsers(usersList);
      // Handle both paginated and direct response formats
      const partners = b2bRes?.items || b2bRes || [];
      setB2bPartners(Array.isArray(partners) ? partners : []);
      if (!Array.isArray(partners) || partners.length === 0) {
        console.log("[B2B Partners] No partners found or unexpected response format:", b2bRes);
      }
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      setLoadingError(err.message || "Failed to load data");
    } finally {
      setCustomersLoading(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await customersApi.list({ per_page: 100 });
      setCustomers(data.items || data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  }

  async function searchCustomers() {
    try {
      const data = await customersApi.list({ search: searchCustomer, per_page: 100 });
      setCustomers(data.items || data);
    } catch (err) {
      console.error("Failed to search customers:", err);
    }
  }

  function update(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleCustomerAdded(customer: any) {
    setShowAddCustomer(false);
    setForm((f) => ({ ...f, customer_id: customer.id }));
    setCustomers((prev) => [customer, ...prev]);
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");

    if (form.use_ai) {
      if (!form.ai_text.trim()) {
        setError("AI Lead description is required");
        setLoading(false);
        return;
      }
    } else {
      if (!form.customer_id) {
        setError("Please select or create a customer");
        setLoading(false);
        return;
      }
    }

    try {
      if (form.use_ai && form.ai_text) {
        await leadsApi.aiEntry(form.ai_text);
      } else {
        const payload = {
          customer_id: Number(form.customer_id),
          source: form.source,
          stage: form.stage,
          destination: form.destination || null,
          trip_type: form.trip_type || null,
          travel_date: form.travel_date || null,
          num_nights: form.num_nights ? Number(form.num_nights) : null,
          num_days: form.num_days ? Number(form.num_days) : null,
          budget: form.budget || null,
          num_adults: form.num_adults ? Number(form.num_adults) : null,
          num_children: form.num_children ? Number(form.num_children) : null,
          num_infants: form.num_infants ? Number(form.num_infants) : null,
          notes: form.notes || null,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
          b2b_partner_id: form.b2b_partner_id ? Number(form.b2b_partner_id) : null,
        };
        if (isEdit) {
          await leadsApi.update(lead.id, payload);
        } else {
          await leadsApi.create(payload);
        }
      }
      showToast({
        type: "success",
        message: `✓ Lead ${isEdit ? "updated" : "created"} successfully`,
        duration: 3000,
      });
      onSaved();
    } catch (err: any) {
      const errorMsg = err.message || "Failed to save lead";
      setError(errorMsg);
      showToast({
        type: "error",
        message: `✕ ${errorMsg}`,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <SidePanel
        title={isEdit ? "Edit Lead" : "Add New Lead"}
        subtitle={isEdit ? "Update lead details" : "Fill in the details to create a new lead"}
        onClose={onClose}
        onSave={handleSubmit}
        saveLabel={isEdit ? "Update Lead" : "Save Lead"}
        saving={loading}
      >
        <div style={{ padding: "0 24px" }}>
          <form id="lead-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            <div style={{ paddingTop: 12 }}>
                {/* AI Toggle */}
                {!isEdit && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px", background: "linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)", borderRadius: "8px", marginBottom: 20, border: "1px solid #e9d5ff" }}>
                    <span style={{ fontSize: 18 }}>🤖</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>AI Lead Entry</span>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                      <input type="checkbox" checked={form.use_ai} onChange={(e) => update("use_ai", e.target.checked)} id="use-ai-toggle" />
                      <span style={{ fontSize: 12 }}>Enable</span>
                    </label>
                  </div>
                )}

                {form.use_ai ? (
                  <div className="input-group">
                    <label className="input-label">Paste lead info / WhatsApp message</label>
                    <textarea
                      id="ai-text-input"
                      className="input"
                      rows={5}
                      placeholder="e.g. Hi, I'm Priya. My number is 9876543210. Looking for Maldives trip for 2 in December…"
                      value={form.ai_text}
                      onChange={(e) => update("ai_text", e.target.value)}
                    />
                  </div>
                ) : (
                  <>
                    {/* Customer Selection */}
                    <div style={{ marginBottom: 24, position: "relative" }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>Customer</h3>
                      <label className="input-label">Select or Search Customer <span className="required">*</span></label>
                      
                      <div style={{ display: "flex", gap: 8, alignItems: "stretch", position: "relative" }}>
                        <div style={{ flex: 1, position: "relative" }}>
                          <input
                            id="lead-customer-search-input"
                            className="input"
                            placeholder="Type name or phone to search..."
                            value={searchText}
                            onFocus={() => {
                              setIsOpen(true);
                              setSearchCustomer(""); // Clear query to show all customers when clicking
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSearchText(val);
                              setSearchCustomer(val); // Triggers debounce query to backend
                            }}
                            autoComplete="off"
                            style={{ paddingRight: "30px" }}
                          />
                          <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", fontSize: "10px", color: "var(--text-secondary)" }}>
                            ▼
                          </span>

                          {isOpen && (
                            <>
                              <div 
                                style={{ position: "fixed", inset: 0, zIndex: 999 }} 
                                onClick={() => setIsOpen(false)}
                              />
                              <div
                                style={{
                                  position: "absolute",
                                  top: "100%",
                                  left: 0,
                                  right: 0,
                                  marginTop: "4px",
                                  backgroundColor: "white",
                                  border: "1px solid var(--border, #e3eaef)",
                                  borderRadius: "var(--radius, 8px)",
                                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                  maxHeight: "200px",
                                  overflowY: "auto",
                                  zIndex: 1000
                                }}
                              >
                                {customersLoading ? (
                                  <div style={{ padding: "10px 12px", fontSize: "13px", color: "#98a6ad" }}>Loading...</div>
                                ) : customers.length === 0 ? (
                                  <div style={{ padding: "10px 12px", fontSize: "13px", color: "#98a6ad" }}>No customers found</div>
                                ) : (
                                  customers.map((c) => (
                                    <div
                                      key={c.id}
                                      style={{
                                        padding: "8px 12px",
                                        fontSize: "13px",
                                        cursor: "pointer",
                                        borderBottom: "1px solid #f1f3fa",
                                        backgroundColor: String(c.id) === String(form.customer_id) ? "#f1f3fa" : "transparent"
                                      }}
                                      onMouseDown={() => {
                                        update("customer_id", c.id);
                                        setSearchText(`${c.name} (${c.phone})`);
                                        setIsOpen(false);
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f1f3fa")}
                                      onMouseLeave={(e) => {
                                        if (String(c.id) !== String(form.customer_id)) {
                                          e.currentTarget.style.backgroundColor = "transparent";
                                        }
                                      }}
                                    >
                                      {c.name} ({c.phone})
                                    </div>
                                  ))
                                )}
                              </div>
                            </>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowAddCustomer(true)}
                          title="Add New Customer"
                          style={{ whiteSpace: "nowrap", height: "auto" }}
                        >
                          + Add New
                        </button>
                      </div>
                    </div>

                    {/* Trip Details */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>Trip Details</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div className="input-group">
                          <label className="input-label">Lead Source <span className="required">*</span></label>
                          <select id="lead-source" className="input" value={form.source} onChange={(e) => update("source", e.target.value)}>
                            {sourcesData.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Lead Stage</label>
                          <select id="lead-stage" className="input" value={form.stage} onChange={(e) => update("stage", e.target.value)}>
                            {stagesData.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
                          </select>
                        </div>
                        <div className="input-group">
                          <label className="input-label">Destination</label>
                          <input id="lead-destination" className="input" placeholder="e.g. Bali, Maldives" value={form.destination} onChange={(e) => update("destination", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Trip Type</label>
                          <input id="lead-trip-type" className="input" placeholder="e.g. Honeymoon, Family" value={form.trip_type} onChange={(e) => update("trip_type", e.target.value)} />
                        </div>
                        <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                          <label className="input-label">Travel Date</label>
                          <input id="lead-travel-date" className="input" type="date" value={form.travel_date} onChange={(e) => update("travel_date", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Nights</label>
                          <input id="lead-num-nights" className="input" type="number" min={0} placeholder="e.g. 5" value={form.num_nights} onChange={(e) => update("num_nights", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Days</label>
                          <input id="lead-num-days" className="input" type="number" min={0} placeholder="e.g. 6" value={form.num_days} onChange={(e) => update("num_days", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Budget</label>
                          <input id="lead-budget" className="input" placeholder="e.g. ₹1,00,000" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Assign To</label>
                          <select id="lead-assigned-to" className="input" value={form.assigned_to} onChange={(e) => update("assigned_to", e.target.value)}>
                            <option value="">— Unassigned —</option>
                            {users.map((u) => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Traveller Details */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>Traveller Composition</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                        <div className="input-group">
                          <label className="input-label">No. of Adults</label>
                          <input id="lead-adults" className="input" type="number" min={0} value={form.num_adults} onChange={(e) => update("num_adults", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">No. of Children</label>
                          <input id="lead-children" className="input" type="number" min={0} value={form.num_children} onChange={(e) => update("num_children", e.target.value)} />
                        </div>
                        <div className="input-group">
                          <label className="input-label">No. of Infants</label>
                          <input id="lead-infants" className="input" type="number" min={0} value={form.num_infants} onChange={(e) => update("num_infants", e.target.value)} />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="input-group" style={{ marginBottom: 24 }}>
                      <label className="input-label">Notes / Summary</label>
                      <textarea id="lead-notes" className="input" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                    </div>

                    {/* B2B Partner (shown for won/qualified stages) */}
                    {(form.stage === "won" || form.stage === "qualified_hot") && (
                      <div style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: 12, letterSpacing: "0.6px" }}>🤝 B2B Partner</h3>
                        <div className="input-group">
                          <label className="input-label">Assign B2B Partner{form.stage === "won" ? " *" : ""}</label>
                          {loadingError ? (
                            <div style={{ padding: "8px 12px", fontSize: "12px", color: "#991b1b", background: "#fee2e2", borderRadius: "6px", marginBottom: "8px" }}>
                              ⚠️ Failed to load partners: {loadingError}
                            </div>
                          ) : null}
                          <select id="lead-b2b-partner" className="input" value={form.b2b_partner_id} onChange={(e) => update("b2b_partner_id", e.target.value)}>
                            <option value="">— Select Partner —</option>
                            {b2bPartners.map((p) => (
                              <option key={p.id} value={p.id}>{p.company_name} ({p.category})</option>
                            ))}
                          </select>
                        </div>
                        {b2bPartners.length === 0 && !loadingError && (
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                            No B2B partners yet. <a href="/b2b-partners" style={{ color: "var(--brand)", textDecoration: "underline", cursor: "pointer" }}>Add one from the B2B Partners page →</a>
                          </p>
                        )}
                      </div>
                    )}
                  </>
                )}

                {error && (
                  <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px", borderRadius: "var(--radius)", fontSize: 13, marginBottom: 16 }}>
                    {error}
                  </div>
                )}
            </div>
          </form>
        </div>
      </SidePanel>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSaved={handleCustomerAdded}
        />
      )}
    </>
  );
}
