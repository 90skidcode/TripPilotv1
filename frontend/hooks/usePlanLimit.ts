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

export function usePlanLimit() {
  const [usage, setUsage] = useState<PlanUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pricingApi
      .usage()
      .then(setUsage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const canCreate = (resource: keyof typeof RESOURCE_MAP) => {
    if (!usage) return false;
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
      canCreate: typeof used === "number" && typeof limit === "number" && used < limit,
    };
  };

  return { usage, loading, error, canCreate, getStatus, refetch: () => setUsage(null) };
}

const RESOURCE_MAP = {
  itineraries: "itineraries",
  leads: "leads",
  vouchers: "vouchers",
  bills: "bills",
  team_members: "team_members",
} as const;
