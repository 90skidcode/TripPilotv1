"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { flightsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";

function fmt(date: string | null | undefined) {
  if (!date) return "—";
  return new Date(date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function FlightsList() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("vouchers", "write");

  const fetchFlights = useCallback(async () => {
    setLoading(true);
    try {
      const data = await flightsApi.list({ page, per_page: 10 });
      setFlights(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  async function handleDelete(id: number) {
    if (!confirm("Delete this flight ticket?")) return;
    try {
      await flightsApi.delete(id);
      fetchFlights();
    } catch {
      alert("Failed to delete flight.");
    }
  }

  return (
    <AppShell title="Flight Tickets">
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <PageHeader
              title="Flight Tickets"
              description="Manage and generate flight booking records"
            />
            {canWrite && (
              <Button variant="primary" onClick={() => router.push("/flights/new")}>
                ✈️ New Flight Ticket
              </Button>
            )}
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading flights...</div>
            ) : flights.length === 0 ? (
              <CardContent className="pt-16 pb-16 text-center">
                <Plane className="mx-auto mb-4 text-muted-foreground w-12 h-12" />
                <h3 className="text-lg font-bold mb-2">No Flight Tickets</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Create flight booking records linked to your leads and customers.
                </p>
                {canWrite && (
                  <Button variant="primary" className="mt-6" onClick={() => router.push("/flights/new")}>
                    ✈️ Create First Ticket
                  </Button>
                )}
              </CardContent>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Airline / Flight</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Route</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Depart</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cabin / Pax</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">PNR</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Created</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {flights.map((f) => (
                        <tr key={f.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-foreground">{f.airline}</div>
                            {f.flight_number && (
                              <div className="text-xs text-muted-foreground mt-0.5">{f.flight_number}</div>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {f.origin || f.destination ? (
                              <span className="font-medium">
                                {f.origin || "?"} → {f.destination || "?"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">{fmt(f.depart_at)}</td>
                          <td className="px-6 py-4">
                            {f.cabin_class && (
                              <Badge variant="secondary" className="mb-1">{f.cabin_class}</Badge>
                            )}
                            <div className="text-xs text-muted-foreground">
                              {f.num_passengers ? `${f.num_passengers} pax` : "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {f.pnr ? (
                              <code className="text-xs bg-muted px-2 py-0.5 rounded font-mono">{f.pnr}</code>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(f.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant={canWrite ? "primary" : "outline"}
                                size="sm"
                                onClick={() => router.push(`/flights/${f.id}`)}
                              >
                                {canWrite ? "✏️ Edit" : "👁️ View"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/flights/${f.id}/pdf`)}
                              >
                                📄 PDF
                              </Button>
                              {canWrite && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(f.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  🗑️
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <>
                    <Separator />
                    <div className="px-6 py-4 flex items-center justify-between bg-muted/50">
                      <span className="text-sm text-muted-foreground">
                        Page <strong>{page} of {pages}</strong> · {total} total
                      </span>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</Button>
                        <span className="px-3 text-sm font-semibold">{page} / {pages}</span>
                        <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}>›</Button>
                        <Button variant="outline" size="sm" onClick={() => setPage(pages)} disabled={page === pages}>»</Button>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </Card>
        </div>
      </PageContainer>
    </AppShell>
  );
}
