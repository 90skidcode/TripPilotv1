"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { vouchersApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import { useRouter } from "next/navigation";

export default function VouchersList() {
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("vouchers", "write");
  const { getStatus, hasWriteAccess } = usePlanLimit();
  const vouchersStatus = getStatus("vouchers");
  const trialExpired = !hasWriteAccess;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await vouchersApi.list({ page, per_page: 10 });
      setVouchers(data.items || []);
      setTotal(data.total || 0);
      setPages(data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this voucher?")) return;
    try {
      await vouchersApi.delete(id);
      fetchVouchers();
    } catch (e) {
      console.error(e);
      alert("Failed to delete voucher.");
    }
  }

  return (
    <AppShell title="Hotel Vouchers">
      <PageContainer>
        <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <PageHeader
              title="Hotel Vouchers"
              description="Manage and generate AI-powered booking vouchers"
            />
            {vouchersStatus && (
              <p className="text-sm text-muted-foreground mt-1">
                {vouchersStatus.used}/{vouchersStatus.limit} vouchers used
              </p>
            )}
          </div>
          {canWrite && (
            <Button
              variant="primary"
              disabled={trialExpired || (vouchersStatus && !vouchersStatus.canCreate)}
              title={
                trialExpired
                  ? "Trial period expired. Please upgrade your plan."
                  : vouchersStatus && !vouchersStatus.canCreate
                    ? `You've reached the limit of ${vouchersStatus.limit} vouchers`
                    : ""
              }
              onClick={() => router.push("/vouchers/new")}
            >
              ✨ Generate New Voucher
            </Button>
          )}
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              Loading vouchers...
            </div>
          ) : vouchers.length === 0 ? (
            <CardContent className="pt-16 pb-16 text-center">
              <div className="text-6xl mb-4">🏨</div>
              <h3 className="text-lg font-bold mb-2">No Vouchers Found</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Generate beautiful, branded PDF vouchers directly from supplier confirmation emails using Gemini AI.
              </p>
            </CardContent>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-6 py-3 font-semibold text-left text-muted-foreground uppercase tracking-wide text-xs">
                        Hotel
                      </th>
                      <th className="px-6 py-3 font-semibold text-left text-muted-foreground uppercase tracking-wide text-xs">
                        Guests & Rooms
                      </th>
                      <th className="px-6 py-3 font-semibold text-left text-muted-foreground uppercase tracking-wide text-xs">
                        Check-in / Out
                      </th>
                      <th className="px-6 py-3 font-semibold text-left text-muted-foreground uppercase tracking-wide text-xs">
                        Created
                      </th>
                      <th className="px-6 py-3 font-semibold text-right text-muted-foreground uppercase tracking-wide text-xs">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {vouchers.map((v) => (
                      <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">
                            {v.hotel_name || "Unknown"}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {v.hotel_stars ? `${v.hotel_stars} Star` : "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">{v.num_guests || "?"} Guests</div>
                          <div className="text-xs text-muted-foreground">
                            {v.num_rooms || "?"} Room(s) - {v.room_type || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium">
                            {v.check_in
                              ? new Date(v.check_in).toLocaleDateString()
                              : "TBD"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            to{" "}
                            {v.check_out
                              ? new Date(v.check_out).toLocaleDateString()
                              : "TBD"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {new Date(v.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant={canWrite ? "primary" : "outline"}
                              size="sm"
                              onClick={() => router.push(`/vouchers/${v.id}`)}
                            >
                              {canWrite ? "✏️ Edit" : "👁️ View"}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/vouchers/${v.id}/pdf`)}
                            >
                              📄 PDF
                            </Button>
                            {canWrite && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(v.id)}
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

              {/* Pagination */}
              {pages > 1 && (
                <>
                  <Separator />
                  <div className="px-6 py-4 flex items-center justify-between bg-muted/50">
                    <span className="text-sm text-muted-foreground">
                      Showing <strong>Page {page} of {pages}</strong> • {total}{" "}
                      total vouchers
                    </span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                      >
                        «
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        ‹
                      </Button>
                      <span className="px-3 text-sm font-semibold">
                        {page} / {pages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(pages, p + 1))}
                        disabled={page === pages}
                      >
                        ›
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(pages)}
                        disabled={page === pages}
                      >
                        »
                      </Button>
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
