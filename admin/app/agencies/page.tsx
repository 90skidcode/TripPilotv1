"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { TableSkeleton } from "@/components/SkeletonLoaders";
import { Eye, Edit2 } from "lucide-react";

interface Agency {
  id: number;
  name: string;
  slug: string;
  plan: string;
  plan_id: number;
  phone_number: string | null;
  logo_url: string | null;
  is_active: boolean;
  user_count: number;
  lead_count: number;
  subscription_status: string;
  renewal_date: string | null;
  trial_ends_at: string | null;
}

interface PricingPlan {
  id: number;
  name: string;
  monthly_price: number;
  itineraries_limit: number;
  leads_limit: number;
  vouchers_limit: number;
  bills_limit: number;
  team_members_limit: number;
  storage_gb: number;
  trial_days: number;
}

export default function AgenciesPage() {
  const router = useRouter();
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stepper state
  const [showDrawer, setShowDrawer] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slugModified, setSlugModified] = useState(false);
  const [brokenLogos, setBrokenLogos] = useState<Record<number, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  // Payload fields
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone_number: "",
    logo_url: "",
    user_name: "",
    user_phone: "",
    user_email: "",
    user_password: "",
    plan_id: 1, // Default plan_id
  });

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadAgencies();
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await SuperAdminAPI.getPricingPlans();
      setPlans(data);
      // Auto-set the first plan ID if available
      if (data && data.length > 0) {
        setFormData((prev) => ({ ...prev, plan_id: data[0].id }));
      }
    } catch (err) {
      console.error("Failed to load plans", err);
    }
  }

  async function loadAgencies() {
    try {
      const data = await SuperAdminAPI.getAgencies();
      setAgencies(data);
    } catch (error) {
      console.error("Failed to load agencies:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(name: string) {
    const updated: any = { name };
    if (!slugModified) {
      updated.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    setFormData((prev) => ({ ...prev, ...updated }));
  }

  function handleSlugChange(slug: string) {
    setSlugModified(true);
    setFormData((prev) => ({ ...prev, slug: slug.toLowerCase().replace(/\s+/g, "-") }));
  }

  function validateStep(step: number) {
    if (step === 1) {
      if (!formData.name.trim()) return "Agency Name is required";
      if (!formData.slug.trim()) return "Slug is required";
      return null;
    }
    if (step === 2) {
      if (!formData.user_name.trim()) return "Admin Name is required";
      if (!formData.user_email.trim()) return "Admin Email is required";
      if (!formData.user_email.includes("@")) return "Enter a valid Email Address";
      if (!formData.user_password) return "Password is required";
      if (formData.user_password.length < 6) return "Password must be at least 6 characters";
      return null;
    }
    if (step === 3) {
      if (!formData.plan_id) return "Please select a pricing plan";
      return null;
    }
    return null;
  }

  function handleNext() {
    const error = validateStep(currentStep);
    if (error) {
      alert(error);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 3));
  }

  function handleBack() {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleCreate() {
    const error = validateStep(3);
    if (error) {
      alert(error);
      return;
    }

    setCreating(true);
    try {
      await SuperAdminAPI.createAgency(formData);
      // Reset form & state
      setFormData({
        name: "",
        slug: "",
        phone_number: "",
        logo_url: "",
        user_name: "",
        user_phone: "",
        user_email: "",
        user_password: "",
        plan_id: plans[0]?.id || 1,
      });
      setSlugModified(false);
      setCurrentStep(1);
      setShowDrawer(false);
      loadAgencies();
    } catch (err: any) {
      alert(err.message || "Failed to create agency. Verify email or slug is not already registered.");
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px" }}>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>Agencies</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Manage registered organizations and agencies</p>
        </div>
        <button
          onClick={() => {
            setCurrentStep(1);
            setShowDrawer(true);
          }}
          className="btn btn-primary"
          style={{ whiteSpace: "nowrap" }}
        >
          + New Agency
        </button>
      </div>

      {/* Slide Drawer for Stepper */}
      {showDrawer && (
        <>
          <div className="drawer-overlay" onClick={() => setShowDrawer(false)} />
          <div className="drawer" style={{ width: "50vw", minWidth: "480px", maxWidth: "90vw" }}>
            <div className="drawer-header" style={{ background: "linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)" }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-primary)" }}>Register Agency</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Setup agency, admin user, & plan</p>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDrawer(false)} style={{ fontSize: "16px" }}>✕</button>
            </div>

            {/* Stepper Status Bar */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "8px" }}>
                {/* Step 1 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    background: currentStep >= 1 ? "var(--brand)" : "var(--bg)",
                    color: currentStep >= 1 ? "white" : "var(--text-secondary)",
                    border: currentStep === 1 ? "2px solid var(--brand-light)" : "none",
                  }}>1</div>
                  <span style={{ fontSize: "13px", fontWeight: currentStep === 1 ? 700 : 500, color: currentStep === 1 ? "var(--text-primary)" : "var(--text-muted)" }}>Profile</span>
                </div>
                
                <div style={{ flex: 1, height: "2px", background: currentStep >= 2 ? "var(--brand)" : "var(--border)" }} />

                {/* Step 2 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    background: currentStep >= 2 ? "var(--brand)" : "var(--bg)",
                    color: currentStep >= 2 ? "white" : "var(--text-secondary)",
                    border: currentStep === 2 ? "2px solid var(--brand-light)" : "none",
                  }}>2</div>
                  <span style={{ fontSize: "13px", fontWeight: currentStep === 2 ? 700 : 500, color: currentStep === 2 ? "var(--text-primary)" : "var(--text-muted)" }}>Admin</span>
                </div>

                <div style={{ flex: 1, height: "2px", background: currentStep >= 3 ? "var(--brand)" : "var(--border)" }} />

                {/* Step 3 */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700,
                    background: currentStep >= 3 ? "var(--brand)" : "var(--bg)",
                    color: currentStep >= 3 ? "white" : "var(--text-secondary)",
                    border: currentStep === 3 ? "2px solid var(--brand-light)" : "none",
                  }}>3</div>
                  <span style={{ fontSize: "13px", fontWeight: currentStep === 3 ? 700 : 500, color: currentStep === 3 ? "var(--text-primary)" : "var(--text-muted)" }}>Plan</span>
                </div>
              </div>
            </div>

            <div className="drawer-body" style={{ background: "#F9FAFB", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* STEP 1: AGENCY PROFILE */}
              {currentStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ padding: "16px", background: "white", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>🏢 Agency General Information</h4>
                    
                    <div className="input-group">
                      <label className="input-label">Agency Name <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. Dream Escape Holidays"
                        value={formData.name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Slug <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. dream-escape"
                        value={formData.slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        className="input"
                      />
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        URL Identifier: <strong style={{ color: "var(--text-primary)" }}>{formData.slug || "dream-escape"}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ padding: "16px", background: "white", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>📞 Contact & Branding</h4>

                    <div className="input-group">
                      <label className="input-label">Agency Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Logo Image Path or URL</label>
                      <input
                        type="text"
                        placeholder="e.g. https://trippilot.com/logos/dream.png"
                        value={formData.logo_url}
                        onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div style={{ border: "2px dashed var(--border)", borderRadius: "8px", padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "var(--bg)" }}>
                      <span style={{ fontSize: "20px" }}>📁</span>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Or upload logo image file</span>
                      <input
                        type="file"
                        accept="image/*"
                        id="logo-upload-input"
                        style={{ display: "none" }}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(true);
                          setUploadError("");
                          try {
                            const uploadedUrl = await SuperAdminAPI.uploadImage(file);
                            setFormData((prev) => ({ ...prev, logo_url: uploadedUrl }));
                          } catch (err: any) {
                            setUploadError(err.message || "Failed to upload image");
                          } finally {
                            setUploading(false);
                          }
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={uploading}
                        onClick={() => document.getElementById("logo-upload-input")?.click()}
                      >
                        {uploading ? "Uploading..." : "Select File"}
                      </button>
                      {formData.logo_url && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                          <img src={formData.logo_url} alt="Logo Preview" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                          <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 600 }}>Upload successful!</span>
                        </div>
                      )}
                      {uploadError && (
                        <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 600 }}>{uploadError}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: ADMIN CREDENTIALS */}
              {currentStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease" }}>
                  <div style={{ padding: "16px", background: "white", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>👤 First Owner Account Details</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>This user will have administrative ownership privileges inside the CRM frontend.</p>

                    <div className="input-group">
                      <label className="input-label">Owner Name <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={formData.user_name}
                        onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Owner Phone Number</label>
                      <input
                        type="tel"
                        placeholder="e.g. +91 98765 43210"
                        value={formData.user_phone}
                        onChange={(e) => setFormData({ ...formData, user_phone: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="input-group">
                      <label className="input-label">Owner Email / User ID <span style={{ color: "var(--danger)" }}>*</span></label>
                      <input
                        type="email"
                        placeholder="e.g. owner@dreamescape.com"
                        value={formData.user_email}
                        onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                        className="input"
                      />
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>This acts as the login username on the frontend CRM client.</span>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Login Password <span style={{ color: "var(--danger)" }}>*</span></label>
                      <div className="input-wrapper">
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="At least 6 characters"
                          value={formData.user_password}
                          onChange={(e) => setFormData({ ...formData, user_password: e.target.value })}
                          className="input"
                          style={{ paddingRight: "40px" }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                            background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600
                          }}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: PRICING PLAN SELECTION */}
              {currentStep === 3 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", animation: "fadeIn 0.2s ease" }}>
                  <h4 style={{ fontSize: "14px", fontWeight: 700, color: "var(--brand)" }}>💳 Select Pricing & Limits Plan</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        onClick={() => setFormData({ ...formData, plan_id: plan.id })}
                        style={{
                          background: "white",
                          border: formData.plan_id === plan.id ? "2.5px solid var(--brand)" : "1px solid var(--border)",
                          borderRadius: "12px",
                          padding: "16px",
                          cursor: "pointer",
                          transition: "all var(--transition)",
                          boxShadow: formData.plan_id === plan.id ? "0 4px 20px rgba(124,58,237,0.15)" : "none",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary)" }}>{plan.name}</span>
                          <span style={{
                            fontWeight: 800, fontSize: "16px", color: "var(--brand)",
                            background: "var(--brand-light)", padding: "4px 10px", borderRadius: "20px"
                          }}>
                            {plan.monthly_price === 0 ? "Free" : `₹${plan.monthly_price}/mo`}
                          </span>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                          <div>📁 Itineraries: <strong>{plan.itineraries_limit >= 99999 ? "Unlimited" : plan.itineraries_limit}</strong></div>
                          <div>📈 Leads: <strong>{plan.leads_limit >= 99999 ? "Unlimited" : plan.leads_limit}</strong></div>
                          <div>👥 Team Members: <strong>{plan.team_members_limit >= 99999 ? "Unlimited" : plan.team_members_limit}</strong></div>
                          <div>💾 Storage: <strong>{plan.storage_gb} GB</strong></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="drawer-footer" style={{ background: "white" }}>
              {currentStep > 1 && (
                <button onClick={handleBack} className="btn btn-outline" style={{ flex: 1 }}>
                  ← Back
                </button>
              )}
              {currentStep < 3 ? (
                <button onClick={handleNext} className="btn btn-primary" style={{ flex: 1 }}>
                  Next Step ➔
                </button>
              ) : (
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="btn btn-primary"
                  style={{ flex: 1, background: "var(--success)", color: "white" }}
                >
                  {creating ? "Saving..." : "✔ Finalize Register"}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Agencies Table */}
      {(() => {
        const columns: DataTableColumn<Agency>[] = [
          {
            key: "name",
            header: "Agency Name",
            width: "32%",
            render: (_, agency) => (
              <div className="flex items-center gap-3">
                {!agency.logo_url || brokenLogos[agency.id] ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-blue-600 bg-blue-100">
                    {agency.name.substring(0, 2).toUpperCase()}
                  </div>
                ) : (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    onError={() =>
                      setBrokenLogos((prev) => ({ ...prev, [agency.id]: true }))
                    }
                  />
                )}
                <div>
                  <div className="font-semibold text-slate-900">{agency.name}</div>
                  <div className="text-xs text-slate-500">/{agency.slug}</div>
                </div>
              </div>
            ),
          },
          {
            key: "phone_number",
            header: "Phone",
            width: "14%",
            render: (value) =>
              value || <em className="text-slate-400">Not provided</em>,
          },
          {
            key: "plan",
            header: "Plan Tier",
            width: "11%",
            render: (value) => (
              <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                {value}
              </span>
            ),
          },
          {
            key: "subscription_status",
            header: "Billing Status",
            width: "20%",
            render: (value, agency) => (
              <div className="text-sm">
                <div className="font-semibold text-slate-900">
                  {value.toUpperCase()}
                </div>
                {agency.trial_ends_at && (
                  <div className="text-xs text-amber-600">
                    Trial ends: {new Date(agency.trial_ends_at).toLocaleDateString()}
                  </div>
                )}
                {agency.renewal_date && (
                  <div className="text-xs text-slate-500">
                    Renews: {new Date(agency.renewal_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "user_count",
            header: "Users",
            width: "8%",
            align: "center",
            render: (value) => <span className="font-semibold">{value}</span>,
          },
          {
            key: "lead_count",
            header: "Leads",
            width: "8%",
            align: "center",
            render: (value) => <span className="font-semibold">{value}</span>,
          },
          {
            key: "is_active",
            header: "Status",
            width: "9%",
            align: "center",
            render: (value) => (
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  value
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {value ? "Active" : "Suspended"}
              </span>
            ),
          },
        ];

        const actions = [
          {
            id: "view",
            icon: <Eye className="w-4 h-4" />,
            label: "View Details",
            onClick: (agency: Agency) =>
              router.push(`/agencies/${agency.id}`),
          },
          {
            id: "edit",
            icon: <Edit2 className="w-4 h-4" />,
            label: "Edit",
            onClick: (agency: Agency) =>
              router.push(`/agencies/${agency.id}?edit=true`),
          },
        ];

        return (
          <DataTable<Agency>
            columns={columns}
            data={agencies}
            actions={actions}
            pagination={{ page: 1, pageSize: 25, total: agencies.length }}
            onPaginationChange={() => {}}
            isLoading={loading}
            emptyMessage="No agencies yet. Create your first one!"
            emptyIcon="🏢"
            compact={false}
            striped={true}
            hoverable={true}
          />
        );
      })()}


    </div>
  );
}
