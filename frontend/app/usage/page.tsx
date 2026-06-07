"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer, Section, ResponsiveGrid } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pricingApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { cn } from "@/lib/cn";

interface UsageData {
  plan_name: string;
  monthly_price: number;
  subscription_status: string;
  trial_ends_at: string | null;
  renewal_date: string | null;
  itineraries_limit: number;
  itineraries_used: number;
  leads_limit: number;
  leads_used: number;
  vouchers_limit: number;
  vouchers_used: number;
  bills_limit: number;
  bills_used: number;
  team_members_used?: number;
  team_members_limit?: number;
}

export default function UsagePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  async function loadUsage() {
    try {
      const data = await pricingApi.usage();
      setUsage(data);
    } catch (error) {
      console.error("Failed to load usage", error);
      showToast({ type: "error", message: "Failed to load usage metrics." });
    } finally {
      setLoading(false);
    }
  }

  const getProgressColor = (percentage: number): string => {
    if (percentage < 50) return "bg-gradient-to-r from-purple-500 to-indigo-600";
    if (percentage < 80) return "bg-gradient-to-r from-amber-500 to-orange-600";
    return "bg-gradient-to-r from-red-500 to-red-600";
  };

  const getStatusBadgeVariant = (status: string): "default" | "primary" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" => {
    const map: Record<string, "default" | "primary" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"> = {
      active: "success",
      trial: "info",
      expired: "destructive",
    };
    return map[status] || "secondary";
  };

  if (loading) {
    return (
      <AppShell title="Usage & Limits">
        <PageContainer>
          <PageHeader title="Usage & Limits" />
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <Spinner className="mb-4" />
            <p className="text-base font-semibold text-muted-foreground">
              Analyzing resource telemetry...
            </p>
          </div>
        </div>
      </PageContainer>
      </AppShell>
    );
  }

  if (!usage) {
    return (
      <AppShell title="Usage & Limits">
        <PageContainer>
          <PageHeader title="Usage & Limits" />
        <Alert variant="warning" className="max-w-md mx-auto mt-10">
          <AlertDescription>
            <p className="text-lg font-semibold mb-2">⚠️ Usage context unavailable</p>
            <p className="text-sm mb-4">
              We encountered a problem loading your active subscription parameters.
            </p>
            <Button onClick={loadUsage} variant="primary" size="sm">
              Retry Authentication
            </Button>
          </AlertDescription>
        </Alert>
      </PageContainer>
      </AppShell>
    );
  }

  const subscriptionDate = usage.subscription_status === "trial" ? usage.trial_ends_at : usage.renewal_date;
  const formattedDate = subscriptionDate
    ? new Date(subscriptionDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Unlimited";

  const iUsed = usage.itineraries_used || 0;
  const iLimit = usage.itineraries_limit || 1;
  const lUsed = usage.leads_used || 0;
  const lLimit = usage.leads_limit || 1;
  const vUsed = usage.vouchers_used || 0;
  const vLimit = usage.vouchers_limit || 1;
  const bUsed = usage.bills_used || 0;
  const bLimit = usage.bills_limit || 1;
  const tUsed = usage.team_members_used || 0;
  const tLimit = usage.team_members_limit || 1;

  const itinPercent = Math.min((iUsed / iLimit) * 100, 100);
  const leadPercent = Math.min((lUsed / lLimit) * 100, 100);
  const vouchPercent = Math.min((vUsed / vLimit) * 100, 100);
  const billPercent = Math.min((bUsed / bLimit) * 100, 100);
  const teamPercent = Math.min((tUsed / tLimit) * 100, 100);

  const avgUtilization = Math.round(
    (itinPercent + leadPercent + vouchPercent + billPercent + teamPercent) / 5
  );

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (avgUtilization / 100) * circumference;

  const meters = [
    {
      icon: "🗺️",
      label: "AI Itineraries Created",
      description: "AI-assisted trip summaries drafted",
      used: iUsed,
      limit: iLimit,
      percent: itinPercent,
    },
    {
      icon: "👥",
      label: "CRM Leads Registered",
      description: "Active leads inside customer database",
      used: lUsed,
      limit: lLimit,
      percent: leadPercent,
    },
    {
      icon: "🎟️",
      label: "Standard Vouchers Generated",
      description: "Hotel vouchers and check-in receipts",
      used: vUsed,
      limit: vLimit,
      percent: vouchPercent,
    },
    {
      icon: "💰",
      label: "Billing Invoices Raised",
      description: "Custom customer receipts & GST invoices",
      used: bUsed,
      limit: bLimit,
      percent: billPercent,
    },
    {
      icon: "👥",
      label: "Active User Group Licenses",
      description: "Organization seats assigned to agents",
      used: tUsed,
      limit: tLimit,
      percent: teamPercent,
    },
  ];

  return (
    <AppShell title="Usage & Limits">
      <PageContainer>
        <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <PageHeader title="Resource Usage & Billing" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground font-medium">
                Subscription State:
              </span>
              <Badge variant={getStatusBadgeVariant(usage.subscription_status)}>
                {usage.subscription_status === "trial"
                  ? "Free Trial"
                  : usage.subscription_status === "active"
                    ? "Active Plan"
                    : "Expired"}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Review real-time capacity parameters, active pricing plan entitlements, and billing cycles.
          </p>
        </div>

        {/* Metric Cards Grid */}
        <ResponsiveGrid columns={4} gap="md">
          {/* Plan */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader>
              <CardDescription className="text-purple-700 font-semibold">
                CURRENT TIER
              </CardDescription>
              <CardTitle className="text-purple-900 text-2xl">
                {usage.plan_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="flex items-center gap-2 text-sm text-purple-700 font-medium">
                👑 Professional Suite Active
              </span>
            </CardContent>
          </Card>

          {/* Price */}
          <Card>
            <CardHeader>
              <CardDescription>MONTHLY CHARGE</CardDescription>
              <CardTitle className="text-2xl">
                {usage.monthly_price === 0 ? "Free" : `₹${usage.monthly_price.toLocaleString("en-IN")}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              {usage.monthly_price > 0 && <span>/mo</span>}
              <span className="block mt-1">Charged in Indian Rupees (INR)</span>
            </CardContent>
          </Card>

          {/* Cycle */}
          <Card>
            <CardHeader>
              <CardDescription>CYCLE INTERVAL</CardDescription>
              <CardTitle className="text-2xl">Monthly</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Automatic rolling reset
            </CardContent>
          </Card>

          {/* Renewal */}
          <Card>
            <CardHeader>
              <CardDescription>
                {usage.subscription_status === "trial" ? "TRIAL EXPIRY" : "RENEWAL CYCLE"}
              </CardDescription>
              <CardTitle className="text-xl">{formattedDate}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Calculated on Indian Std Time
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Usage Meters and Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Meters Column */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📊</span> Allocated Resource Meters
                </CardTitle>
                <CardDescription>
                  Progress represents current system allocation consumed within this active monthly window.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {meters.map((meter, idx) => {
                  const progressColor = getProgressColor(meter.percent);
                  return (
                    <div key={idx} className="space-y-2 rounded-lg bg-muted p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{meter.icon}</span>
                          <div>
                            <p className="font-semibold text-sm">{meter.label}</p>
                            <p className="text-xs text-muted-foreground">{meter.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm">{meter.used}</p>
                          <p className="text-xs text-muted-foreground">
                            / {meter.limit} ({Math.round(meter.percent)}%)
                          </p>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all duration-600", progressColor)}
                          style={{ width: `${meter.percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Gauge Column */}
          <div className="space-y-4">
            {/* Circular Gauge */}
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-sm font-semibold uppercase">
                  Average Consumption
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <div className="relative w-40 h-40">
                  <svg width="150" height="150" viewBox="0 0 150 150" className="w-full h-full">
                    <circle cx="75" cy="75" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-border" />
                    <circle
                      cx="75"
                      cy="75"
                      r={radius}
                      fill="none"
                      stroke="url(#gradientPurple)"
                      strokeWidth="12"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      transform="rotate(-90 75 75)"
                      style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
                    />
                    <defs>
                      <linearGradient id="gradientPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-primary)" />
                        <stop offset="100%" stopColor="var(--color-primary)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-foreground">{avgUtilization}%</span>
                    <span className="text-xs font-semibold text-muted-foreground uppercase">Used</span>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground text-center">
                  Your organization is operating well within optimal safety bounds.
                </p>
              </CardContent>
            </Card>

            {/* Tier Privileges */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>✨</span> Tier Privileges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  "Generative AI Co-Pilot Assistant",
                  "Encrypted multi-agent workspace",
                  "Automated PDF Voucher templates",
                  "Advanced custom filters on CRM",
                  "Real-time Lead Scoring",
                  "Custom billing templates",
                ].map((priv, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-xs flex-shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="text-sm text-foreground">{priv}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white border-none">
          <CardContent className="pt-8 flex items-center justify-between gap-8 flex-wrap">
            <div className="flex-1 min-w-80">
              <h3 className="text-xl font-bold mb-2">Ready to Expand Your Operation?</h3>
              <p className="text-sm text-indigo-100">
                Scale your business seamlessly. Upgrade to release fully unlimited AI itineraries, unlock enterprise voucher designs, and assign infinite sub-agent user roles.
              </p>
            </div>
            <Button
              onClick={() => showToast({ type: "info", message: "Premium upgrading sandbox is active.", duration: 4000 })}
              variant="primary"
              className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold flex-shrink-0"
            >
              Upgrade Entitlements 🚀
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
    </AppShell>
  );
}
