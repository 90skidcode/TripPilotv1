"use client";
import { useState, useEffect } from "react";
import { leadsApi, authApi, userGroupsApi, customersApi } from "@/lib/api";
import AddCustomerModal from "./AddCustomerModal";

const SOURCES = ["whatsapp", "instagram", "website", "referral", "advertisement", "manual", "email"];
const STAGES = ["fresh", "qualified_hot", "qualified_warm", "won", "lost", "not_responding", "disqualified", "future_prospect"];
const STAGE_LABELS: Record<string, string> = {
  fresh: "Fresh Lead", qualified_hot: "Qualified Hot", qualified_warm: "Qualified Warm",
  won: "Won", lost: "Lost", not_responding: "Not Responding",
  disqualified: "Disqualified", future_prospect: "Future Prospect",
};

interface Props {
  lead?: any;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddLeadModal({ lead, onClose, onSaved }: Props) {
  const isEdit = !!lead;
  const [form, setForm] = useState({
    customer_id: lead?.customer_id || "",
    source: lead?.source || "manual",
    stage: lead?.stage || "fresh",
    destination: lead?.destination || "",
    trip_type: lead?.trip_type || "",
    budget: lead?.budget || "",
    num_adults: lead?.num_adults || "",
    num_children: lead?.num_children || "",
    num_infants: lead?.num_infants || "",
    notes: lead?.notes || "",
    assigned_to: lead?.assigned_to || "",
    ai_text: "",
    use_ai: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [searchCustomer, setSearchCustomer] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Debounce customer search
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
    setLoadingData(true);
    try {
      const [customersList, usersList, groupsList] = await Promise.all([
        customersApi.list(),
        authApi.listUsers(),
        userGroupsApi.list(),
      ]);
      setCustomers(customersList);
      setUsers(usersList);
      setUserGroups(groupsList);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoadingData(false);
    }
  }

  async function loadCustomers() {
    try {
      const data = await customersApi.list();
      setCustomers(data);
    } catch (err) {
      console.error("Failed to load customers:", err);
    }
  }

  async function searchCustomers() {
    try {
      const data = await customersApi.list({ search: searchCustomer });
      setCustomers(data);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (form.use_ai && form.ai_text) {
        await leadsApi.aiEntry(form.ai_text);
      } else {
        if (!form.customer_id) {
          setError("Please select or create a customer");
          setLoading(false);
          return;
        }

        const payload = {
          customer_id: Number(form.customer_id),
          source: form.source,
          stage: form.stage,
          destination: form.destination || null,
          trip_type: form.trip_type || null,
          budget: form.budget || null,
          num_adults: form.num_adults ? Number(form.num_adults) : null,
          num_children: form.num_children ? Number(form.num_children) : null,
          num_infants: form.num_infants ? Number(form.num_infants) : null,
          notes: form.notes || null,
          assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
        };
        if (isEdit) {
          await leadsApi.update(lead.id, payload);
        } else {
          await leadsApi.create(payload);
        }
      }
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to save lead");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <div className="modal" style={{ maxWidth: 560 }}>
          <div className="modal-header">
            <h2 className="modal-title">{isEdit ? "Edit Lead" : "Add New Lead"}</h2>
            <button className="btn btn-ghost btn-icon" onClick={onClose} id="modal-close-btn">✕</button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* AI Toggle */}
              {!isEdit && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "var(--brand-light)", borderRadius: "var(--radius)", marginBottom: 4 }}>
                  <span>🤖</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>AI Lead Entry — paste raw text</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={form.use_ai} onChange={(e) => update("use_ai", e.target.checked)} id="use-ai-toggle" />
                    Enable
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
                  <div className="form-grid">
                    {/* Customer Selection */}
                    <div className="input-group form-full">
                      <label className="input-label">Customer <span className="required">*</span></label>
                      <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
                        <select
                          id="lead-customer"
                          className="input"
                          style={{ flex: 1 }}
                          value={form.customer_id}
                          onChange={(e) => {
                            update("customer_id", e.target.value);
                            setSearchCustomer("");
                          }}
                        >
                          <option value="">— Select Customer —</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} ({c.phone})
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => setShowAddCustomer(true)}
                          title="Add New Customer"
                          style={{ whiteSpace: "nowrap" }}
                        >
                          + Add
                        </button>
                      </div>
                      <input
                        id="lead-customer-search"
                        className="input"
                        placeholder="Search customer by name or phone..."
                        value={searchCustomer}
                        onChange={(e) => setSearchCustomer(e.target.value)}
                        style={{ marginTop: 8, fontSize: 12 }}
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Lead Source <span className="required">*</span></label>
                      <select id="lead-source" className="input" value={form.source} onChange={(e) => update("source", e.target.value)}>
                        {SOURCES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label className="input-label">Lead Stage</label>
                      <select id="lead-stage" className="input" value={form.stage} onChange={(e) => update("stage", e.target.value)}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
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
                    <div className="input-group">
                      <label className="input-label">Destination</label>
                      <input id="lead-destination" className="input" placeholder="e.g. Bali, Maldives" value={form.destination} onChange={(e) => update("destination", e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Trip Type</label>
                      <input id="lead-trip-type" className="input" placeholder="e.g. Honeymoon, Family" value={form.trip_type} onChange={(e) => update("trip_type", e.target.value)} />
                    </div>
                    <div className="input-group">
                      <label className="input-label">Budget</label>
                      <input id="lead-budget" className="input" placeholder="e.g. ₹1,00,000" value={form.budget} onChange={(e) => update("budget", e.target.value)} />
                    </div>
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
                    <div className="input-group form-full">
                      <label className="input-label">Notes / Summary</label>
                      <textarea id="lead-notes" className="input" rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
                    </div>
                  </div>
                </>
              )}

              {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "var(--radius)", fontSize: 13 }}>{error}</div>}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={onClose} id="modal-cancel-btn">Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={loading} id="modal-save-btn">
                {loading ? "Saving…" : isEdit ? "Update Lead" : "Save Lead"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onSaved={handleCustomerAdded}
        />
      )}
    </>
  );
}
