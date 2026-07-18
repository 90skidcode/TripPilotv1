"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pricingApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { CreditCard, Calendar, AlertCircle, CheckCircle, History } from "lucide-react";

const HISTORY_ACTION_LABELS: Record<string, string> = {
  extended: "Payment received — subscription extended",
  created: "Subscription started",
  plan_changed: "Plan changed",
  downgrade_scheduled: "Plan change scheduled",
  activated: "Plan activated",
  past_due: "Payment due",
  expired: "Subscription expired",
  cancelled: "Subscription cancelled",
};

const STATUS_LABELS: Record<string, string> = {
  trialing: "Trial",
  active: "Active",
  past_due: "Past Due",
  expired: "Expired",
  cancelled: "Cancelled",
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  upi: "UPI",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  cheque: "Cheque",
  other: "Other",
};

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [usage, setUsage] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBillingData();
  }, []);

  async function loadBillingData() {
    try {
      const [usageData, subData] = await Promise.all([
        pricingApi.usage(),
        pricingApi.getCurrentSubscription(),
      ]);
      setUsage(usageData);
      setSubscription(subData);
    } catch (error) {
      showToast({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to load billing data",
      });
    } finally {
      setLoading(false);
    }

    // History/invoices are supplementary — a failure must not blank the page
    try {
      setHistory(await pricingApi.billingHistory());
    } catch {
      setHistory([]);
    }
    try {
      setInvoices(await pricingApi.openInvoices());
    } catch {
      setInvoices([]);
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const daysUntilRenewal = subscription?.renewal_date
    ? Math.ceil(
        (new Date(subscription.renewal_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  if (loading) {
    return (
      <AppShell title="Billing">
        <PageContainer>
          <div className="flex items-center justify-center min-h-96">
            <p className="text-muted-foreground">Loading billing information...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  if (!usage || !subscription) {
    return (
      <AppShell title="Billing">
        <PageContainer>
          <div className="flex items-center justify-center min-h-96">
            <p className="text-muted-foreground">Unable to load billing information</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Billing">
      <PageContainer>
        <div className="space-y-8">
          {/* Header */}
          <div>
            <PageHeader
              title="Billing & Subscription"
              description="Manage your subscription and view usage"
            />
          </div>

          {/* Status Banner */}
          {(() => {
            if (subscription.status === "expired" || subscription.status === "cancelled") {
              return (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-destructive">Subscription Expired</p>
                    <p className="text-sm text-destructive/80 mt-1">
                      Your subscription has expired and you have read-only access. Renewals are
                      handled by the TripPilot team — contact us to renew.
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => { window.location.href = "mailto:support@trippilot.com?subject=Subscription renewal"; }}
                      className="mt-3"
                    >
                      Contact us to renew
                    </Button>
                  </div>
                </div>
              );
            }
            if (subscription.status === "past_due") {
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Payment Due</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Your renewal payment is due. You keep full access during the grace period —
                      see the invoice below for the amount and payment details.
                    </p>
                  </div>
                </div>
              );
            }
            if (subscription.status === "trialing") {
              const trialDays = subscription.trial_ends_at
                ? Math.max(0, Math.ceil((new Date(subscription.trial_ends_at).getTime() - Date.now()) / 86400000))
                : null;
              return (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900">Free Trial</p>
                    <p className="text-sm text-blue-800 mt-1">
                      You have full access{trialDays !== null ? ` for ${trialDays} more ${trialDays === 1 ? "day" : "days"}` : ""}.
                      Contact the TripPilot team when you're ready to pick a plan.
                    </p>
                  </div>
                </div>
              );
            }
            if (daysUntilRenewal !== null && daysUntilRenewal <= 3) {
              return (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Subscription Renewing Soon</p>
                    <p className="text-sm text-amber-800 mt-1">
                      Your subscription renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? "day" : "days"}.
                    </p>
                  </div>
                </div>
              );
            }
            return (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Subscription Active</p>
                  <p className="text-sm text-green-800 mt-1">
                    Your subscription is active and in good standing.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Due invoices — pay offline, the TripPilot team confirms */}
          {invoices.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-amber-900">Payment Due</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoices.map((inv) => (
                  <div key={inv.id} className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg p-4">
                    <div>
                      <p className="font-semibold">
                        {inv.invoice_type === "upgrade" ? "Upgrade charge" : "Renewal"} — {inv.plan_name}
                        {inv.billing_cycle && (
                          <span className="text-muted-foreground font-normal"> ({inv.billing_cycle.replace("_", "-")})</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Period {formatDate(inv.period_start)} – {formatDate(inv.period_end)} · Due {formatDate(inv.due_date)}
                      </p>
                    </div>
                    <p className="text-2xl font-bold">₹{(inv.amount ?? 0).toLocaleString("en-IN")}</p>
                  </div>
                ))}
                <p className="text-sm text-muted-foreground">
                  Pay via bank transfer or UPI and share the reference with the TripPilot team —
                  your subscription is extended as soon as the payment is confirmed.{" "}
                  <Button variant="link" className="px-0" onClick={() => { window.location.href = "mailto:support@trippilot.com?subject=Renewal payment"; }}>
                    Contact us
                  </Button>
                </p>
              </CardContent>
            </Card>
          )}

          {/* Current Plan Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Current Plan</span>
                <Badge variant="default">{usage.plan_name}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Plan Info */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Plan</p>
                    <p className="text-lg font-semibold">{usage.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Billing Cycle</p>
                    <p className="text-lg font-semibold capitalize">
                      {subscription.billing_cycle || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={["expired", "cancelled"].includes(subscription.status) ? "destructive" : "default"}
                      className="mt-1"
                    >
                      {STATUS_LABELS[subscription.status] || subscription.status}
                    </Badge>
                  </div>
                </div>

                {/* Dates */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Started On</p>
                    <p className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatDate(subscription.start_date)}
                    </p>
                  </div>
                  {subscription.trial_ends_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Trial Ends</p>
                      <p className="text-lg font-semibold">
                        {formatDate(subscription.trial_ends_at)}
                      </p>
                    </div>
                  )}
                  {subscription.renewal_date && !subscription.trial_ends_at && (
                    <div>
                      <p className="text-sm text-muted-foreground">Renews On</p>
                      <p className="text-lg font-semibold">
                        {formatDate(subscription.renewal_date)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col justify-center gap-3">
                  <Button
                    variant="primary"
                    onClick={() => router.push("/pricing")}
                  >
                    <CreditCard className="h-4 w-4" />
                    Change Plan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/settings")}
                  >
                    View Settings
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage & Limits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Itineraries */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Itineraries</p>
                    <span className="text-sm font-semibold">
                      {usage.itineraries_used}/{usage.itineraries_limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (usage.itineraries_used / usage.itineraries_limit) > 0.8
                          ? "bg-destructive"
                          : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.itineraries_used / usage.itineraries_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Leads */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Leads</p>
                    <span className="text-sm font-semibold">
                      {usage.leads_used}/{usage.leads_limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (usage.leads_used / usage.leads_limit) > 0.8
                          ? "bg-destructive"
                          : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.leads_used / usage.leads_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Vouchers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Vouchers</p>
                    <span className="text-sm font-semibold">
                      {usage.vouchers_used}/{usage.vouchers_limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (usage.vouchers_used / usage.vouchers_limit) > 0.8
                          ? "bg-destructive"
                          : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.vouchers_used / usage.vouchers_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Bills */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Invoices</p>
                    <span className="text-sm font-semibold">
                      {usage.bills_used}/{usage.bills_limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (usage.bills_used / usage.bills_limit) > 0.8
                          ? "bg-destructive"
                          : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.bills_used / usage.bills_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Team Members */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Team Members</p>
                    <span className="text-sm font-semibold">
                      {usage.team_members_used}/{usage.team_members_limit}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        (usage.team_members_used / usage.team_members_limit) > 0.8
                          ? "bg-destructive"
                          : "bg-green-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (usage.team_members_used / usage.team_members_limit) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground">No billing events yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 border-b border-border pb-4 last:border-b-0 last:pb-0"
                    >
                      <div
                        className={`mt-1.5 h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          event.action === "expired"
                            ? "bg-destructive"
                            : event.action === "extended"
                              ? "bg-green-600"
                              : "bg-primary"
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <p className="text-sm font-semibold">
                            {HISTORY_ACTION_LABELS[event.action] || event.action}
                            {event.plan_name && (
                              <span className="font-normal text-muted-foreground">
                                {" "}— {event.plan_name}
                                {event.billing_cycle && ` (${event.billing_cycle.replace("_", "-")})`}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(event.created_at)}</p>
                        </div>
                        {event.new_renewal_date && event.action !== "expired" && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Valid until {formatDate(event.new_renewal_date)}
                          </p>
                        )}
                        {(event.amount != null || event.payment_mode || event.payment_reference) && (
                          <p className="text-sm text-green-700 mt-0.5">
                            {event.amount != null && (
                              <span className="font-semibold">₹{event.amount.toLocaleString("en-IN")}</span>
                            )}
                            {event.payment_mode && (
                              <> · {PAYMENT_MODE_LABELS[event.payment_mode] || event.payment_mode}</>
                            )}
                            {event.payment_reference && <> · Ref: {event.payment_reference}</>}
                          </p>
                        )}
                        {event.note && (
                          <p className="text-sm text-muted-foreground italic mt-0.5">{event.note}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.action === "expired" ? "System" : "TripPilot team"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="bg-muted/50 rounded-lg p-6 text-center text-sm text-muted-foreground">
            <p>Need to upgrade or have questions about your plan?</p>
            <p className="mt-2">
              <Button variant="link" onClick={() => router.push("/pricing")}>
                View all plans
              </Button>
              {" • "}
              <Button variant="link">Contact Support</Button>
            </p>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
