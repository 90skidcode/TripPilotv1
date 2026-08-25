"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { dashboardApi, followupsApi, leadsApi } from "@/lib/api";

const formatLabel = (str: string) => {
  if (!str) return "";
  return str
    .replace(/[_-]/g, " ")
    .split(" ")
    .map((word) => {
      if (word.toLowerCase() === "whatsapp") return "WhatsApp";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
};

const KPI_CONFIG = [
  { key: "total_leads", label: "Total Leads", icon: "👥", color: "hsl(164, 67%, 44%)" },
  { key: "won_leads", label: "Won Leads", icon: "✅", color: "hsl(142, 72%, 29%)" },
  { key: "conversion_rate", label: "Conversion Rate", icon: "📈", color: "hsl(262, 80%, 50%)", suffix: "%" },
  { key: "active_leads", label: "Active Leads", icon: "⚡", color: "hsl(38, 92%, 50%)" },
  { key: "lost_leads", label: "Lost Leads", icon: "❌", color: "hsl(0, 84%, 60%)" },
  { key: "fresh_leads", label: "Fresh Leads", icon: "🌱", color: "hsl(178, 100%, 41%)" },
  { key: "not_responding", label: "Not Responding", icon: "🔇", color: "hsl(280, 85%, 65%)" },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [bySource, setBySource] = useState<any[]>([]);
  const [byStage, setByStage] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [todayFollowups, setTodayFollowups] = useState<any[]>([]);
  const [todayLeadsMap, setTodayLeadsMap] = useState<Record<number, any>>({});
  const [activeTours, setActiveTours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      dashboardApi.summary(),
      dashboardApi.bySource(),
      dashboardApi.byStage(),
      dashboardApi.leaderboard(),
      followupsApi.getToday(),
      leadsApi.getTodayReminders(),
      dashboardApi.activeTours(),
    ])
      .then(([s, src, stg, lb, followups, reminderLeads, tours]) => {
        if (s.status === "fulfilled") setSummary(s.value);
        if (src.status === "fulfilled") setBySource(src.value);
        if (stg.status === "fulfilled") setByStage(stg.value);
        if (lb.status === "fulfilled") setLeaderboard(lb.value);
        if (followups.status === "fulfilled") setTodayFollowups(followups.value || []);
        if (reminderLeads.status === "fulfilled") {
          const leadMap: Record<number, any> = {};
          (reminderLeads.value || []).forEach((lead: any) => { leadMap[lead.id] = lead; });
          setTodayLeadsMap(leadMap);
        }
        if (tours.status === "fulfilled") setActiveTours(tours.value || []);
      })
      .finally(() => setLoading(false));

    dashboardApi.aiInsights()
      .then((res) => {
        setInsights(res?.insights || []);
      })
      .catch((err) => {
        console.error("Failed to load AI insights:", err);
      })
      .finally(() => setLoadingInsights(false));
  }, []);

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <PageContainer>
          <div className="space-y-6">
            <PageHeader title="Dashboard" description="Real-time sales metrics and AI insights" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 grid-flow-row-dense">
              {/* Featured KPI */}
              <Card className="md:col-span-2 lg:col-span-2 overflow-hidden">
                <CardContent className="h-full flex flex-col justify-between gap-6 py-7">
                  <div className="flex items-start justify-between">
                    <Skeleton className="w-14 h-14 rounded-xl" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-12 w-32" />
                  </div>
                </CardContent>
              </Card>

              {/* AI Co-Pilot */}
              <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2">
                <CardHeader>
                  <div className="flex items-center justify-between gap-4">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-56 mt-1" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {["sk-a", "sk-b", "sk-c"].map((id) => (
                    <div key={id} className="p-4 rounded-lg border space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="w-8 h-8 rounded" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Compact KPI tiles (6) */}
              {["kpi-1", "kpi-2", "kpi-3", "kpi-4", "kpi-5", "kpi-6"].map((id) => (
                <Card key={id}>
                  <CardContent className="py-5">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-11 h-11 rounded-lg shrink-0" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-7 w-14" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Leads by Source */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {["src-1", "src-2", "src-3", "src-4"].map((id) => (
                    <div key={id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Lead Funnel */}
              <Card className="md:col-span-2 lg:col-span-2">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {["fn-1", "fn-2", "fn-3", "fn-4"].map((id) => (
                    <div key={id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-5 w-10 rounded-full" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Leaderboard */}
              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <Skeleton className="h-6 w-44" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-4 pb-3 border-b">
                      {["lb-h-rank", "lb-h-agent", "lb-h-leads", "lb-h-won", "lb-h-conv"].map((id) => (
                        <Skeleton key={id} className="h-4 w-20" />
                      ))}
                    </div>
                    {["lb-r1", "lb-r2", "lb-r3", "lb-r4"].map((rowId) => (
                      <div key={rowId} className="flex gap-4 py-1">
                        {["rank", "agent", "leads", "won", "conv"].map((col) => (
                          <Skeleton key={`${rowId}-${col}`} className="h-4 w-20" />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Today's Reminders skeleton */}
              <Card className="md:col-span-2 lg:col-span-4">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex gap-4 pb-3 border-b">
                      {["tr-h-time", "tr-h-cust", "tr-h-dest", "tr-h-notes", "tr-h-act"].map((id) => (
                        <Skeleton key={id} className="h-4 w-20" />
                      ))}
                    </div>
                    {["tr-r1", "tr-r2", "tr-r3"].map((rowId) => (
                      <div key={rowId} className="flex gap-4 py-1">
                        {["time", "cust", "dest", "notes", "act"].map((col) => (
                          <Skeleton key={`${rowId}-${col}`} className="h-4 w-20" />
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  const featuredKpi = KPI_CONFIG[0];
  const restKpis = KPI_CONFIG.slice(1);

  return (
    <AppShell title="Dashboard">
      <PageContainer>
        <div className="space-y-6">
          <PageHeader title="Dashboard" description="Real-time sales metrics and AI insights" />

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-min gap-4 grid-flow-row-dense">
            {/* Featured KPI — large tile */}
            <Card
              className="md:col-span-2 lg:col-span-2 overflow-hidden relative"
              style={{
                background: `linear-gradient(135deg, color-mix(in srgb, ${featuredKpi.color} 14%, white), white)`,
              }}
            >
              <CardContent className="h-full flex flex-col justify-between gap-6 py-7">
                <div className="flex items-start justify-between">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                    style={{ backgroundColor: `color-mix(in srgb, ${featuredKpi.color} 22%, white)` }}
                  >
                    {featuredKpi.icon}
                  </div>
                  <Badge variant="primary">Live</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{featuredKpi.label}</p>
                  <p className="text-5xl font-extrabold tracking-tight" style={{ color: featuredKpi.color }}>
                    {summary?.[featuredKpi.key] ?? "—"}
                    {featuredKpi.suffix && <span className="text-2xl">{featuredKpi.suffix}</span>}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Sales Co-Pilot — tall tile */}
            <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2 bg-gradient-to-br from-green-50 to-white flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="flex items-center gap-2">
                    <span>🤖</span> AI Sales Co-Pilot
                  </CardTitle>
                  <Badge variant="success">Active Agent</Badge>
                </div>
                <CardDescription>Insights &amp; alerts from your lead data</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto max-h-[520px]">
                {loadingInsights ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-green-200 rounded w-1/3 animate-pulse" />
                        <div className="h-2 bg-green-100 rounded w-2/3 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center italic">
                      🤖 Agent is analyzing lead profiles, budgets, and response times...
                    </p>
                  </div>
                ) : insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">
                    No insights generated yet. Add high-value leads or chat history to begin.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {insights.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border bg-white space-y-3 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-2xl">
                            {item.type === "high_value" ? "💎" : "🔥"}
                          </span>
                          <Badge
                            variant={
                              item.badge === "High Value"
                                ? "primary"
                                : item.badge === "Hot Lead"
                                  ? "warning"
                                  : "secondary"
                            }
                          >
                            {item.badge}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>

                        {item.action_type !== "none" && (
                          <div className="border-t pt-3 flex justify-end">
                            {item.action_type === "whatsapp" ? (
                              <Button asChild variant="primary" size="sm" className="text-xs">
                                <a
                                  href={`https://wa.me/${item.action_target?.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  💬 {item.action_text || "Chat WhatsApp"}
                                </a>
                              </Button>
                            ) : (
                              <Button asChild variant="outline" size="sm" className="text-xs">
                                <a href="/leads">
                                  👤 {item.action_text || "View Lead"}
                                </a>
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Compact KPI tiles */}
            {restKpis.map((kpi) => (
              <Card key={kpi.key} className="h-full">
                <CardContent className="py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 shrink-0 rounded-lg flex items-center justify-center text-xl"
                      style={{ backgroundColor: `color-mix(in srgb, ${kpi.color} 15%, white)` }}
                    >
                      {kpi.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground truncate">{kpi.label}</p>
                      <p className="text-2xl font-bold leading-tight" style={{ color: kpi.color }}>
                        {summary?.[kpi.key] ?? "—"}
                        {kpi.suffix && <span className="text-base">{kpi.suffix}</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Leads by Source — chart tile */}
            <Card className="md:col-span-2 lg:col-span-2 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📊</span> Leads by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-4">
                    {bySource.map((row) => {
                      const max = Math.max(...bySource.map((r) => r.count));
                      const pct = max ? Math.round((row.count / max) * 100) : 0;
                      return (
                        <div key={row.source}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">{formatLabel(row.source)}</span>
                            <Badge variant="primary">{row.count}</Badge>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lead Funnel — chart tile */}
            <Card className="md:col-span-2 lg:col-span-2 h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯</span> Lead Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byStage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
                ) : (
                  <div className="space-y-4">
                    {byStage.map((row) => {
                      const max = Math.max(...byStage.map((r) => r.count));
                      const pct = max ? Math.round((row.count / max) * 100) : 0;
                      return (
                        <div key={row.stage}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">{formatLabel(row.stage)}</span>
                            <Badge variant="secondary">{row.count}</Badge>
                          </div>
                          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leaderboard — full-width tile */}
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🏆</span> Team Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No team data yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-semibold py-3 px-4">#</th>
                          <th className="text-left font-semibold py-3 px-4">Agent</th>
                          <th className="text-left font-semibold py-3 px-4">Total Leads</th>
                          <th className="text-left font-semibold py-3 px-4">Won</th>
                          <th className="text-left font-semibold py-3 px-4">Conversion</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboard.map((row, i) => (
                          <tr key={i} className="border-b border-border hover:bg-muted/50">
                            <td className="py-3 px-4 font-bold">#{i + 1}</td>
                            <td className="py-3 px-4 font-semibold">{row.agent}</td>
                            <td className="py-3 px-4">{row.leads}</td>
                            <td className="py-3 px-4">
                              <Badge variant="success">{row.won}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              {row.leads ? Math.round((row.won / row.leads) * 100) : 0}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Today's Reminders — full-width tile */}
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>📞</span> Today&apos;s Reminders
                  </CardTitle>
                  <Badge variant="warning">{todayFollowups.length}</Badge>
                </div>
                <CardDescription>Pending follow-ups scheduled for today</CardDescription>
              </CardHeader>
              <CardContent>
                {todayFollowups.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No reminders for today 🎉
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-semibold py-3 px-4 whitespace-nowrap">Time</th>
                          <th className="text-left font-semibold py-3 px-4">Customer</th>
                          <th className="text-left font-semibold py-3 px-4">Phone</th>
                          <th className="text-left font-semibold py-3 px-4">Destination</th>
                          <th className="text-left font-semibold py-3 px-4">Notes</th>
                          <th className="text-left font-semibold py-3 px-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayFollowups.map((followup) => {
                          const lead = todayLeadsMap[followup.lead_id];
                          const customer = lead?.customer;
                          const phone = customer?.whatsapp_number || customer?.phone;
                          const scheduledTime = new Date(followup.scheduled_date).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          return (
                            <tr key={followup.id} className="border-b border-border hover:bg-muted/50">
                              <td className="py-3 px-4 font-semibold whitespace-nowrap text-primary">
                                {scheduledTime}
                              </td>
                              <td className="py-3 px-4 font-semibold">
                                {customer?.name ?? "—"}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground">
                                {phone ?? "—"}
                              </td>
                              <td className="py-3 px-4">
                                {lead?.destination ? (
                                  <Badge variant="secondary">{lead.destination}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                                {followup.notes ?? "—"}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  {phone && (
                                    <Button asChild variant="primary" size="sm" className="text-xs h-7">
                                      <a
                                        href={`https://wa.me/${phone.replace(/\D/g, "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        💬 WhatsApp
                                      </a>
                                    </Button>
                                  )}
                                  {lead && (
                                    <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                      <a href={`/leads/${lead.id}`}>View Lead</a>
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Tours — full-width tile */}
            <Card className="md:col-span-2 lg:col-span-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>🧳</span> Active Tours
                  </CardTitle>
                  <Badge variant="primary">{activeTours.length}</Badge>
                </div>
                <CardDescription>Confirmed trips for Won leads active up to their final travel date</CardDescription>
              </CardHeader>
              <CardContent>
                {activeTours.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No active tours at the moment 🌴
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left font-semibold py-3 px-4">Customer</th>
                          <th className="text-left font-semibold py-3 px-4">Destination</th>
                          <th className="text-left font-semibold py-3 px-4">Trip Duration</th>
                          <th className="text-left font-semibold py-3 px-4">Travel Dates</th>
                          <th className="text-left font-semibold py-3 px-4">Status &amp; Remaining Days</th>
                          <th className="text-left font-semibold py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeTours.map((tour) => {
                          const startDateFormatted = new Date(tour.start_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          });
                          const endDateFormatted = new Date(tour.end_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          });

                          return (
                            <tr key={tour.lead_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                              {/* Customer Name & Phone */}
                              <td className="py-3 px-4">
                                <div className="font-semibold text-foreground">{tour.customer_name}</div>
                                {tour.customer_phone && (
                                  <div className="text-xs text-muted-foreground">{tour.customer_phone}</div>
                                )}
                              </td>

                              {/* Destination */}
                              <td className="py-3 px-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-muted text-foreground">
                                  ✈️ {tour.destination}
                                </span>
                              </td>

                              {/* Duration */}
                              <td className="py-3 px-4 font-medium text-foreground">
                                {tour.num_days} Days {tour.num_nights ? `/ ${tour.num_nights} Nights` : ""}
                              </td>

                              {/* Dates */}
                              <td className="py-3 px-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                📅 {startDateFormatted} – {endDateFormatted}
                              </td>

                              {/* Remaining Days & Status */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                {tour.is_ongoing ? (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    🟢 Ongoing ({tour.remaining_days === 0 ? "Ends Today" : `${tour.remaining_days} days left`})
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    🔵 Starts in {tour.starts_in_days} {tour.starts_in_days === 1 ? "day" : "days"}
                                  </span>
                                )}
                              </td>

                              {/* Action */}
                              <td className="py-3 px-4 whitespace-nowrap">
                                <Button asChild variant="outline" size="sm" className="text-xs h-7">
                                  <a href={`/leads/${tour.lead_id}`}>View Lead</a>
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </PageContainer>
    </AppShell>
  );
}
