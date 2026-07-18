"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { pricingApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { Check } from "lucide-react";

interface BillingCycle {
  id: number;
  plan_id: number;
  billing_cycle: string;
  monthly_price: number;
  discount_percent: number;
  display_price: string;
  is_active: boolean;
}

interface Plan {
  id: number;
  name: string;
  itineraries_limit: number;
  leads_limit: number;
  vouchers_limit: number;
  bills_limit: number;
  team_members_limit: number;
  storage_gb: number;
  trial_days: number;
  is_active: boolean;
  billing_cycles?: BillingCycle[];
}

export default function PricingPage() {
  const { showToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const data = await pricingApi.plans();
      // Filter active plans only
      const activePlans = data.filter((p: Plan) => p.is_active);
      setPlans(activePlans);
    } catch (e) {
      console.error(e);
      showToast({ type: "error", message: "Failed to load pricing plans" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectPlan(plan: Plan, cycle: BillingCycle) {
    setSubscribing(true);
    try {
      await pricingApi.subscribe({
        plan_id: plan.id,
        plan_billing_cycle_id: cycle.id,
        billing_cycle: cycle.billing_cycle,
      });
      showToast({
        type: "success",
        message: `Successfully subscribed to ${plan.name} (${cycle.billing_cycle})!`,
      });
      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (e: any) {
      showToast({
        type: "error",
        message: e.message || "Failed to subscribe",
      });
    } finally {
      setSubscribing(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Choose Your Plan">
        <PageContainer>
          <div className="flex items-center justify-center min-h-96">
            <p className="text-muted-foreground">Loading plans...</p>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Choose Your Plan">
      <PageContainer>
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <PageHeader
              title="Simple, Transparent Pricing"
              description="Choose the plan that fits your needs. Upgrade anytime."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col ${
                  plan.name === "Starter"
                    ? "ring-2 ring-primary lg:scale-105"
                    : ""
                }`}
              >
                <CardHeader>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    {plan.name === "Starter" && (
                      <Badge variant="default" className="w-fit">
                        Most Popular
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 space-y-6">
                  {/* Features */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        {plan.itineraries_limit} Itineraries
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{plan.leads_limit} Leads</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        {plan.vouchers_limit} Vouchers
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{plan.bills_limit} Bills</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">
                        {plan.team_members_limit} Team Member
                        {plan.team_members_limit !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-sm">{plan.storage_gb} GB Storage</span>
                    </div>
                  </div>

                  {/* Billing Cycles */}
                  <div className="space-y-3 pt-6 border-t">
                    <p className="font-semibold text-sm">Billing Cycles</p>
                    {plan.billing_cycles && plan.billing_cycles.length > 0 ? (
                      <div className="space-y-2">
                        {plan.billing_cycles.map((cycle) => (
                          <button
                            key={cycle.id}
                            onClick={() => setSelectedCycle(cycle)}
                            className={`w-full p-3 rounded-lg border transition-all text-left ${
                              selectedCycle?.id === cycle.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm capitalize">
                                {cycle.billing_cycle}
                              </span>
                              <span className="text-sm font-bold">
                                ₹{cycle.monthly_price.toLocaleString()}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {cycle.display_price}
                              {cycle.discount_percent > 0 && (
                                <span className="ml-2 text-green-600 font-semibold">
                                  Save {cycle.discount_percent}%
                                </span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No billing cycles available
                      </p>
                    )}
                  </div>

                  {/* CTA Button — paid plans are activated manually by the
                      TripPilot team (payments are collected offline) */}
                  {plan.trial_days > 0 ? (
                    <Button
                      variant={plan.name === "Starter" ? "primary" : "outline"}
                      disabled={
                        !selectedCycle ||
                        selectedCycle.plan_id !== plan.id ||
                        subscribing
                      }
                      onClick={() =>
                        selectedCycle &&
                        handleSelectPlan(plan, selectedCycle)
                      }
                      className="w-full mt-6"
                    >
                      {subscribing ? "Processing..." : "Start Free Trial"}
                    </Button>
                  ) : (
                    <Button
                      variant={plan.name === "Starter" ? "primary" : "outline"}
                      onClick={() => {
                        window.location.href = `mailto:sales@trippilot.com?subject=Activate ${plan.name} plan`;
                      }}
                      className="w-full mt-6"
                    >
                      Contact us to activate
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-muted/50 rounded-lg p-8 text-center space-y-4">
            <h3 className="text-lg font-semibold">Need a Custom Plan?</h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              For enterprise requirements or volume discounts, contact our sales
              team at sales@trippilot.com
            </p>
            <Button variant="outline">Contact Sales</Button>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
