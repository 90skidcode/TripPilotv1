"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { PageHeader, PageContainer, ResponsiveGrid } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { itineraryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePlanLimit } from "@/hooks/usePlanLimit";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ItineraryListPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("itinerary", "write");
  const { getStatus, hasWriteAccess } = usePlanLimit();
  const itineraryStatus = getStatus("itineraries");

  useEffect(() => {
    itineraryApi
      .list()
      .then(setItems)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  function deleteItem(id: number) {
    if (!confirm("Delete this itinerary?")) return;
    itineraryApi.delete(id).then(() => setItems((p) => p.filter((i) => i.id !== id)));
  }

  const limitReached = itineraryStatus && !itineraryStatus.canCreate;
  const trialExpired = !hasWriteAccess;

  return (
    <AppShell title="Itinerary Builder">
      <PageContainer>
        <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <PageHeader
              title="Itinerary Builder"
              description={`${items.length} itineraries created`}
            />
            {itineraryStatus && (
              <p className="text-sm text-muted-foreground mt-1">
                {itineraryStatus.used}/{itineraryStatus.limit} itineraries used
              </p>
            )}
          </div>
          {canWrite && (
            <Button
              id="create-itinerary-btn"
              variant="primary"
              disabled={limitReached || trialExpired}
              title={
                trialExpired
                  ? "Trial period expired. Please upgrade your plan."
                  : limitReached
                    ? `You've reached the limit of ${itineraryStatus?.limit} itineraries`
                    : ""
              }
              onClick={() => router.push("/itinerary/new")}
            >
              ✨ New Itinerary
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-96">
            <p className="text-muted-foreground">⏳ Loading…</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16 px-4">
            <div className="text-6xl">🗺️</div>
            <h3 className="text-xl font-semibold">No itineraries yet</h3>
            {trialExpired ? (
              <p className="text-destructive text-sm">Trial period expired. You can only view existing data. Please upgrade your plan to create new itineraries.</p>
            ) : limitReached ? (
              <p className="text-destructive text-sm">You've reached the maximum itineraries limit. Please upgrade your plan.</p>
            ) : canWrite ? (
              <>
                <p className="text-muted-foreground">Create your first AI-powered itinerary</p>
                <Button
                  variant="primary"
                  onClick={() => router.push("/itinerary/new")}
                >
                  ✨ Create Itinerary
                </Button>
              </>
            ) : null}
          </div>
        ) : (
          <ResponsiveGrid columns={3} gap="md">
            {items.map((itin) => (
              <Card key={itin.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                {/* Cover */}
                <div className="h-24 bg-gradient-to-br from-primary to-slate-900 flex items-center justify-center text-4xl">
                  🌴
                </div>

                {/* Content */}
                <CardContent className="flex-1 pt-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-base">
                      {itin.title || "Untitled Itinerary"}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {itin.destination || "Destination TBD"} ·{" "}
                      {itin.total_days ? `${itin.total_days}D/${itin.total_nights}N` : "—"}
                      {itin.num_travellers ? ` · ${itin.num_travellers} pax` : ""}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {canWrite ? (
                      <Button
                        asChild
                        variant="primary"
                        size="sm"
                        className="flex-1"
                      >
                        <Link href={`/itinerary/${itin.id}`}>
                          ✏️ Edit
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Link href={`/itinerary/${itin.id}`}>
                          👁️ View
                        </Link>
                      </Button>
                    )}
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/itinerary/${itin.id}/pdf`}>
                        📄 PDF
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        if (itin.share_token) {
                          const link = `${window.location.origin}/share/${itin.share_token}`;
                          navigator.clipboard.writeText(link);
                          alert(`Client Share Link Copied!\n\n${link}`);
                        } else {
                          router.push(`/itinerary/${itin.id}`);
                        }
                      }}
                      title="Copy public client share link"
                    >
                      🌐 Share
                    </Button>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteItem(itin.id)}
                        className="text-destructive hover:text-destructive"
                        id={`delete-itin-${itin.id}`}
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </ResponsiveGrid>
        )}
      </div>
    </PageContainer>
    </AppShell>
  );
}
