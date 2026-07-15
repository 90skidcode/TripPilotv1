"use client";

import { AlertCircle, Clock } from "lucide-react";
import Link from "next/link";

interface TrialExpiredBannerProps {
  daysLeft?: number | null;
  isExpired: boolean;
  trialEndsAt?: string | null;
}

export default function TrialExpiredBanner({ daysLeft, isExpired, trialEndsAt }: TrialExpiredBannerProps) {
  if (!isExpired && (daysLeft === null || daysLeft === undefined || daysLeft > 0)) {
    return null;
  }

  if (isExpired) {
    return (
      <div className="bg-destructive/10 border-b border-destructive/30 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-destructive">Trial Period Expired</p>
            <p className="text-sm text-destructive/80">
              Your trial period has ended. You now have read-only access. Please upgrade your plan to continue creating resources.
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-destructive hover:underline whitespace-nowrap ml-4">
            Upgrade Plan →
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
            <p className="font-semibold text-amber-900">Trial Expiring Today</p>
            <p className="text-sm text-amber-800">
              Your trial period expires today. Upgrade now to keep creating and managing your resources.
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-amber-600 hover:underline whitespace-nowrap ml-4">
            Upgrade Now →
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
            <p className="font-semibold text-orange-900">Trial Ending in {daysLeft} {daysLeft === 1 ? "day" : "days"}</p>
            <p className="text-sm text-orange-800">
              Your trial period will end soon. Upgrade your plan to continue using all features.
            </p>
          </div>
          <Link href="/settings" className="text-sm font-semibold text-orange-600 hover:underline whitespace-nowrap ml-4">
            Upgrade Plan →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
