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
import { CreditCard, Calendar, AlertCircle, CheckCircle } from "lucide-react";

export default function BillingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [usage, setUsage] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
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
          {subscription.status === "expired" ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-destructive">Subscription Expired</p>
                <p className="text-sm text-destructive/80 mt-1">
                  Your subscription has expired. You have read-only access. Please renew to continue.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => router.push("/pricing")}
                  className="mt-3"
                >
                  Renew Subscription
                </Button>
              </div>
            </div>
          ) : daysUntilRenewal !== null && daysUntilRenewal <= 3 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900">Subscription Renewing Soon</p>
                <p className="text-sm text-amber-800 mt-1">
                  Your subscription renews in {daysUntilRenewal} {daysUntilRenewal === 1 ? "day" : "days"}. Manage your plan anytime.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Subscription Active</p>
                <p className="text-sm text-green-800 mt-1">
                  Your subscription is active and in good standing.
                </p>
              </div>
            </div>
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
                      variant={subscription.status === "expired" ? "destructive" : "default"}
                      className="mt-1"
                    >
                      {subscription.status === "trial"
                        ? "Trial"
                        : subscription.status === "expired"
                          ? "Expired"
                          : "Active"}
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
