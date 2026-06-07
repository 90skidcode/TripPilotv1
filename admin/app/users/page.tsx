"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";

interface Agency {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
}

interface UserGroup {
  id: number;
  org_id: number;
  name: string;
  permissions: Record<string, { read: boolean; write: boolean }>;
}

interface AgencyUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "manager" | "agent";
  org_id: number;
  group_id: number | null;
}

const SCREENS = ["leads", "itinerary", "vouchers", "inventory", "dashboard", "settings", "users"] as const;

const SCREEN_LABELS: Record<string, string> = {
  leads: "💼 Leads Management",
  itinerary: "🗺️ Itinerary Builder",
  vouchers: "🎟️ Voucher Generation",
  inventory: "📦 Inventory Tracker",
  dashboard: "📊 Dashboard Metrics",
  settings: "⚙️ Agency Settings",
  users: "👥 User Management"
};

export default function UsersPage() {
  const router = useRouter();
  
  // Loading & Global States
  const [loadingAgencies, setLoadingAgencies] = useState(true);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [searchAgencyQuery, setSearchAgencyQuery] = useState("");
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"users" | "groups">("users");

  // Selected Agency Data
  const [users, setUsers] = useState<AgencyUser[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [loadingAgencyData, setLoadingAgencyData] = useState(false);
  const [searchUserQuery, setSearchUserQuery] = useState("");

  // Drawer & Modal States
  const [editUserDrawerOpen, setEditUserDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AgencyUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    name: "",
    email: "",
    role: "agent" as "admin" | "manager" | "agent",
    group_id: -1 // -1 means no group assignment
  });
  const [savingUser, setSavingUser] = useState(false);

  const [groupDrawerOpen, setGroupDrawerOpen] = useState(false);
  const [groupDrawerMode, setGroupDrawerMode] = useState<"create" | "edit">("create");
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupFormData, setGroupFormData] = useState({
    name: "",
    permissions: SCREENS.reduce((acc, screen) => {
      acc[screen] = { read: false, write: false };
      return acc;
    }, {} as Record<string, { read: boolean; write: boolean }>)
  });
  const [savingGroup, setSavingGroup] = useState(false);

  // Custom Confirmation Modals
  const [deleteGroupModal, setDeleteGroupModal] = useState<{
    isOpen: boolean;
    group: UserGroup | null;
  }>({
    isOpen: false,
    group: null
  });
  const [deletingGroup, setDeletingGroup] = useState(false);

  // Impersonate Modal
  const [impersonateModal, setImpersonateModal] = useState<{
    isOpen: boolean;
    user: AgencyUser | null;
    token: string;
    loading: boolean;
  }>({
    isOpen: false,
    user: null,
    token: "",
    loading: false
  });
  const [copiedToken, setCopiedToken] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadAgencies();
  }, []);

  useEffect(() => {
    if (selectedAgency) {
      loadAgencyData(selectedAgency.id);
    } else {
      setUsers([]);
      setGroups([]);
    }
  }, [selectedAgency]);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type, isOpen: true });
    setTimeout(() => {
      setToast(current => {
        if (current && current.message === message) {
          return { ...current, isOpen: false };
        }
        return current;
      });
    }, 4000);
  }

  async function loadAgencies() {
    setLoadingAgencies(true);
    try {
      const data = await SuperAdminAPI.getAgencies();
      setAgencies(data);
      if (data.length > 0) {
        setSelectedAgency(data[0]);
      }
    } catch (error) {
      console.error("Failed to load agencies:", error);
      if (error instanceof Error && error.message === "Unauthorized") {
        showToast("Session expired. Redirecting to login...", "error");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        showToast("Failed to load agencies list", "error");
      }
    } finally {
      setLoadingAgencies(false);
    }
  }

  async function loadAgencyData(agencyId: number) {
    setLoadingAgencyData(true);
    try {
      const [fetchedUsers, fetchedGroups] = await Promise.all([
        SuperAdminAPI.getAgencyUsers(agencyId),
        SuperAdminAPI.getAgencyUserGroups(agencyId)
      ]);
      setUsers(fetchedUsers);
      setGroups(fetchedGroups);
    } catch (error) {
      console.error("Failed to load agency users and groups:", error);
      showToast("Failed to retrieve user group settings", "error");
    } finally {
      setLoadingAgencyData(false);
    }
  }

  // --- Edit User Form Functions ---
  function handleOpenEditUser(user: AgencyUser) {
    setEditingUser(user);
    setUserFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      group_id: user.group_id !== null ? user.group_id : -1
    });
    setEditUserDrawerOpen(true);
  }

  async function handleUserSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUser) return;

    if (!userFormData.name.trim() || !userFormData.email.trim()) {
      showToast("Name and email are required", "error");
      return;
    }

    setSavingUser(true);
    try {
      await SuperAdminAPI.updateAgencyUser(editingUser.id, {
        name: userFormData.name,
        email: userFormData.email,
        role: userFormData.role,
        group_id: userFormData.group_id
      });
      showToast("User settings updated successfully", "success");
      setEditUserDrawerOpen(false);
      if (selectedAgency) {
        loadAgencyData(selectedAgency.id);
      }
    } catch (error) {
      console.error("Failed to update user:", error);
      showToast(error instanceof Error ? error.message : "Failed to save user updates", "error");
    } finally {
      setSavingUser(false);
    }
  }

  // --- User Group Drawer Functions ---
  function handleOpenCreateGroup() {
    setGroupDrawerMode("create");
    setEditingGroup(null);
    setGroupFormData({
      name: "",
      permissions: SCREENS.reduce((acc, screen) => {
        acc[screen] = { read: false, write: false };
        return acc;
      }, {} as Record<string, { read: boolean; write: boolean }>)
    });
    setGroupDrawerOpen(true);
  }

  function handleOpenEditGroup(group: UserGroup) {
    setGroupDrawerMode("edit");
    setEditingGroup(group);
    
    // Merge existing permissions with fallback default list to safeguard against missing module parameters
    const mergedPerms = SCREENS.reduce((acc, screen) => {
      const existing = group.permissions?.[screen];
      acc[screen] = {
        read: existing?.read ?? false,
        write: existing?.write ?? false
      };
      return acc;
    }, {} as Record<string, { read: boolean; write: boolean }>);

    setGroupFormData({
      name: group.name,
      permissions: mergedPerms
    });
    setGroupDrawerOpen(true);
  }

  function handlePermissionChange(screen: string, field: "read" | "write", checked: boolean) {
    setGroupFormData(prev => {
      const updatedPermissions = { ...prev.permissions };
      
      if (field === "write" && checked) {
        // If Write is checked, Read MUST be checked
        updatedPermissions[screen] = { read: true, write: true };
      } else if (field === "read" && !checked) {
        // If Read is unchecked, Write MUST be unchecked
        updatedPermissions[screen] = { read: false, write: false };
      } else {
        updatedPermissions[screen] = {
          ...updatedPermissions[screen],
          [field]: checked
        };
      }

      return {
        ...prev,
        permissions: updatedPermissions
      };
    });
  }

  async function handleGroupSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedAgency) return;

    if (!groupFormData.name.trim()) {
      showToast("Group name is required", "error");
      return;
    }

    setSavingGroup(true);
    try {
      if (groupDrawerMode === "create") {
        await SuperAdminAPI.createAgencyUserGroup(selectedAgency.id, groupFormData);
        showToast("User Permission Group created", "success");
      } else if (editingGroup) {
        await SuperAdminAPI.updateAgencyUserGroup(selectedAgency.id, editingGroup.id, groupFormData);
        showToast("User Permission Group updated", "success");
      }
      setGroupDrawerOpen(false);
      loadAgencyData(selectedAgency.id);
    } catch (error) {
      console.error("Failed to save group:", error);
      showToast(error instanceof Error ? error.message : "Failed to save permission group", "error");
    } finally {
      setSavingGroup(false);
    }
  }

  // --- Deletion Flow ---
  function handleOpenDeleteGroup(group: UserGroup) {
    setDeleteGroupModal({ isOpen: true, group });
  }

  async function confirmDeleteGroup() {
    const group = deleteGroupModal.group;
    if (!selectedAgency || !group) return;

    setDeletingGroup(true);
    try {
      await SuperAdminAPI.deleteAgencyUserGroup(selectedAgency.id, group.id);
      showToast(`Permission Group "${group.name}" deleted successfully`, "success");
      setDeleteGroupModal({ isOpen: false, group: null });
      loadAgencyData(selectedAgency.id);
    } catch (error) {
      console.error("Failed to delete group:", error);
      showToast(error instanceof Error ? error.message : "Failed to delete permission group", "error");
    } finally {
      setDeletingGroup(false);
    }
  }

  // --- Impersonation Flow ---
  async function triggerImpersonation(user: AgencyUser) {
    setImpersonateModal({ isOpen: true, user, token: "", loading: true });
    setCopiedToken(false);
    try {
      const res = await SuperAdminAPI.impersonateUser(user.id);
      setImpersonateModal(prev => ({
        ...prev,
        token: res.token,
        loading: false
      }));
    } catch (error) {
      console.error("Impersonation error:", error);
      showToast("Failed to generate impersonation token", "error");
      setImpersonateModal({ isOpen: false, user: null, token: "", loading: false });
    }
  }

  const copyToClipboard = async () => {
    if (!impersonateModal.token) return;
    try {
      await navigator.clipboard.writeText(impersonateModal.token);
      setCopiedToken(true);
      showToast("Access token copied to clipboard", "success");
      setTimeout(() => setCopiedToken(false), 2000);
    } catch (err) {
      console.error("Failed to copy token:", err);
      showToast("Failed to copy to clipboard", "error");
    }
  };

  // --- Render Fallbacks ---
  if (loadingAgencies) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px auto", width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--brand)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading system organizations...</div>
        </div>
      </div>
    );
  }

  const filteredAgencies = agencies.filter(org =>
    org.name.toLowerCase().includes(searchAgencyQuery.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchAgencyQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUserQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchUserQuery.toLowerCase())
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", minHeight: "calc(100vh - 70px)", background: "var(--bg-main)" }}>
      {/* LEFT SIDEBAR: AGENCY CONTEXT */}
      <div style={{ borderRight: "1px solid var(--border)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "white" }}>
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>Organization Directory</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Select an agency to manage user roles</p>
        </div>

        <div style={{ position: "relative" }}>
          <input
            type="text"
            placeholder="🔍 Search agencies..."
            value={searchAgencyQuery}
            onChange={(e) => setSearchAgencyQuery(e.target.value)}
            className="input"
            style={{ paddingLeft: "32px", fontSize: "13px", height: "36px" }}
          />
        </div>

        {/* Agency List */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
          {filteredAgencies.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "12px" }}>
              No agencies found
            </div>
          ) : (
            filteredAgencies.map((agency) => {
              const isSelected = selectedAgency?.id === agency.id;
              const initials = agency.name.substring(0, 2).toUpperCase();

              return (
                <div
                  key={agency.id}
                  onClick={() => setSelectedAgency(agency)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px",
                    borderRadius: "10px",
                    cursor: "pointer",
                    background: isSelected ? "var(--brand-light)" : "transparent",
                    border: isSelected ? "1px solid var(--brand-alpha)" : "1px solid transparent",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--bg-hover)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {/* Agency Avatar Logo */}
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      style={{ width: "36px", height: "36px", borderRadius: "8px", objectFit: "cover", border: "1px solid var(--border)" }}
                    />
                  ) : (
                    <div style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      background: isSelected ? "var(--brand)" : "#E2E8F0",
                      color: isSelected ? "white" : "var(--text-primary)",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px"
                    }}>
                      {initials}
                    </div>
                  )}

                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: isSelected ? "var(--brand)" : "var(--text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {agency.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>/{agency.slug}</span>
                      {!agency.is_active && (
                        <span style={{ fontSize: "9px", background: "#FCE8E6", color: "#C5221F", padding: "1px 4px", borderRadius: "4px", fontWeight: 700 }}>
                          Suspended
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT MAIN VIEW */}
      <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
        {selectedAgency ? (
          <>
            {/* Header Area */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "12px", color: "var(--brand)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Selected Agency Space
                </span>
                <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)", margin: "4px 0 0 0" }}>
                  {selectedAgency.name}
                </h1>
              </div>

              {/* Toggle Tabs */}
              <div style={{ display: "flex", background: "var(--bg-hover)", padding: "4px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    background: activeTab === "users" ? "white" : "transparent",
                    color: activeTab === "users" ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: activeTab === "users" ? "0 2px 6px rgba(15, 23, 42, 0.06)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  👥 Team Members ({users.length})
                </button>
                <button
                  onClick={() => setActiveTab("groups")}
                  className={`tab-btn ${activeTab === "groups" ? "active" : ""}`}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    background: activeTab === "groups" ? "white" : "transparent",
                    color: activeTab === "groups" ? "var(--text-primary)" : "var(--text-secondary)",
                    boxShadow: activeTab === "groups" ? "0 2px 6px rgba(15, 23, 42, 0.06)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  🛡️ Permission Groups ({groups.length})
                </button>
              </div>
            </div>

            {/* TAB CONTENT: TEAM MEMBERS */}
            {activeTab === "users" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Search / Filter Utility */}
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="text"
                      placeholder="🔍 Filter users by name or email..."
                      value={searchUserQuery}
                      onChange={(e) => setSearchUserQuery(e.target.value)}
                      className="input"
                      style={{ paddingLeft: "36px", fontSize: "14px", height: "40px" }}
                    />
                  </div>
                </div>

                {loadingAgencyData ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-primary)" }}>
                    Loading agency team roster...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", background: "white", borderRadius: "12px", textAlign: "center", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
                    <h4 style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>No Team Members Found</h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>Try clearing your search query or check this agency's setup</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ background: "white", borderRadius: "12px", border: "1px solid var(--border)", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                          <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>User Name</th>
                          <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>System Role</th>
                          <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase" }}>Assigned Group</th>
                          <th style={{ padding: "16px 20px", fontSize: "12px", fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => {
                          const assignedGroup = groups.find(g => g.id === user.group_id);
                          const userInitials = user.name.substring(0, 2).toUpperCase();
                          return (
                            <tr key={user.id} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.2s" }}>
                              <td style={{ padding: "16px 20px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "50%",
                                    background: user.role === "admin" ? "var(--brand)" : "var(--bg-hover)",
                                    color: user.role === "admin" ? "white" : "var(--text-primary)",
                                    fontWeight: 700,
                                    fontSize: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center"
                                  }}>
                                    {userInitials}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>{user.name}</div>
                                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{user.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                <span style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  padding: "4px 10px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.02em",
                                  background: user.role === "admin" 
                                    ? "#F3E8FF" 
                                    : user.role === "manager" 
                                    ? "#E0F2FE" 
                                    : "#F1F5F9",
                                  color: user.role === "admin" 
                                    ? "#6B21A8" 
                                    : user.role === "manager" 
                                    ? "#0369A1" 
                                    : "#475569"
                                }}>
                                  {user.role}
                                </span>
                              </td>
                              <td style={{ padding: "16px 20px" }}>
                                {user.role === "admin" ? (
                                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                    ✨ Full Access (Bypassed)
                                  </span>
                                ) : assignedGroup ? (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "4px 8px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    background: "#F3F4F6",
                                    color: "var(--text-primary)",
                                    border: "1px solid var(--border)"
                                  }}>
                                    🛡️ {assignedGroup.name}
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                                    ⚠️ No Permission Matrix (All Blocked)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: "16px 20px", textAlign: "right" }}>
                                <div style={{ display: "inline-flex", gap: "8px" }}>
                                  <button
                                    onClick={() => handleOpenEditUser(user)}
                                    className="btn btn-outline"
                                    style={{ padding: "6px 12px", fontSize: "12px", height: "32px" }}
                                  >
                                    ✏️ Edit
                                  </button>
                                  <button
                                    onClick={() => triggerImpersonation(user)}
                                    className="btn btn-outline"
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: "12px",
                                      height: "32px",
                                      borderColor: "var(--brand-alpha)",
                                      color: "var(--brand)"
                                    }}
                                  >
                                    🚪 Impersonate
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: PERMISSION GROUPS */}
            {activeTab === "groups" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Custom Permission Schemas</h2>
                    <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>Control screen-wise visibility and operations</p>
                  </div>
                  <button
                    onClick={handleOpenCreateGroup}
                    className="btn btn-primary"
                    style={{ display: "flex", alignItems: "center", gap: "6px", height: "36px", fontSize: "13px" }}
                  >
                    ＋ New Group
                  </button>
                </div>

                {loadingAgencyData ? (
                  <div style={{ padding: "40px", textAlign: "center", color: "var(--text-primary)" }}>
                    Loading permission schema details...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="empty-state" style={{ padding: "40px", background: "white", borderRadius: "12px", textAlign: "center", border: "1px dashed var(--border)" }}>
                    <div style={{ fontSize: "28px", marginBottom: "8px" }}>🛡️</div>
                    <h4 style={{ fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0" }}>No Permission Groups Configured</h4>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: "0 0 16px 0" }}>Create a user group to customize granular menu and operation permissions for your manager and agent users.</p>
                    <button onClick={handleOpenCreateGroup} className="btn btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>
                      ＋ Create First Group
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
                    {groups.map((group) => {
                      // Sum permissions
                      let readCount = 0;
                      let writeCount = 0;
                      if (group.permissions) {
                        Object.values(group.permissions).forEach(perm => {
                          if (perm.read) readCount++;
                          if (perm.write) writeCount++;
                        });
                      }

                      return (
                        <div
                          key={group.id}
                          style={{
                            background: "white",
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            padding: "20px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            boxShadow: "0 4px 12px rgba(15, 23, 42, 0.02)",
                            position: "relative"
                          }}
                        >
                          <div>
                            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                              🛡️ {group.name}
                            </h3>
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                              <span style={{ fontSize: "11px", background: "#EFF6FF", color: "#1D4ED8", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                👁️ {readCount} Read Screens
                              </span>
                              <span style={{ fontSize: "11px", background: "#ECFDF5", color: "#047857", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                ✍️ {writeCount} Write Screens
                              </span>
                            </div>
                          </div>

                          {/* Quick Permission Preview Grid */}
                          <div style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(4, 1fr)",
                            gap: "6px",
                            background: "var(--bg-hover)",
                            padding: "8px",
                            borderRadius: "8px",
                            fontSize: "10px"
                          }}>
                            {SCREENS.map(screen => {
                              const rights = group.permissions?.[screen];
                              const isGreen = rights?.write;
                              const isBlue = rights?.read && !rights?.write;
                              return (
                                <div
                                  key={screen}
                                  title={`${screen.toUpperCase()}: ${rights?.write ? 'Read & Write' : rights?.read ? 'Read Only' : 'Blocked'}`}
                                  style={{
                                    textAlign: "center",
                                    padding: "4px 2px",
                                    borderRadius: "4px",
                                    fontWeight: 600,
                                    textTransform: "capitalize",
                                    background: isGreen ? "#D1FAE5" : isBlue ? "#DBEAFE" : "#F3F4F6",
                                    color: isGreen ? "#065F46" : isBlue ? "#1E40AF" : "#9CA3AF"
                                  }}
                                >
                                  {screen.substring(0, 4)}
                                </div>
                              );
                            })}
                          </div>

                          {/* Actions */}
                          <div style={{ display: "flex", gap: "10px", marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
                            <button
                              onClick={() => handleOpenEditGroup(group)}
                              className="btn btn-outline"
                              style={{ flex: 1, padding: "6px", fontSize: "12px", height: "32px" }}
                            >
                              ✏️ Edit Permissions
                            </button>
                            <button
                              onClick={() => handleOpenDeleteGroup(group)}
                              className="btn btn-outline"
                              style={{
                                width: "36px",
                                height: "32px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderColor: "#FCA5A5",
                                color: "#DC2626"
                              }}
                              title="Delete Group"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="empty-state" style={{ padding: "80px 40px", background: "white", borderRadius: "12px", textAlign: "center", border: "1px dashed var(--border)", marginTop: "40px" }}>
            <div style={{ fontSize: "40px", marginBottom: "16px" }}>🏢</div>
            <h3 style={{ fontWeight: 800, color: "var(--text-primary)", margin: "0 0 6px 0" }}>No Organization Selected</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>Please select an agency from the left pane to manage its user profiles and permission parameters.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: EDIT USER DETAILS DRAWER */}
      {editUserDrawerOpen && editingUser && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setEditUserDrawerOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              animation: "fadeIn 0.2s ease-out"
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "420px",
              background: "white",
              boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border)",
              animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Edit Team Member</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 0 0" }}>Modify role and permission group mapping</p>
              </div>
              <button onClick={() => setEditUserDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--text-secondary)" }}>✕</button>
            </div>

            <form onSubmit={handleUserSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Full Name</label>
                  <input
                    type="text"
                    value={userFormData.name}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Email Address</label>
                  <input
                    type="email"
                    value={userFormData.email}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="input"
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>System Role</label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value as any }))}
                    className="input"
                    style={{ background: "white" }}
                  >
                    <option value="admin">Administrator (Full Access)</option>
                    <option value="manager">Manager</option>
                    <option value="agent">Agent</option>
                  </select>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                    Administrators bypass group-level restrictions and have full read & write privileges.
                  </p>
                </div>

                {userFormData.role !== "admin" && (
                  <div className="input-group">
                    <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Permission Group Assignment</label>
                    <select
                      value={userFormData.group_id}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, group_id: parseInt(e.target.value) }))}
                      className="input"
                      style={{ background: "white" }}
                    >
                      <option value={-1}>⚠️ None (Blocked Access)</option>
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>🛡️ {group.name}</option>
                      ))}
                    </select>
                    <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>
                      Choose a permission group to set screen-wise matrix access. Unassigned managers/agents are blocked from all functions.
                    </p>
                  </div>
                )}
              </div>

              <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px", background: "var(--bg-hover)" }}>
                <button type="button" onClick={() => setEditUserDrawerOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingUser} className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {savingUser ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* MODAL 2: CREATE / EDIT USER GROUP DRAWER */}
      {groupDrawerOpen && (
        <>
          <div
            className="drawer-overlay"
            onClick={() => setGroupDrawerOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(15, 23, 42, 0.4)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
              animation: "fadeIn 0.2s ease-out"
            }}
          />
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "600px",
              background: "white",
              boxShadow: "-8px 0 32px rgba(15, 23, 42, 0.15)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              borderLeft: "1px solid var(--border)",
              animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {groupDrawerMode === "create" ? "Create Permission Group" : "Edit Permission Group"}
                </h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "12px", margin: "4px 0 0 0" }}>
                  Configure granular screen actions for this group schema
                </p>
              </div>
              <button onClick={() => setGroupDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--text-secondary)" }}>✕</button>
            </div>

            <form onSubmit={handleGroupSubmit} style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="input-group">
                  <label className="input-label" style={{ fontWeight: 600, fontSize: "13px" }}>Group / Role Name</label>
                  <input
                    type="text"
                    value={groupFormData.name}
                    onChange={(e) => setGroupFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="input"
                    placeholder="e.g. Senior Itinerary Planners, Basic Support Agents"
                    required
                  />
                </div>

                {/* Granular Screen Matrix Table */}
                <div>
                  <label className="input-label" style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)", marginBottom: "8px", display: "block" }}>
                    Screen-Wise Permission Matrix
                  </label>
                  <div style={{ border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                      <thead>
                        <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                          <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>Screen Module</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center", width: "120px" }}>Read Access</th>
                          <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)", textAlign: "center", width: "120px" }}>Write Access</th>
                        </tr>
                      </thead>
                      <tbody>
                        {SCREENS.map((screen) => {
                          const screenPerm = groupFormData.permissions[screen] || { read: false, write: false };
                          return (
                            <tr key={screen} style={{ borderBottom: "1px solid var(--border)", transition: "background 0.15s" }}>
                              <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--text-primary)" }}>
                                {SCREEN_LABELS[screen] || screen}
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={screenPerm.read}
                                  onChange={(e) => handlePermissionChange(screen, "read", e.target.checked)}
                                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--brand)" }}
                                />
                              </td>
                              <td style={{ padding: "12px 16px", textAlign: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={screenPerm.write}
                                  onChange={(e) => handlePermissionChange(screen, "write", e.target.checked)}
                                  style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "var(--brand)" }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "8px" }}>
                    💡 Checking <strong>Write Access</strong> automatically grants and checks <strong>Read Access</strong>. Unchecking <strong>Read Access</strong> automatically revokes both.
                  </p>
                </div>
              </div>

              <div style={{ padding: "20px 24px", borderTop: "1px solid var(--border)", display: "flex", gap: "12px", background: "var(--bg-hover)" }}>
                <button type="button" onClick={() => setGroupDrawerOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" disabled={savingGroup} className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {savingGroup ? "Saving..." : "Save Group Matrix"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* CONFIRM MODAL: DELETE GROUP */}
      {deleteGroupModal.isOpen && deleteGroupModal.group && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3000,
          animation: "fadeIn 0.2s"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
            width: "450px",
            maxWidth: "90%",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            border: "1px solid var(--border)",
            animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#991B1B", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                ⚠️ Delete Permission Group?
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-primary)", marginTop: "12px", lineHeight: 1.5 }}>
                Are you absolutely sure you want to delete the permission group <strong>&quot;{deleteGroupModal.group.name}&quot;</strong>?
              </p>
              <div style={{ background: "#FEF2F2", color: "#991B1B", border: "1px solid #FEE2E2", borderRadius: "8px", padding: "12px", fontSize: "12px", marginTop: "12px", lineHeight: "1.4" }}>
                <strong>⚠️ Warning:</strong> Active users assigned to this group will have their association cleared and will lose access to all modules until assigned to a new permission group. This action cannot be undone.
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setDeleteGroupModal({ isOpen: false, group: null })}
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteGroup}
                disabled={deletingGroup}
                className="btn"
                style={{
                  background: "#DC2626",
                  color: "white",
                  padding: "8px 16px",
                  fontSize: "13px",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#B91C1C"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#DC2626"}
              >
                {deletingGroup ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: IMPERSONATE USER TOKEN COPY POPUP */}
      {impersonateModal.isOpen && impersonateModal.user && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 3000,
          animation: "fadeIn 0.2s"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            boxShadow: "0 20px 50px rgba(15, 23, 42, 0.15)",
            width: "550px",
            maxWidth: "92%",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            border: "1px solid var(--border)",
            animation: "scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
          }}>
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                🚪 Impersonate Account Access
              </h3>
              <button
                onClick={() => setImpersonateModal({ isOpen: false, user: null, token: "", loading: false })}
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
                Generating secure access authentication credentials for team member:
              </p>
              <div style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--brand)", color: "white", fontWeight: 700, fontSize: "11px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center" }}>
                  {impersonateModal.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>{impersonateModal.user.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>{impersonateModal.user.email} (Role: {impersonateModal.user.role})</div>
                </div>
              </div>

              {impersonateModal.loading ? (
                <div style={{ padding: "20px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}>
                  <div className="spinner" style={{ width: "16px", height: "16px", border: "2px solid var(--border)", borderTop: "2px solid var(--brand)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Generating JWT token signature...</span>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)" }}>Copy impersonation token</label>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <textarea
                        readOnly
                        value={impersonateModal.token}
                        style={{
                          flex: 1,
                          height: "90px",
                          fontFamily: "monospace",
                          fontSize: "11px",
                          borderRadius: "8px",
                          border: "1px solid var(--border)",
                          padding: "10px",
                          background: "#F8FAFC",
                          color: "var(--text-primary)",
                          resize: "none"
                        }}
                        onClick={(e) => (e.target as any).select()}
                      />
                      <button
                        onClick={copyToClipboard}
                        className="btn btn-primary"
                        style={{ height: "90px", width: "80px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px" }}
                      >
                        <span style={{ fontSize: "18px" }}>{copiedToken ? "✅" : "📋"}</span>
                        <span>{copiedToken ? "Copied!" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                  <div style={{ background: "#EFF6FF", color: "#1D4ED8", border: "1px solid #DBEAFE", borderRadius: "8px", padding: "10px", fontSize: "11px", lineHeight: "1.4" }}>
                    ℹ️ <strong>Developer Note:</strong> You can copy this bearer token and set it in your browser storage or API authorization headers under the tenant-level workspace to simulate and verify specific role/screen visibility mappings!
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
              <button
                onClick={() => setImpersonateModal({ isOpen: false, user: null, token: "", loading: false })}
                className="btn btn-outline"
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Close Portal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST COMPONENT */}
      {toast && toast.isOpen && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              background: toast.type === "success" 
                ? "#E6F4EA" 
                : toast.type === "error" 
                ? "#FCE8E6" 
                : "var(--brand-light)",
              color: toast.type === "success" 
                ? "#137333" 
                : toast.type === "error" 
                ? "#C5221F" 
                : "var(--brand)",
              border: toast.type === "success" 
                ? "1px solid #A3E2AB" 
                : toast.type === "error" 
                ? "1px solid #FAD2CF" 
                : "1px solid #D8C1FF",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              zIndex: 9999,
              minWidth: "320px",
              maxWidth: "450px",
              fontSize: "14px",
              fontWeight: 600,
              animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <span style={{ fontSize: "18px" }}>
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span style={{ flex: 1, color: "var(--text-primary)" }}>{toast.message}</span>
            <button
              onClick={() => setToast(current => current ? { ...current, isOpen: false } : null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "16px",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
