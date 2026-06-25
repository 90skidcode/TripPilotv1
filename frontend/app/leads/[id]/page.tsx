"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { leadsApi, followupsApi, leadCostingApi, b2bPartnersApi, leadPaymentsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/cn";
import AddFollowupModal from "../AddFollowupModal";
import FollowupList from "../FollowupList";
import AddLeadSidePanel from "../AddLeadSidePanel";
import AddPaymentModal from "../AddPaymentModal";
import {
  ArrowLeft,
  Pencil,
  Plus,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Handshake,
  Calendar,
  Plane,
  RefreshCw,
  PhoneCall,
  Wallet,
  FileText,
  Hotel,
  Receipt,
  ExternalLink,
  Clock,
  Trash2,
  CreditCard,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const STAGE_STYLES: Record<string, { label: string; className: string }> = {
  fresh: { label: "Fresh", className: "bg-teal-50 text-teal-700 border-teal-200" },
  qualified_hot: { label: "Qualified Hot", className: "bg-red-50 text-red-700 border-red-200" },
  qualified_warm: { label: "Qualified Warm", className: "bg-orange-50 text-orange-700 border-orange-200" },
  won: { label: "Won", className: "bg-green-50 text-green-700 border-green-200" },
  lost: { label: "Lost", className: "bg-gray-100 text-gray-600 border-gray-200" },
  not_responding: { label: "Not Responding", className: "bg-yellow-50 text-yellow-700 border-yellow-200" },
  disqualified: { label: "Disqualified", className: "bg-gray-100 text-gray-600 border-gray-200" },
  future_prospect: { label: "Future Prospect", className: "bg-blue-50 text-blue-700 border-blue-200" },
};

const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");
const fmtDateTime = (d?: string | null) =>
  d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

const TIMELINE_META: Record<string, { icon: React.ComponentType<{ className?: string }>; className: string }> = {
  lead_created: { icon: Plus, className: "bg-blue-100 text-blue-700" },
  stage_changed: { icon: RefreshCw, className: "bg-violet-100 text-violet-700" },
  itinerary_created: { icon: FileText, className: "bg-teal-100 text-teal-700" },
  voucher_created: { icon: Hotel, className: "bg-amber-100 text-amber-700" },
  flight_created: { icon: Plane, className: "bg-sky-100 text-sky-700" },
  partner_linked: { icon: Handshake, className: "bg-indigo-100 text-indigo-700" },
  invoice_created: { icon: Receipt, className: "bg-emerald-100 text-emerald-700" },
  followup_scheduled: { icon: PhoneCall, className: "bg-orange-100 text-orange-700" },
  note: { icon: MessageCircle, className: "bg-gray-100 text-gray-600" },
};

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function EmptyTab({ icon: Icon, label, action }: { icon: React.ComponentType<{ className?: string }>; label: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <Icon className="h-7 w-7" />
      </div>
      <p className="text-sm text-muted-foreground mb-5">{label}</p>
      {action}
    </div>
  );
}

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const leadId = Number(id);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("leads", "write");
  const canItinerary = hasPermission("itinerary", "write");
  const canVoucher = hasPermission("vouchers", "write");
  const canFlight = canVoucher;

  const [lead, setLead] = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [otherLeads, setOtherLeads] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "itineraries" | "vouchers" | "flights" | "b2b" | "invoices" | "payments" | "timeline">("overview");
  const [partnerOptions, setPartnerOptions] = useState<any[]>([]);
  const [showConnectPartner, setShowConnectPartner] = useState(false);
  const [partnerForm, setPartnerForm] = useState({ b2b_partner_id: "", role: "", cost: "", notes: "" });
  const [connecting, setConnecting] = useState(false);
  const [showAddFollowup, setShowAddFollowup] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [costing, setCosting] = useState({ b2b_cost: 0, customer_price: 0, notes: "" });
  const [costingSaving, setCostingSaving] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const [totalPaid, setTotalPaid] = useState(0);
  const [showAddPayment, setShowAddPayment] = useState(false);

  useEffect(() => {
    fetchLead();
    fetchFollowups();
    fetchCosting();
    fetchWorkspace();
    fetchActivities();
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  async function fetchActivities() {
    try {
      setActivities(await leadsApi.activities(leadId));
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    }
  }

  async function openConnectPartner() {
    setPartnerForm({ b2b_partner_id: "", role: "", cost: "", notes: "" });
    setShowConnectPartner(true);
    if (partnerOptions.length === 0) {
      try {
        const res = await b2bPartnersApi.list({ per_page: 200 });
        setPartnerOptions(res?.items || res || []);
      } catch (err) {
        console.error("Failed to load partners:", err);
      }
    }
  }

  async function handleConnectPartner() {
    if (!partnerForm.b2b_partner_id) return;
    setConnecting(true);
    try {
      await leadsApi.connectPartner(leadId, {
        b2b_partner_id: Number(partnerForm.b2b_partner_id),
        role: partnerForm.role || undefined,
        cost: partnerForm.cost ? Number(partnerForm.cost) : undefined,
        notes: partnerForm.notes || undefined,
      });
      setShowConnectPartner(false);
      fetchWorkspace();
      fetchActivities();
    } catch (err) {
      console.error("Failed to connect partner:", err);
    } finally {
      setConnecting(false);
    }
  }

  async function handleDisconnectPartner(linkId: number) {
    if (!confirm("Disconnect this partner from the lead?")) return;
    try {
      await leadsApi.disconnectPartner(leadId, linkId);
      fetchWorkspace();
    } catch (err) {
      console.error("Failed to disconnect partner:", err);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await leadsApi.addNote(leadId, { description: noteText.trim() });
      setNoteText("");
      fetchActivities();
    } catch (err) {
      console.error("Failed to add note:", err);
    } finally {
      setSavingNote(false);
    }
  }

  async function fetchLead() {
    try {
      const data = await leadsApi.get(leadId);
      setLead(data);
      if (data?.customer_id) fetchOtherLeads(data.customer_id, data.id);
    } catch (err) {
      console.error("Failed to fetch lead:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchWorkspace() {
    try {
      setWorkspace(await leadsApi.workspace(leadId));
    } catch (err) {
      console.error("Failed to fetch workspace:", err);
    }
  }

  async function fetchOtherLeads(customerId: number, currentLeadId: number) {
    try {
      const data = await leadsApi.list({ customer_id: customerId });
      if (data?.items) setOtherLeads(data.items.filter((item: any) => item.id !== currentLeadId));
    } catch (err) {
      console.error("Failed to fetch other leads:", err);
    }
  }

  async function fetchFollowups() {
    try {
      const data = await followupsApi.listForLead(leadId);
      setFollowups(
        data.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
      );
    } catch (err) {
      console.error("Failed to fetch followups:", err);
    }
  }

  async function fetchCosting() {
    try {
      const data = await leadCostingApi.get(leadId);
      setCosting({ b2b_cost: data.b2b_cost || 0, customer_price: data.customer_price || 0, notes: data.notes || "" });
    } catch { /* no costing yet */ }
  }

  async function fetchPayments() {
    try {
      const data = await leadPaymentsApi.list(leadId);
      setPayments(data.payments || []);
      setTotalPaid(data.total_paid || 0);
    } catch { /* no payments yet */ }
  }

  async function handleDeletePayment(paymentId: number) {
    if (!confirm("Delete this payment record?")) return;
    try {
      await leadPaymentsApi.delete(leadId, paymentId);
      fetchPayments();
    } catch (err) {
      console.error("Failed to delete payment:", err);
    }
  }

  async function saveCosting() {
    setCostingSaving(true);
    try {
      await leadCostingApi.upsert(leadId, costing);
    } catch (err) {
      console.error("Failed to save costing:", err);
    } finally {
      setCostingSaving(false);
    }
  }

  const stage = lead ? STAGE_STYLES[lead.stage] || { label: lead.stage, className: "bg-gray-100 text-gray-600 border-gray-200" } : null;
  const customer = lead?.customer;
  const showCosting = lead && (lead.stage === "won" || lead.stage === "qualified_hot" || lead.stage === "qualified_warm");
  const margin = costing.customer_price - costing.b2b_cost;
  const counts = workspace?.counts || { itineraries: 0, vouchers: 0, invoices: 0 };

  const customerQs = customer?.id ? `&customer_id=${customer.id}` : "";
  const tabs = [
    { id: "overview", label: "Overview", count: null as number | null },
    { id: "itineraries", label: "Itineraries", count: counts.itineraries },
    { id: "vouchers", label: "Vouchers", count: counts.vouchers },
    { id: "flights", label: "Flights", count: counts.flights ?? 0 },
    { id: "b2b", label: "B2B Partners", count: counts.partners ?? 0 },
    { id: "invoices", label: "Invoices", count: counts.invoices },
    { id: "payments", label: "Payments", count: payments.length },
    { id: "timeline", label: "Timeline", count: activities.length },
  ] as const;

  if (loading) {
    return (
      <AppShell title="Lead Details">
        <PageContainer>
          <div className="flex items-center justify-center min-h-96">
            <Spinner size="lg" />
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!lead) {
    return (
      <AppShell title="Lead Details">
        <PageContainer>
          <div className="flex flex-col items-center justify-center min-h-96 gap-4">
            <p className="text-base font-semibold text-muted-foreground">Lead not found</p>
            <Button variant="outline" onClick={() => router.push("/leads")}>
              <ArrowLeft className="h-4 w-4" /> Back to Leads
            </Button>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Lead Details">
      <PageContainer>
        <div className="space-y-6">
          {/* Back */}
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Leads
          </Link>

          {/* Header */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 py-5">
              <div className="flex items-center gap-4 min-w-0">
                <Avatar name={customer?.name} className="h-12 w-12 text-base" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-foreground truncate">{customer?.name || "Unknown"}</h1>
                    {stage && <Badge className={cn("font-medium", stage.className)}>{stage.label}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {lead.destination || "General Inquiry"}
                    {lead.source ? ` • via ${lead.source}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {customer?.whatsapp_number && (
                  <Button asChild variant="outline" size="lg">
                    <a
                      href={`https://wa.me/${customer.whatsapp_number?.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" /> WhatsApp
                    </a>
                  </Button>
                )}
                {canWrite && (
                  <>
                    <Button variant="outline" size="lg" onClick={() => setShowEdit(true)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="primary" size="lg" onClick={() => setShowAddFollowup(true)}>
                      <Plus className="h-4 w-4" /> Follow-up
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-1 flex-wrap border-b border-border">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                  tab === t.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
                {t.count !== null && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs font-semibold text-muted-foreground">
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Overview tab */}
          {tab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader><CardTitle>Customer Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoRow icon={Phone} label="Phone" value={customer?.phone} />
                    <InfoRow icon={Mail} label="Email" value={customer?.email} />
                    <InfoRow icon={MessageCircle} label="WhatsApp" value={customer?.whatsapp_number} />
                    <InfoRow icon={Calendar} label="Created" value={fmtDate(lead.created_at)} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <InfoRow icon={MapPin} label="Destination" value={lead.destination} />
                    <InfoRow icon={Plane} label="Trip Type" value={lead.trip_type} />
                    <InfoRow icon={Wallet} label="Budget" value={lead.budget} />
                  </CardContent>
                </Card>

                {lead.b2b_partner && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Handshake className="h-4 w-4" /> B2B Partner</CardTitle></CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
                        <span className="font-semibold">{lead.b2b_partner.company_name}</span>
                        <Badge variant="info" className="uppercase">{lead.b2b_partner.category || "partner"}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {showCosting && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-4 w-4" /> Costing</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">B2B Cost (₹)</label>
                          <Input type="number" value={costing.b2b_cost} onChange={(e) => setCosting({ ...costing, b2b_cost: parseFloat(e.target.value) || 0 })} disabled={!canWrite} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Customer Price (₹)</label>
                          <Input type="number" value={costing.customer_price} onChange={(e) => setCosting({ ...costing, customer_price: parseFloat(e.target.value) || 0 })} disabled={!canWrite} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Margin (₹)</label>
                          <div className={cn("h-10 flex items-center px-3 rounded-md border font-bold", margin >= 0 ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700")}>
                            ₹{margin.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>
                      {canWrite && (
                        <Button variant="primary" onClick={saveCosting} disabled={costingSaving}>
                          {costingSaving ? "Saving…" : "Save Costing"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><PhoneCall className="h-4 w-4" /> Follow-ups ({followups.length})</CardTitle>
                    {canWrite && (
                      <Button variant="outline" size="sm" onClick={() => setShowAddFollowup(true)}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {followups.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border p-6 text-center">
                        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
                          <PhoneCall className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-semibold text-foreground mb-1">No follow-ups scheduled</p>
                        <p className="text-xs text-muted-foreground mb-4">
                          {canWrite ? "Schedule a follow-up to stay on top of this lead." : "No scheduled follow-up activities."}
                        </p>
                        {canWrite && (
                          <Button variant="primary" size="sm" onClick={() => setShowAddFollowup(true)}>
                            <Plus className="h-4 w-4" /> Schedule First Follow-up
                          </Button>
                        )}
                      </div>
                    ) : (
                      <FollowupList followups={followups} onUpdated={fetchFollowups} onDeleted={fetchFollowups} canWrite={canWrite} />
                    )}
                  </CardContent>
                </Card>

                {otherLeads.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Other Leads ({otherLeads.length})</CardTitle></CardHeader>
                    <CardContent className="space-y-2.5">
                      {otherLeads.map((ol: any) => {
                        const olStage = STAGE_STYLES[ol.stage] || { label: ol.stage, className: "bg-gray-100 text-gray-600 border-gray-200" };
                        return (
                          <Link key={ol.id} href={`/leads/${ol.id}`} className="block rounded-lg border border-border bg-muted/30 p-3 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="inline-flex items-center gap-1.5 font-semibold text-sm">
                                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                {ol.destination || "General Inquiry"}
                              </span>
                              <Badge className={cn("text-[10px]", olStage.className)}>{olStage.label}</Badge>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                              <span>Source: {ol.source || "—"}</span>
                              <span>{fmtDate(ol.created_at)}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}

          {/* Itineraries tab */}
          {tab === "itineraries" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="h-4 w-4" /> Itineraries</CardTitle>
                {canItinerary && (
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/itinerary/new?lead_id=${leadId}`}><Plus className="h-4 w-4" /> New Itinerary</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className={cn(workspace?.itineraries?.length ? "space-y-2.5" : "p-0")}>
                {!workspace?.itineraries?.length ? (
                  <EmptyTab
                    icon={FileText}
                    label="No itineraries attached to this lead yet."
                    action={canItinerary ? (
                      <Button asChild variant="primary" size="sm">
                        <Link href={`/itinerary/new?lead_id=${leadId}`}><Plus className="h-4 w-4" /> Create Itinerary</Link>
                      </Button>
                    ) : undefined}
                  />
                ) : (
                  workspace.itineraries.map((it: any) => (
                    <Link key={it.id} href={`/itinerary/${it.id}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{it.title || "Untitled itinerary"}</p>
                        <p className="text-xs text-muted-foreground">
                          {it.destination || "—"}
                          {it.total_days ? ` • ${it.total_days}D${it.total_nights ? `/${it.total_nights}N` : ""}` : ""}
                          {it.package_cost ? ` • ${it.package_cost}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{fmtDate(it.created_at)}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Vouchers tab */}
          {tab === "vouchers" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Hotel className="h-4 w-4" /> Hotel Vouchers</CardTitle>
                {canVoucher && (
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/vouchers/new?lead_id=${leadId}${customerQs}`}><Plus className="h-4 w-4" /> New Voucher</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className={cn(workspace?.vouchers?.length ? "space-y-2.5" : "p-0")}>
                {!workspace?.vouchers?.length ? (
                  <EmptyTab
                    icon={Hotel}
                    label="No hotel vouchers attached to this lead yet."
                    action={canVoucher ? (
                      <Button asChild variant="primary" size="sm">
                        <Link href={`/vouchers/new?lead_id=${leadId}${customerQs}`}><Plus className="h-4 w-4" /> Create Voucher</Link>
                      </Button>
                    ) : undefined}
                  />
                ) : (
                  workspace.vouchers.map((v: any) => (
                    <Link key={v.id} href={`/vouchers/${v.id}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{v.hotel_name || "Hotel voucher"}</p>
                        <p className="text-xs text-muted-foreground">
                          {v.room_type || "—"}
                          {v.check_in ? ` • ${fmtDate(v.check_in)}${v.check_out ? ` → ${fmtDate(v.check_out)}` : ""}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{fmtDate(v.created_at)}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Flights tab */}
          {tab === "flights" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Plane className="h-4 w-4" /> Flight Tickets</CardTitle>
                {canFlight && (
                  <Button asChild variant="primary" size="sm">
                    <Link href={`/flights/new?lead_id=${leadId}${customerQs}`}><Plus className="h-4 w-4" /> New Flight</Link>
                  </Button>
                )}
              </CardHeader>
              <CardContent className={cn(workspace?.flights?.length ? "space-y-2.5" : "p-0")}>
                {!workspace?.flights?.length ? (
                  <EmptyTab
                    icon={Plane}
                    label="No flight tickets attached to this lead yet."
                    action={canFlight ? (
                      <Button asChild variant="primary" size="sm">
                        <Link href={`/flights/new?lead_id=${leadId}${customerQs}`}><Plus className="h-4 w-4" /> Add Flight</Link>
                      </Button>
                    ) : undefined}
                  />
                ) : (
                  workspace.flights.map((f: any) => (
                    <Link key={f.id} href={`/flights/${f.id}/pdf`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {f.airline}{f.flight_number ? ` • ${f.flight_number}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {[f.origin, f.destination].filter(Boolean).join(" → ") || "—"}
                          {f.pnr ? ` • PNR ${f.pnr}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-muted-foreground">{fmtDate(f.depart_at || f.created_at)}</span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* B2B Partners tab */}
          {tab === "b2b" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Handshake className="h-4 w-4" /> B2B Partners</CardTitle>
                {canWrite && (
                  <Button variant="primary" size="sm" onClick={openConnectPartner}>
                    <Plus className="h-4 w-4" /> Connect Partner
                  </Button>
                )}
              </CardHeader>
              <CardContent className={cn(workspace?.partners?.length ? "space-y-2.5" : "p-0")}>
                {!workspace?.partners?.length ? (
                  <EmptyTab
                    icon={Handshake}
                    label="No B2B partners connected to this lead yet."
                    action={canWrite ? (
                      <Button variant="primary" size="sm" onClick={openConnectPartner}>
                        <Plus className="h-4 w-4" /> Connect Partner
                      </Button>
                    ) : undefined}
                  />
                ) : (
                  workspace.partners.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm">{p.company_name || `Partner #${p.b2b_partner_id}`}</span>
                          {p.category && <Badge variant="info" className="uppercase text-[10px]">{p.category}</Badge>}
                          {p.role && <Badge className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">{p.role}</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.cost != null ? `Cost: ₹${p.cost.toLocaleString("en-IN")}` : "No cost set"}
                          {p.notes ? ` • ${p.notes}` : ""}
                        </p>
                      </div>
                      {canWrite && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDisconnectPartner(p.id)}
                          title="Disconnect partner"
                          className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoices tab */}
          {tab === "invoices" && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Receipt className="h-4 w-4" /> Invoices</CardTitle>
                <Button asChild variant="primary" size="sm">
                  <Link href={`/invoice?lead_id=${leadId}`}><Plus className="h-4 w-4" /> New Invoice</Link>
                </Button>
              </CardHeader>
              <CardContent className={cn(workspace?.invoices?.length ? "space-y-2.5" : "p-0")}>
                {!workspace?.invoices?.length ? (
                  <EmptyTab
                    icon={Receipt}
                    label="No invoices attached to this lead yet."
                    action={(
                      <Button asChild variant="primary" size="sm">
                        <Link href={`/invoice?lead_id=${leadId}`}><Plus className="h-4 w-4" /> Create Invoice</Link>
                      </Button>
                    )}
                  />
                ) : (
                  workspace.invoices.map((inv: any) => (
                    <Link key={inv.id} href={`/invoice?lead_id=${leadId}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5 hover:border-primary/50 hover:bg-muted/60 transition-colors">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{inv.invoice_number || `Invoice #${inv.id}`}</p>
                        <p className="text-xs text-muted-foreground">{inv.grand_total ? `₹${inv.grand_total}` : "—"}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={inv.status === "paid" ? "success" : inv.status === "cancelled" ? "destructive" : "default"} className="capitalize">
                          {inv.status || "draft"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{fmtDate(inv.created_at)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </CardContent>
            </Card>
          )}

          {/* Payments tab */}
          {tab === "payments" && (() => {
            const customerPrice = costing.customer_price || 0;
            const outstanding = Math.max(0, customerPrice - totalPaid);
            const isPaidFull = customerPrice > 0 && outstanding === 0;
            const paidPct = customerPrice > 0 ? Math.min(100, (totalPaid / customerPrice) * 100) : 0;

            return (
              <div className="space-y-4">
                {/* Summary cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <Wallet className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Price</p>
                        <p className="text-lg font-bold text-foreground">₹{customerPrice.toLocaleString("en-IN")}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Paid</p>
                        <p className="text-lg font-bold text-green-700">₹{totalPaid.toLocaleString("en-IN")}</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4 flex items-center gap-3">
                      <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", isPaidFull ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Outstanding</p>
                        <p className={cn("text-lg font-bold", isPaidFull ? "text-green-700" : "text-red-600")}>
                          {isPaidFull ? "Fully Paid" : `₹${outstanding.toLocaleString("en-IN")}`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress bar */}
                {customerPrice > 0 && (
                  <Card>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">Payment Progress</span>
                        <span className="text-sm font-bold text-primary">{paidPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-500", isPaidFull ? "bg-green-500" : "bg-primary")}
                          style={{ width: `${paidPct}%` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Payment list */}
                <Card>
                  <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Records</CardTitle>
                    {canWrite && (
                      <Button variant="primary" size="sm" onClick={() => setShowAddPayment(true)}>
                        <Plus className="h-4 w-4" /> Add Payment
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className={cn(payments.length ? "space-y-2.5" : "p-0")}>
                    {payments.length === 0 ? (
                      <EmptyTab
                        icon={CreditCard}
                        label="No payments recorded yet."
                        action={canWrite ? (
                          <Button variant="primary" size="sm" onClick={() => setShowAddPayment(true)}>
                            <Plus className="h-4 w-4" /> Record First Payment
                          </Button>
                        ) : undefined}
                      />
                    ) : (
                      payments.map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold", p.payment_type === "full" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700")}>
                              {p.payment_type === "full" ? "F" : "P"}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</span>
                                <Badge className={cn("capitalize text-[10px]", p.payment_type === "full" ? "bg-green-50 text-green-700 border-green-200" : "bg-blue-50 text-blue-700 border-blue-200")}>
                                  {p.payment_type}
                                </Badge>
                                <Badge className="bg-muted text-muted-foreground border-border text-[10px] capitalize">
                                  {p.payment_method?.replace("_", " ")}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.payment_date ? new Date(p.payment_date).toLocaleDateString("en-IN") : "—"}
                                {p.reference_number ? ` • Ref: ${p.reference_number}` : ""}
                                {p.notes ? ` • ${p.notes}` : ""}
                              </p>
                            </div>
                          </div>
                          {canWrite && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeletePayment(p.id)}
                              title="Delete payment"
                              className="hover:bg-destructive/10 hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Timeline tab */}
          {tab === "timeline" && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4" /> Activity Timeline</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                {/* Note composer */}
                {canWrite && (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 p-3">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Add a note to this lead's timeline…"
                      rows={2}
                      className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
                    />
                    <div className="flex justify-end">
                      <Button variant="primary" size="sm" onClick={handleAddNote} disabled={savingNote || !noteText.trim()}>
                        <Plus className="h-4 w-4" /> {savingNote ? "Adding…" : "Add Note"}
                      </Button>
                    </div>
                  </div>
                )}

                {activities.length === 0 ? (
                  <EmptyTab icon={Clock} label="No activity yet. Events and notes will appear here." />
                ) : (
                  <ol className="relative space-y-5 pl-2">
                    {activities.map((a: any, idx: number) => {
                      const meta = TIMELINE_META[a.type] || { icon: Clock, className: "bg-gray-100 text-gray-600" };
                      const Icon = meta.icon;
                      return (
                        <li key={a.id} className="relative flex gap-3">
                          {/* connector line */}
                          {idx < activities.length - 1 && (
                            <span className="absolute left-[15px] top-8 bottom-[-20px] w-px bg-border" aria-hidden />
                          )}
                          <span className={cn("relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", meta.className)}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1 pb-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-foreground">{a.title}</p>
                              <span className="text-xs text-muted-foreground shrink-0">{fmtDateTime(a.created_at)}</span>
                            </div>
                            {a.description && <p className="text-sm text-muted-foreground mt-0.5 whitespace-pre-wrap">{a.description}</p>}
                            {a.actor_name && <p className="text-xs text-muted-foreground mt-0.5">by {a.actor_name}</p>}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </PageContainer>

      {showAddFollowup && (
        <AddFollowupModal
          leadId={leadId}
          onClose={() => setShowAddFollowup(false)}
          onSaved={() => {
            setShowAddFollowup(false);
            fetchFollowups();
          }}
        />
      )}

      {showEdit && (
        <AddLeadSidePanel
          lead={lead}
          initialUseAi={false}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            fetchLead();
          }}
        />
      )}

      {showAddPayment && (
        <AddPaymentModal
          leadId={leadId}
          totalPrice={costing.customer_price || 0}
          totalPaid={totalPaid}
          onClose={() => setShowAddPayment(false)}
          onSaved={() => {
            setShowAddPayment(false);
            fetchPayments();
          }}
        />
      )}

      {showConnectPartner && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowConnectPartner(false)}
        >
          <div className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-base font-semibold">Connect B2B Partner</h2>
              <button onClick={() => setShowConnectPartner(false)} aria-label="Close" className="text-lg leading-none text-muted-foreground hover:text-foreground">
                ✕
              </button>
            </div>
            <div className="space-y-4 p-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Partner *</label>
                <select
                  value={partnerForm.b2b_partner_id}
                  onChange={(e) => setPartnerForm((f) => ({ ...f, b2b_partner_id: e.target.value }))}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus-ring"
                >
                  <option value="">Select a partner…</option>
                  {partnerOptions.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.company_name}{p.category ? ` (${p.category})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Role</label>
                  <Input value={partnerForm.role} onChange={(e) => setPartnerForm((f) => ({ ...f, role: e.target.value }))} placeholder="e.g. DMC" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cost (₹)</label>
                  <Input type="number" value={partnerForm.cost} onChange={(e) => setPartnerForm((f) => ({ ...f, cost: e.target.value }))} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Notes</label>
                <Input value={partnerForm.notes} onChange={(e) => setPartnerForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-border p-4">
              <Button variant="ghost" onClick={() => setShowConnectPartner(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleConnectPartner} disabled={connecting || !partnerForm.b2b_partner_id}>
                {connecting ? "Connecting…" : "Connect"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
