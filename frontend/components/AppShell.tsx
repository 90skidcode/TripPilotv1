"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import TrialExpiredBanner from "@/components/TrialExpiredBanner";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimit } from "@/hooks/usePlanLimit";

export default function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const { user, loading } = useAuth();
  const { subscription } = usePlanLimit();

  useEffect(() => {
    if (!loading && !user) {
      try {
        router.replace("/login");
      } catch {
        window.location.replace("/login");
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans text-foreground">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex flex-col flex-1 min-w-0 transition-all duration-300">
        <Topbar collapsed={collapsed} title={title} />
        {subscription && (
          <TrialExpiredBanner
            isExpired={subscription.is_expired}
            daysLeft={subscription.days_left_in_trial}
            trialEndsAt={subscription.trial_ends_at}
            status={subscription.status}
          />
        )}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
