"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { LogIn } from "lucide-react";

interface Agency {
  id: number;
  name: string;
  slug: string;
  plan: string;
  plan_id: number;
  is_active: boolean;
  user_count: number;
  lead_count: number;
  subscription_status: string;
  renewal_date: string | null;
  trial_ends_at: string | null;
  phone_number: string | null;
  logo_url: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface ImpersonateModal {
  show: boolean;
  token: string;
  userId: number;
  userName: string;
}

function AgencyDetailContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const editQuery = searchParams.get("edit");
  const agencyId = Number(params.id);

  const [agency, setAgency] = useState<Agency | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const { pagination, handlers } = usePagination(0);
  const [editData, setEditData] = useState({
    name: "",
    phone_number: "",
    logo_url: "",
    plan_id: 0,
  });
  const [impersonateModal, setImpersonateModal] = useState<ImpersonateModal>({
    show: false,
    token: "",
    userId: 0,
    userName: "",
  });
  const [impersonating, setImpersonating] = useState(false);
  const [logoBroken, setLogoBroken] = useState(false);
  const [uploadingDetail, setUploadingDetail] = useState(false);
  const [uploadErrorDetail, setUploadErrorDetail] = useState("");

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadData();
  }, [agencyId]);

  useEffect(() => {
    if (editQuery === "true") {
      setEditing(true);
    }
  }, [editQuery]);

  async function loadData() {
    try {
      const agencyData = await SuperAdminAPI.getAgency(agencyId);
      setAgency(agencyData);
      setLogoBroken(false);
      setEditData({
        name: agencyData.name,
        phone_number: agencyData.phone_number || "",
        logo_url: agencyData.logo_url || "",
        plan_id: agencyData.plan_id || 1,
      });

      try {
        const plansData = await SuperAdminAPI.getAllPricingPlans();
        setPlans(plansData);
      } catch (err) {
        console.error("Failed to load pricing plans:", err);
      }

      const usersData = await SuperAdminAPI.getAgencyUsers(agencyId);
      setUsers(usersData);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate() {
    try {
      await SuperAdminAPI.updateAgency(agencyId, editData);
      setEditing(false);
      router.replace(`/agencies/${agencyId}`);
      loadData();
    } catch {
      alert("Failed to update agency");
    }
  }

  async function handleToggle() {
    try {
      await SuperAdminAPI.toggleAgency(agencyId);
      loadData();
    } catch {
      alert("Failed to toggle agency");
    }
  }

  async function handleImpersonate(user: User) {
    setImpersonating(true);
    try {
      const response = await SuperAdminAPI.impersonateUser(user.id);
      setImpersonateModal({
        show: true,
        token: response.token,
        userId: user.id,
        userName: user.name,
      });
    } catch {
      alert("Failed to impersonate user");
    } finally {
      setImpersonating(false);
    }
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(impersonateModal.token);
  }

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading agency details...</div>
      </div>
    );
  }

  if (!agency) {
    return (
      <div style={{ padding: "28px", textAlign: "center", color: "var(--text-secondary)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>Agency Not Found</h3>
        <p>The requested organization could not be loaded or does not exist.</p>
        <Link href="/agencies" className="btn btn-outline" style={{ marginTop: "16px" }}>
          ← Back to Agencies
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Header / Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <Link href="/agencies" className="btn btn-outline" style={{ marginBottom: "12px" }}>
            ← Back to Agencies
          </Link>
          <h1 style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)" }}>{agency.name}</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>Agency ID: {agency.id} | Slug: {agency.slug}</p>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="btn btn-outline"
              style={{ fontWeight: 600 }}
            >
              ✏ Edit Details
            </button>
          )}
          <button
            onClick={handleToggle}
            className={`btn ${agency.is_active ? "btn-danger" : "btn-primary"}`}
          >
            {agency.is_active ? "Suspend Agency" : "Activate Agency"}
          </button>
        </div>
      </div>

      {/* Profile & Billing Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Profile Card */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
            <h2 className="card-title" style={{ margin: 0 }}>Agency Profile</h2>
            {/* Logo Preview in Header */}
            {!editing && (
              <div style={{ display: "flex", alignItems: "center" }}>
                {agency.logo_url && !logoBroken ? (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "2px solid var(--brand)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                    onError={() => setLogoBroken(true)}
                  />
                ) : (
                  <div
                    style={{
                      display: "flex",
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, var(--brand) 0%, #a855f7 100%)",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "16px",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(124, 58, 237, 0.2)"
                    }}
                  >
                    {agency.name.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="card-body">
            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="input-group">
                  <label className="input-label">Agency Name</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="input"
                    placeholder="Enter agency name"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <input
                    type="text"
                    value={editData.phone_number}
                    onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                    className="input"
                    placeholder="Enter phone number"
                  />
                </div>
                 <div className="input-group">
                  <label className="input-label">Logo URL</label>
                  <input
                    type="text"
                    value={editData.logo_url}
                    onChange={(e) => setEditData({ ...editData, logo_url: e.target.value })}
                    className="input"
                    placeholder="Enter logo image URL"
                  />
                </div>

                <div style={{ border: "2px dashed var(--border)", borderRadius: "8px", padding: "16px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", background: "var(--bg)" }}>
                  <span style={{ fontSize: "20px" }}>📁</span>
                  <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>Or upload logo image file</span>
                  <input
                    type="file"
                    accept="image/*"
                    id="logo-upload-input-detail"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingDetail(true);
                      setUploadErrorDetail("");
                      try {
                        const uploadedUrl = await SuperAdminAPI.uploadImage(file);
                        setEditData((prev) => ({ ...prev, logo_url: uploadedUrl }));
                      } catch (err: any) {
                        setUploadErrorDetail(err.message || "Failed to upload image");
                      } finally {
                        setUploadingDetail(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    disabled={uploadingDetail}
                    onClick={() => document.getElementById("logo-upload-input-detail")?.click()}
                  >
                    {uploadingDetail ? "Uploading..." : "Select File"}
                  </button>
                  {editData.logo_url && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                      <img src={editData.logo_url} alt="Logo Preview" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border)" }} />
                      <span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 600 }}>Upload successful!</span>
                    </div>
                  )}
                  {uploadErrorDetail && (
                    <span style={{ fontSize: "11px", color: "var(--danger)", fontWeight: 600 }}>{uploadErrorDetail}</span>
                  )}
                </div>
                <div className="input-group">
                  <label className="input-label">Subscription Plan</label>
                  <select
                    value={editData.plan_id}
                    onChange={(e) => setEditData({ ...editData, plan_id: Number(e.target.value) })}
                    className="input"
                  >
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.monthly_price}/mo)
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button onClick={handleUpdate} className="btn btn-primary" style={{ flex: 1 }}>
                    Save
                  </button>
                  <button onClick={() => { setEditing(false); router.replace(`/agencies/${agencyId}`); }} className="btn btn-outline" style={{ flex: 1 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Agency Name</p>
                    <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{agency.name}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Slug / Organization ID</p>
                    <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-secondary)", marginTop: "4px" }}>{agency.slug}</p>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Phone Number</p>
                    <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginTop: "4px" }}>{agency.phone_number || "—"}</p>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Status</p>
                    <span className={`badge ${agency.is_active ? "badge-green" : "badge-red"}`} style={{ display: "inline-block", marginTop: "4px" }}>
                      {agency.is_active ? "Active" : "Suspended"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Tier / Plan</p>
                    <span className="badge badge-blue" style={{ display: "inline-block", marginTop: "4px" }}>{agency.plan}</span>
                  </div>
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Logo URL</p>
                    <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", wordBreak: "break-all", fontStyle: agency.logo_url ? "normal" : "italic" }}>
                      {agency.logo_url || "No logo set"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Info Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Subscription & Billing</h2>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Billing Status</p>
                  <span className={`badge ${agency.subscription_status === "active" ? "badge-green" : "badge-yellow"}`} style={{ marginTop: "4px" }}>
                    {agency.subscription_status}
                  </span>
                </div>
                <div>
                  <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Current Plan</p>
                  <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginTop: "4px" }}>{agency.plan}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                {agency.trial_ends_at && (
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Trial Expiration</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--warning)", marginTop: "4px" }}>
                      {new Date(agency.trial_ends_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {agency.renewal_date && (
                  <div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Next Renewal</p>
                    <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--brand)", marginTop: "4px" }}>
                      {new Date(agency.renewal_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "24px", position: "relative" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Team Users</p>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", marginTop: "8px" }}>{agency.user_count}</p>
          <div style={{ position: "absolute", right: "24px", bottom: "24px", fontSize: "28px" }}>👥</div>
        </div>
        <div className="card" style={{ padding: "24px", position: "relative" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".05em" }}>Total Leads Managed</p>
          <p style={{ fontSize: "36px", fontWeight: 800, color: "var(--text-primary)", marginTop: "8px" }}>{agency.lead_count}</p>
          <div style={{ position: "absolute", right: "24px", bottom: "24px", fontSize: "28px" }}>📈</div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Team Members</h2>
        </div>
        <div className="card-body" style={{ padding: "0" }}>
          {(() => {
            const columns: DataTableColumn<User>[] = [
              {
                key: "name",
                header: "Name",
              },
              {
                key: "email",
                header: "Email Address",
              },
              {
                key: "role",
                header: "Role",
                render: (value) => (
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-teal-100 text-teal-800">
                    {value}
                  </span>
                ),
              },
            ];

            const actions = [
              {
                id: "impersonate",
                icon: <LogIn className="w-4 h-4" />,
                label: "Impersonate",
                onClick: (user: User) => handleImpersonate(user),
              },
            ];

            return (
              <DataTable<User>
                columns={columns}
                data={users}
                actions={actions}
                pagination={{ ...pagination, total: users.length }}
                onPaginationChange={handlers.onPaginationChange}
                isLoading={loading}
                emptyMessage="No users registered in this agency."
                emptyIcon="👥"
                compact={false}
                striped={true}
                hoverable={true}
              />
            );
          })()}
        </div>
      </div>

      {/* Impersonate Token Modal */}
      {impersonateModal.show && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Impersonate User</h3>
              <button
                className="btn btn-ghost btn-icon"
                onClick={() => setImpersonateModal({ ...impersonateModal, show: false })}
                style={{ fontSize: "16px" }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                A secure impersonation token has been generated for <strong>{impersonateModal.userName}</strong>. Copy the token below to log in:
              </p>

              <div style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: "16px",
                borderRadius: "8px",
                fontFamily: "monospace",
                color: "var(--brand)",
                wordBreak: "break-all",
                fontSize: "13px",
                fontWeight: 600
              }}>
                {impersonateModal.token}
              </div>
            </div>
            <div className="modal-footer">
              <button
                onClick={() => setImpersonateModal({ ...impersonateModal, show: false })}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                Close
              </button>
              <button
                onClick={copyToClipboard}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                Copy Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AgencyDetailPage() {
  return (
    <Suspense fallback={
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading agency details...</div>
      </div>
    }>
      <AgencyDetailContent />
    </Suspense>
  );
}
