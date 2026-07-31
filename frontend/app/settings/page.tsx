"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer, Section } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { authApi, orgApi, userGroupsApi, uploadApi, resolveAssetUrl } from "@/lib/api";
import { Building2, Upload } from "lucide-react";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { showToast } = useToast();
  const { hasPermission, refreshUser } = useAuth();
  const canViewTeam = hasPermission("users", "read");
  const canManageTeam = hasPermission("users", "write");
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "agency" | "team">("profile");

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [clearConfirm, setClearConfirm] = useState("");
  const [clearing, setClearing] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);

  const [agencyName, setAgencyName] = useState("");
  const [agencyAddress, setAgencyAddress] = useState("");
  const [agencyGst, setAgencyGst] = useState("");
  const [website, setWebsite] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [savingAgency, setSavingAgency] = useState(false);

  // Team Members state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [userGroups, setUserGroups] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    password: "",
    group_id: null as number | null,
  });

  // User Group Management state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
  });

  useEffect(() => {
    loadProfile();
    loadTeamMembers();
    loadUserGroups();
  }, []);

  async function loadProfile() {
    try {
      const me = await authApi.me();
      setUser(me);
      setName(me.name || "");
      setEmail(me.email || "");
      setRole(me.role || "agent");
      // Agency defaults live on the organization record — every agency sees
      // its own values instead of shared hardcoded constants.
      setAgencyName(me.agency_name || "");
      setAgencyAddress(me.agency_office_address || "");
      setAgencyGst(me.gstin || "");
      setWebsite(me.website || "");
      setBankHolder(me.bank_holder_name || "");
      setBankAccount(me.bank_account_number || "");
      setBankName(me.bank_name || "");
      setBankIfsc(me.bank_ifsc || "");
      setLogoUrl(me.logo_url || "");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast({ type: "error", message: "Please select an image file" });
      return;
    }
    setUploadingLogo(true);
    try {
      const url = await uploadApi.image(file);
      // Persist immediately so the logo isn't lost if the agency doesn't
      // also click "Save" for the other fields below.
      const updated = await authApi.updateMe({ logo_url: url });
      setLogoUrl(updated.logo_url || url);
      setUser(updated);
      // Refreshes the cached auth user so the sidebar logo updates right away
      await refreshUser();
      showToast({ type: "success", message: "Agency logo updated!" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to upload logo" });
    } finally {
      setUploadingLogo(false);
      e.target.value = "";
    }
  }

  async function loadTeamMembers() {
    setLoadingTeam(true);
    try {
      const members = await authApi.listUsers();
      setTeamMembers(members);
    } catch (err) {
      console.error("Failed to load team members:", err);
      showToast({ type: "error", message: "Failed to load team members" });
    } finally {
      setLoadingTeam(false);
    }
  }

  async function loadUserGroups() {
    try {
      const groups = await userGroupsApi.list();
      setUserGroups(groups);
      if (groups.length > 0 && !newMember.group_id) {
        setNewMember(prev => ({ ...prev, group_id: groups[0].id }));
      }
    } catch (err) {
      console.error("Failed to load user groups:", err);
    }
  }

  async function handleAddMember() {
    if (!newMember.name || !newMember.email || !newMember.password) {
      showToast({ type: "error", message: "Please fill in all required fields" });
      return;
    }
    if (newMember.password.length < 6) {
      showToast({ type: "error", message: "Password must be at least 6 characters" });
      return;
    }

    setAddingMember(true);
    try {
      await authApi.createUser({
        name: newMember.name,
        email: newMember.email,
        password: newMember.password,
        group_id: newMember.group_id,
      });
      showToast({ type: "success", message: "Team member added successfully!" });
      setNewMember({ name: "", email: "", password: "", group_id: userGroups.length > 0 ? userGroups[0].id : null });
      setShowAddMember(false);
      loadTeamMembers();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to add team member" });
    } finally {
      setAddingMember(false);
    }
  }

  async function handleCreateGroup() {
    if (!newGroup.name.trim()) {
      showToast({ type: "error", message: "Group name is required" });
      return;
    }

    setCreatingGroup(true);
    try {
      await userGroupsApi.create({
        name: newGroup.name,
        permissions: {
          leads: { read: false, write: false },
          itinerary: { read: false, write: false },
          vouchers: { read: false, write: false },
          inventory: { read: false, write: false },
          dashboard: { read: false, write: false },
          settings: { read: false, write: false },
          users: { read: false, write: false },
        },
      });
      showToast({ type: "success", message: "User group created successfully!" });
      setNewGroup({ name: "" });
      setShowGroupForm(false);
      loadUserGroups();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to create user group" });
    } finally {
      setCreatingGroup(false);
    }
  }

  async function handleDeleteGroup(groupId: number) {
    if (!confirm("Are you sure you want to delete this user group?")) return;

    try {
      await userGroupsApi.delete(groupId);
      showToast({ type: "success", message: "User group deleted successfully!" });
      loadUserGroups();
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to delete user group" });
    }
  }

  async function handleUpdateProfile() {
    if (!name || !email) {
      showToast({ type: "error", message: "Name and Email are required fields." });
      return;
    }
    try {
      const updated = await authApi.updateMe({ name, email });
      setUser(updated);
      showToast({ type: "success", message: "User profile information saved!" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to update profile." });
    }
  }

  async function handleUpdatePassword() {
    if (password.length < 6) {
      showToast({ type: "error", message: "Password must be at least 6 characters long." });
      return;
    }
    if (password !== confirmPassword) {
      showToast({ type: "error", message: "Passwords do not match." });
      return;
    }
    setUpdatingPassword(true);
    try {
      await authApi.updateMe({ password });
      setPassword("");
      setConfirmPassword("");
      showToast({ type: "success", message: "Security credentials updated successfully!" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to update password." });
    } finally {
      setUpdatingPassword(false);
    }
  }

  async function handleClearData() {
    if (clearConfirm !== "DELETE") return;
    setClearing(true);
    try {
      await orgApi.clearData();
      showToast({ type: "success", message: "All transactional records cleared successfully." });
      setShowClearModal(false);
      setClearConfirm("");
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to clear data." });
    } finally {
      setClearing(false);
    }
  }

  async function handleSaveAgencyDefaults() {
    setSavingAgency(true);
    try {
      const updated = await authApi.updateMe({
        agency_name: agencyName,
        agency_office_address: agencyAddress,
        gstin: agencyGst,
        website: website,
        bank_holder_name: bankHolder,
        bank_account_number: bankAccount,
        bank_name: bankName,
        bank_ifsc: bankIfsc,
      });
      setUser(updated);
      showToast({ type: "success", message: "Agency defaults and banking variables saved successfully!" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to save agency defaults" });
    } finally {
      setSavingAgency(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="System Settings">
        <PageContainer>
          <PageHeader title="System Settings" />
          <div className="flex items-center justify-center min-h-96">
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center">
                <Spinner className="mb-4" />
                <p className="text-base font-semibold text-muted-foreground">
                  Decrypting environment configuration...
                </p>
              </div>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const tabs: { id: "profile" | "security" | "team" | "agency"; label: string }[] = [
    { id: "profile", label: "👤 User Profile" },
    { id: "security", label: "🔒 Security & Password" },
    ...(canViewTeam ? [{ id: "team" as const, label: "👥 Team Members" }] : []),
    { id: "agency", label: "🏢 Agency Defaults" },
  ];

  return (
    <AppShell title="Settings">
      <PageContainer>
        <div className="mx-auto space-y-6">
        <PageHeader
          title="Account & Agency Settings"
          description="Manage user profile credentials, update security permissions, and configure defaults."
        />

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition-colors",
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <Card>
          <CardContent className="pt-6">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateProfile(); }} className="space-y-6">
                <Section title="Profile Details">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Assigned Account Role</Label>
                      <Input
                        id="role"
                        type="text"
                        disabled
                        value={role.toUpperCase()}
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org_id">Organization ID</Label>
                      <Input
                        id="org_id"
                        type="text"
                        disabled
                        value={user?.org_id || "1"}
                        className="bg-muted cursor-not-allowed"
                      />
                    </div>
                  </div>
                </Section>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" variant="primary">
                    Save Profile Settings
                  </Button>
                </div>
              </form>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(); }} className="space-y-6">
                <Section
                  title="Reset Account Password"
                  description="Keep your travel agency portals locked down securely by refreshing password metrics regularly."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Secure Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password exactly"
                      />
                    </div>
                  </div>
                </Section>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={updatingPassword}
                  >
                    {updatingPassword ? "Modifying credentials..." : "Update Password Credentials"}
                  </Button>
                </div>
              </form>
            )}

            {/* Team Members Tab */}
            {activeTab === "team" && canViewTeam && (
              <div className="space-y-6">
                {/* User Groups Section */}
                <Section
                  title="User Groups & Permissions"
                  description="User groups control which screens each team member can access. Screen permissions are configured by the platform admin."
                >
                  {userGroups.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-border rounded-lg">
                      <p className="text-muted-foreground mb-4">No user groups yet</p>
                      {canManageTeam && (
                        <Button variant="primary" size="sm" onClick={() => setShowGroupForm(true)}>
                          Create First Group
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userGroups.map((group) => (
                        <div key={group.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                          <div>
                            <p className="font-medium text-sm">{group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Access: {Object.entries(group.permissions || {})
                                .filter(([, p]: [string, any]) => p?.read || p?.write)
                                .map(([screen]) => screen)
                                .join(", ") || "No screens"}
                            </p>
                          </div>
                          {canManageTeam && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                <Separator />

                {canManageTeam && (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">Create New Group</h3>
                    <p className="text-xs text-muted-foreground mt-1">Set up a new user group with specific permissions</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowGroupForm(!showGroupForm)}
                  >
                    {showGroupForm ? "Cancel" : "+ New Group"}
                  </Button>
                </div>
                )}

                {canManageTeam && showGroupForm && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="space-y-2">
                      <Label htmlFor="group_name">Group Name *</Label>
                      <Input
                        id="group_name"
                        type="text"
                        placeholder="e.g., Senior Agents, Managers"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ name: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">You can configure detailed permissions after creating the group</p>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowGroupForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleCreateGroup}
                        disabled={creatingGroup}
                      >
                        {creatingGroup ? "Creating..." : "Create Group"}
                      </Button>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Team Members Section */}
                <Section
                  title="Team Members"
                  description="Add and manage team members for your agency"
                >
                  {loadingTeam ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">Loading team members...</p>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No team members yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamMembers.map((member) => {
                        const groupName = userGroups.find(g => g.id === member.group_id)?.name || "No Group";
                        return (
                          <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50">
                            <div>
                              <p className="font-medium text-sm">{member.name}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                              {groupName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Section>

                <Separator />

                {canManageTeam && (
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-sm">Add New Team Member</h3>
                    <p className="text-xs text-muted-foreground mt-1">Invite a new user to join your agency</p>
                  </div>
                  <Button
                    variant="primary"
                    onClick={() => setShowAddMember(!showAddMember)}
                    disabled={userGroups.length === 0}
                  >
                    {showAddMember ? "Cancel" : "+ Add Member"}
                  </Button>
                </div>
                )}

                {canManageTeam && userGroups.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs text-amber-800">Create at least one user group before adding team members</p>
                  </div>
                )}

                {canManageTeam && showAddMember && userGroups.length > 0 && (
                  <div className="border border-border rounded-lg p-4 space-y-4 bg-muted/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="member_name">Full Name *</Label>
                        <Input
                          id="member_name"
                          type="text"
                          placeholder="John Doe"
                          value={newMember.name}
                          onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member_email">Email Address *</Label>
                        <Input
                          id="member_email"
                          type="email"
                          placeholder="john@example.com"
                          value={newMember.email}
                          onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="member_password">Password *</Label>
                        <Input
                          id="member_password"
                          type="password"
                          placeholder="Min. 6 characters"
                          value={newMember.password}
                          onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member_group">User Group *</Label>
                        <select
                          id="member_group"
                          value={newMember.group_id || ""}
                          onChange={(e) => setNewMember({ ...newMember, group_id: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
                        >
                          <option value="">Select a group</option>
                          {userGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setShowAddMember(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleAddMember}
                        disabled={addingMember}
                      >
                        {addingMember ? "Adding..." : "Add Team Member"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Agency Tab */}
            {activeTab === "agency" && (
              <form onSubmit={(e) => { e.preventDefault(); handleSaveAgencyDefaults(); }} className="space-y-6">
                <Section
                  title="Agency Defaults & Template Constants"
                  description="Variables configured here will automatically populate headers inside newly generated Hotel Vouchers and Customer Billing Invoices."
                >
                  <div className="space-y-2">
                    <Label>Agency Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden shrink-0">
                        {logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveAssetUrl(logoUrl) || undefined} alt="Agency logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <label htmlFor="logoUpload">
                          <span className={cn(
                            "inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border text-sm font-medium cursor-pointer hover:bg-muted transition-colors",
                            uploadingLogo && "opacity-60 pointer-events-none"
                          )}>
                            <Upload className="w-4 h-4" />
                            {uploadingLogo ? "Uploading..." : logoUrl ? "Replace Logo" : "Upload Logo"}
                          </span>
                        </label>
                        <input
                          id="logoUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleLogoSelected}
                          disabled={uploadingLogo}
                        />
                        <p className="text-xs text-muted-foreground mt-1">PNG or JPG. Appears on your itinerary, voucher, and invoice headers.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="agencyName">Registered Agency Name</Label>
                      <Input
                        id="agencyName"
                        type="text"
                        required
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencyGst">Agency GSTIN Number</Label>
                      <Input
                        id="agencyGst"
                        type="text"
                        value={agencyGst}
                        onChange={(e) => setAgencyGst(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">Agency Website</Label>
                      <Input
                        id="website"
                        type="text"
                        placeholder="https://..."
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="agencyAddress">Default Office Address</Label>
                    <Textarea
                      id="agencyAddress"
                      required
                      value={agencyAddress}
                      onChange={(e) => setAgencyAddress(e.target.value)}
                      rows={2}
                    />
                  </div>
                </Section>

                <Separator />

                <Section title="🏦 Standard Agency Banking Default (For Invoice Payouts)">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankHolder">Beneficiary Holder Name</Label>
                      <Input
                        id="bankHolder"
                        type="text"
                        required
                        value={bankHolder}
                        onChange={(e) => setBankHolder(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Bank Account Number</Label>
                      <Input
                        id="bankAccount"
                        type="text"
                        required
                        value={bankAccount}
                        onChange={(e) => setBankAccount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank & Branch Name</Label>
                      <Input
                        id="bankName"
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bankIfsc">IFSC Code</Label>
                      <Input
                        id="bankIfsc"
                        type="text"
                        required
                        value={bankIfsc}
                        onChange={(e) => setBankIfsc(e.target.value)}
                      />
                    </div>
                  </div>
                </Section>

                <Separator />

                <div className="flex justify-end">
                  <Button type="submit" variant="primary" disabled={savingAgency}>
                    {savingAgency ? "Saving..." : "Save Global Agency Defaults"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 text-base">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions that affect your organisation's data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="font-semibold text-sm text-gray-800">Clear All Records</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Permanently deletes all leads, itineraries, vouchers, invoices, flight tickets, messages,
                  customers, B2B partners, and inventory. Only users and organisation settings are kept.
                </p>
              </div>
              <Button variant="destructive" onClick={() => { setClearConfirm(""); setShowClearModal(true); }}>
                Clear All Records
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
            <h2 className="text-lg font-bold text-red-600 mb-1">Clear All Records?</h2>
            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete all <strong>leads, itineraries, hotel vouchers, invoices, flight tickets,
              and messages</strong> for your organisation. This cannot be undone.
            </p>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Type <span className="font-mono bg-red-50 text-red-700 px-1 rounded">DELETE</span> to confirm:
            </p>
            <Input
              value={clearConfirm}
              onChange={(e) => setClearConfirm(e.target.value)}
              placeholder="DELETE"
              className="mb-4 font-mono"
              autoFocus
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClearModal(false)}>Cancel</Button>
              <Button
                variant="destructive"
                disabled={clearConfirm !== "DELETE" || clearing}
                onClick={handleClearData}
              >
                {clearing ? "Clearing…" : "Yes, Clear All Records"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
    </AppShell>
  );
}
