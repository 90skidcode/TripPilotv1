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
import { authApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "agency">("profile");

  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const [agencyName, setAgencyName] = useState("TripPilot Travel Solutions");
  const [agencyAddress, setAgencyAddress] = useState("404 Silicon Tower, Sector 62, Noida, UP, 201301");
  const [agencyGst, setAgencyGst] = useState("09AAACP4040N1ZX");
  const [bankHolder, setBankHolder] = useState("PLAN NATRIP TOUR AND TRAVELS LTD");
  const [bankAccount, setBankAccount] = useState("50200067891234");
  const [bankName, setBankName] = useState("HDFC Bank");
  const [bankIfsc, setBankIfsc] = useState("HDFC0001202");

  useEffect(() => {
    loadProfile();
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("agency_name");
      const storedAddr = localStorage.getItem("agency_address");
      const storedGst = localStorage.getItem("agency_gst");
      const storedHolder = localStorage.getItem("agency_bank_holder");
      const storedAcc = localStorage.getItem("agency_bank_acc");
      const storedBName = localStorage.getItem("agency_bank_name");
      const storedIfsc = localStorage.getItem("agency_bank_ifsc");

      if (storedName) setAgencyName(storedName);
      if (storedAddr) setAgencyAddress(storedAddr);
      if (storedGst) setAgencyGst(storedGst);
      if (storedHolder) setBankHolder(storedHolder);
      if (storedAcc) setBankAccount(storedAcc);
      if (storedBName) setBankName(storedBName);
      if (storedIfsc) setBankIfsc(storedIfsc);
    }
  }, []);

  async function loadProfile() {
    try {
      const me = await authApi.me();
      setUser(me);
      setName(me.name || "");
      setEmail(me.email || "");
      setRole(me.role || "agent");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
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

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
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

  function handleSaveAgencyDefaults(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("agency_name", agencyName);
      localStorage.setItem("agency_address", agencyAddress);
      localStorage.setItem("agency_gst", agencyGst);
      localStorage.setItem("agency_bank_holder", bankHolder);
      localStorage.setItem("agency_bank_acc", bankAccount);
      localStorage.setItem("agency_bank_name", bankName);
      localStorage.setItem("agency_bank_ifsc", bankIfsc);
    }
    showToast({ type: "success", message: "Agency defaults and banking variables saved successfully!" });
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

  const tabs = [
    { id: "profile", label: "👤 User Profile" },
    { id: "security", label: "🔒 Security & Password" },
    { id: "agency", label: "🏢 Agency Defaults" },
  ] as const;

  return (
    <AppShell title="Settings">
      <PageContainer>
        <div className="max-w-2xl mx-auto space-y-6">
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
              <form onSubmit={handleUpdateProfile} className="space-y-6">
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
              <form onSubmit={handleUpdatePassword} className="space-y-6">
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

            {/* Agency Tab */}
            {activeTab === "agency" && (
              <form onSubmit={handleSaveAgencyDefaults} className="space-y-6">
                <Section
                  title="Agency Defaults & Template Constants"
                  description="Variables configured here will automatically populate headers inside newly generated Hotel Vouchers and Customer Billing Invoices."
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                        required
                        value={agencyGst}
                        onChange={(e) => setAgencyGst(e.target.value)}
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
                  <Button type="submit" variant="primary">
                    Save Global Agency Defaults
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
    </AppShell>
  );
}
