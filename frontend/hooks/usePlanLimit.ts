import { useEffect, useState } from "react";
import { pricingApi } from "@/lib/api";

export interface PlanUsage {
  itineraries_used: number;
  itineraries_limit: number;
  leads_used: number;
  leads_limit: number;
  vouchers_used: number;
  vouchers_limit: number;
  bills_used: number;
  bills_limit: number;
  team_members_used: number;
  team_members_limit: number;
  plan_name: string;
  monthly_price: number;
  subscription_status: string;
  renewal_date: string | null;
  trial_ends_at: string | null;
  days_left_in_trial: number | null;
}

export interface SubscriptionStatus {
  is_expired: boolean;
  days_left_in_trial: number | null;
  trial_ends_at: string | null;
  status: string; // trialing | active | past_due | expired | cancelled | no_subscription
  renewal_date?: string | null;
  grace_ends_at?: string | null;
  due_amount?: number | null;
}

export function usePlanLimit() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      pricingApi.usage(),
      pricingApi.subscriptionStatus(),
    ])
      .then(([usageData, subData]) => {
        setUsage(usageData);
        setSubscription(subData);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = (resource: keyof typeof RESOURCE_MAP) => {
    if (!usage || subscription?.is_expired) return false;
    const key = RESOURCE_MAP[resource];
    const used = usage[`${key}_used` as keyof PlanUsage];
    const limit = usage[`${key}_limit` as keyof PlanUsage];
    return typeof used === "number" && typeof limit === "number" && used < limit;
  };

  const getStatus = (resource: keyof typeof RESOURCE_MAP) => {
    if (!usage) return null;
    const key = RESOURCE_MAP[resource];
    const used = usage[`${key}_used` as keyof PlanUsage];
    const limit = usage[`${key}_limit` as keyof PlanUsage];
    return {
      used: typeof used === "number" ? used : 0,
      limit: typeof limit === "number" ? limit : 0,
      canCreate: subscription?.is_expired ? false : (typeof used === "number" && typeof limit === "number" && used < limit),
    };
  };

  return {
    usage,
    subscription,
    loading,
    error,
    canCreate,
    getStatus,
    hasWriteAccess: !subscription?.is_expired,
    refetch: () => {
      setUsage(null);
      setSubscription(null);
    }
  };
}

const RESOURCE_MAP = {
  itineraries: "itineraries",
  leads: "leads",
  vouchers: "vouchers",
  bills: "bills",
  team_members: "team_members",
} as const;
