"use client";

import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

interface TrialExpiredBannerProps {
  daysLeft?: number | null;
  isExpired: boolean;
  trialEndsAt?: string | null;
  status?: string | null;
  graceEndsAt?: string | null;
  dueAmount?: number | null;
}

export default function TrialExpiredBanner({ daysLeft, isExpired, trialEndsAt, status, graceEndsAt, dueAmount }: TrialExpiredBannerProps) {
  // Payment due, still in grace: full access with a persistent reminder
  if (status === "past_due") {
    const graceDate = graceEndsAt
      ? new Date(graceEndsAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" })
      : null;
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Payment Due</p>
            <p className="text-sm text-amber-800">
              Your renewal payment{dueAmount ? ` of ₹${dueAmount.toLocaleString("en-IN")}` : ""} is due.
              {graceDate ? ` You keep full access until ${graceDate} — please pay before then.` : " Please pay to keep full access."}
            </p>
          </div>
          <Link href="/billing" className="text-sm font-semibold text-amber-600 hover:underline whitespace-nowrap ml-4">
            View invoice →
          </Link>
        </div>
      </div>
    );
  }

  if (!isExpired && (daysLeft === null || daysLeft === undefined || daysLeft > 0)) {
    return null;
  }

  const isPaidPlan = status && !["trial", "trialing", "no_subscription"].includes(status);

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">
              {isPaidPlan ? "Subscription Expired" : "Trial Period Expired"}
            </p>
            <p className="text-sm text-destructive/80">
              {isPaidPlan
                ? "Your subscription has expired. You now have read-only access. Please renew your subscription to continue creating resources."
                : "Your trial period has ended. You now have read-only access. Please upgrade your plan to continue creating resources."}
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-destructive hover:underline whitespace-nowrap ml-4">
            {isPaidPlan ? "Renew Plan →" : "Upgrade Plan →"}
          </Link>
        </div>
      </div>
    );
  }

  if (daysLeft === 0) {
    return (
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">
              {isPaidPlan ? "Subscription Expiring Today" : "Trial Expiring Today"}
            </p>
            <p className="text-sm text-amber-800">
              {isPaidPlan
                ? "Your subscription expires today. Renew now to keep all features active."
                : "Your trial period expires today. Upgrade now to keep creating and managing your resources."}
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-amber-600 hover:underline whitespace-nowrap ml-4">
            {isPaidPlan ? "Renew Now →" : "Upgrade Now →"}
          </Link>
        </div>
      </div>
    );
  }

  if (daysLeft && daysLeft <= 3) {
    return (
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <Clock className="h-5 w-5 text-orange-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-orange-900">
              {isPaidPlan ? "Subscription" : "Trial"} Ending in {daysLeft} {daysLeft === 1 ? "day" : "days"}
            </p>
            <p className="text-sm text-orange-800">
              {isPaidPlan
                ? "Your subscription will expire soon. Renew your plan to continue using all features."
                : "Your trial period will end soon. Upgrade your plan to continue using all features."}
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-orange-600 hover:underline whitespace-nowrap ml-4">
            {isPaidPlan ? "Renew Plan →" : "Upgrade Plan →"}
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
