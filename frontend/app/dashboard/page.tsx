"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer, Section, ResponsiveGrid } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { dashboardApi } from "@/lib/api";
import { cn } from "@/lib/cn";

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
  const [loading, setLoading] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardApi.summary(),
      dashboardApi.bySource(),
      dashboardApi.byStage(),
      dashboardApi.leaderboard(),
    ])
      .then(([s, src, stg, lb]) => {
        setSummary(s);
        setBySource(src);
        setByStage(stg);
        setLeaderboard(lb);
      })
      .catch(console.error)
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
          <PageHeader title="Dashboard" />
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Spinner size="lg" className="mb-4" />
              <p className="text-base font-semibold text-muted-foreground">
                ⏳ Loading analytics…
              </p>
            </div>
          </div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Dashboard">
      <PageContainer>
        <div className="space-y-8">
          <PageHeader title="Dashboard" description="Real-time sales metrics and AI insights" />

          {/* KPI Grid */}
          <ResponsiveGrid columns={4} gap="md">
            {KPI_CONFIG.map((kpi) => (
              <Card key={kpi.key}>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${kpi.color} 15%, white)`,
                      }}
                    >
                      {kpi.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                      <p
                        className="text-3xl font-bold"
                        style={{ color: kpi.color }}
                      >
                        {summary?.[kpi.key] ?? "—"}
                        {kpi.suffix && <span className="text-lg">{kpi.suffix}</span>}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ResponsiveGrid>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Leads by Source */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>📊</span> Leads by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {bySource.map((row) => {
                      const max = Math.max(...bySource.map((r) => r.count));
                      const pct = max ? Math.round((row.count / max) * 100) : 0;
                      return (
                        <div key={row.source}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              {formatLabel(row.source)}
                            </span>
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

            {/* Leads by Stage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>🎯</span> Lead Funnel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {byStage.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {byStage.map((row) => {
                      const max = Math.max(...byStage.map((r) => r.count));
                      const pct = max ? Math.round((row.count / max) * 100) : 0;
                      return (
                        <div key={row.stage}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold">
                              {formatLabel(row.stage)}
                            </span>
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
          </div>

          {/* Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🏆</span> Team Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No team data yet
                </p>
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
                        <tr key={row.agent} className="border-b border-border hover:bg-muted/50">
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

          {/* AI Sales Co-Pilot Panel */}
          <Card className="bg-gradient-to-br from-green-50 to-white border-green-200">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <span>🤖</span> AI Sales Co-Pilot — Insights & Alerts
                </CardTitle>
                <Badge variant="success">Active Agent</Badge>
              </div>
            </CardHeader>
            <CardContent>
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
                <ResponsiveGrid columns={2} gap="md">
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
                            <Button
                              asChild
                              variant="primary"
                              size="sm"
                              className="text-xs"
                            >
                              <a
                                href={`https://wa.me/${item.action_target?.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                💬 {item.action_text || "Chat WhatsApp"}
                              </a>
                            </Button>
                          ) : (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="text-xs"
                            >
                              <a href="/leads">
                                👤 {item.action_text || "View Lead"}
                              </a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </ResponsiveGrid>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
