"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flightsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plane, FileText, Trash2, Save } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function FlightEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const flightId = Number(id);
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("vouchers", "write");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    airline: "",
    flight_number: "",
    pnr: "",
    cabin_class: "Economy",
    origin: "",
    destination: "",
    depart_at: "",
    arrive_at: "",
    num_passengers: "",
    fare: "",
    baggage: "",
    notes: "",
    passenger_names: "",
    lead_id: null as number | null,
    customer_id: null as number | null,
  });

  useEffect(() => {
    fetchFlight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flightId]);

  async function fetchFlight() {
    try {
      const data = await flightsApi.get(flightId);
      const paxList = Array.isArray(data.passengers) ? data.passengers.map((p: any) => p.name).filter(Boolean).join("\n") : "";
      
      const formatDateTimeLocal = (d?: string | null) => {
        if (!d) return "";
        try {
          const dt = new Date(d);
          return dt.toISOString().slice(0, 16);
        } catch {
          return "";
        }
      };

      setForm({
        airline: data.airline || "",
        flight_number: data.flight_number || "",
        pnr: data.pnr || "",
        cabin_class: data.cabin_class || "Economy",
        origin: data.origin || "",
        destination: data.destination || "",
        depart_at: formatDateTimeLocal(data.depart_at),
        arrive_at: formatDateTimeLocal(data.arrive_at),
        num_passengers: data.num_passengers ? String(data.num_passengers) : "",
        fare: data.fare || "",
        baggage: data.baggage || "",
        notes: data.notes || "",
        passenger_names: paxList,
        lead_id: data.lead_id || null,
        customer_id: data.customer_id || null,
      });
    } catch (err: any) {
      console.error(err);
      showToast({ type: "error", message: "Failed to load flight ticket." });
    } finally {
      setLoading(false);
    }
  }

  const set = (k: keyof typeof form, v: any) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.airline.trim()) {
      showToast({ type: "error", message: "Airline is required." });
      return;
    }
    setSaving(true);
    try {
      const passengers = form.passenger_names
        .split(/[\n,]+/)
        .map((n) => n.trim())
        .filter(Boolean)
        .map((name) => ({ name }));

      const payload: any = {
        lead_id: form.lead_id,
        customer_id: form.customer_id,
        airline: form.airline,
        flight_number: form.flight_number || null,
        pnr: form.pnr || null,
        cabin_class: form.cabin_class || null,
        origin: form.origin || null,
        destination: form.destination || null,
        depart_at: form.depart_at ? new Date(form.depart_at).toISOString() : null,
        arrive_at: form.arrive_at ? new Date(form.arrive_at).toISOString() : null,
        num_passengers: form.num_passengers ? Number(form.num_passengers) : (passengers.length || null),
        passengers: passengers.length ? passengers : null,
        fare: form.fare || null,
        baggage: form.baggage || null,
        notes: form.notes || null,
      };

      await flightsApi.update(flightId, payload);
      showToast({ type: "success", message: "Flight ticket updated!" });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to update flight ticket" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this flight ticket?")) return;
    try {
      await flightsApi.delete(flightId);
      showToast({ type: "success", message: "Flight ticket deleted." });
      router.push(form.lead_id ? `/leads/${form.lead_id}` : "/flights");
    } catch {
      showToast({ type: "error", message: "Failed to delete flight ticket." });
    }
  }

  if (loading) {
    return (
      <AppShell title="Edit Flight Ticket">
        <PageContainer>
          <div className="p-12 text-center text-muted-foreground">⏳ Loading ticket details...</div>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="Edit Flight Ticket">
      <PageContainer>
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/flights/${flightId}/pdf`)}>
              <FileText className="h-4 w-4" /> View PDF
            </Button>
            {canWrite && (
              <>
                <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
                <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>

        <PageHeader title={`Edit Flight: ${form.airline} ${form.flight_number}`.trim()} description="Update flight booking details." />

        <Card>
          <CardContent className="space-y-5 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Airline *">
                <Input value={form.airline} onChange={(e) => set("airline", e.target.value)} placeholder="e.g. IndiGo" disabled={!canWrite} />
              </Field>
              <Field label="Flight Number">
                <Input value={form.flight_number} onChange={(e) => set("flight_number", e.target.value)} placeholder="e.g. 6E-203" disabled={!canWrite} />
              </Field>
              <Field label="PNR">
                <Input value={form.pnr} onChange={(e) => set("pnr", e.target.value)} placeholder="e.g. X9K2QP" disabled={!canWrite} />
              </Field>
              <Field label="Cabin Class">
                <Input value={form.cabin_class} onChange={(e) => set("cabin_class", e.target.value)} placeholder="Economy / Business" disabled={!canWrite} />
              </Field>
              <Field label="From">
                <Input value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. MAA — Chennai" disabled={!canWrite} />
              </Field>
              <Field label="To">
                <Input value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. DEL — Delhi" disabled={!canWrite} />
              </Field>
              <Field label="Departure">
                <Input type="datetime-local" value={form.depart_at} onChange={(e) => set("depart_at", e.target.value)} disabled={!canWrite} />
              </Field>
              <Field label="Arrival">
                <Input type="datetime-local" value={form.arrive_at} onChange={(e) => set("arrive_at", e.target.value)} disabled={!canWrite} />
              </Field>
              <Field label="No. of Passengers">
                <Input type="number" value={form.num_passengers} onChange={(e) => set("num_passengers", e.target.value)} placeholder="e.g. 2" disabled={!canWrite} />
              </Field>
              <Field label="Fare (₹)">
                <Input value={form.fare} onChange={(e) => set("fare", e.target.value)} placeholder="e.g. 12,500" disabled={!canWrite} />
              </Field>
              <Field label="Baggage">
                <Input value={form.baggage} onChange={(e) => set("baggage", e.target.value)} placeholder="e.g. 15kg + 7kg cabin" disabled={!canWrite} />
              </Field>
            </div>

            <Field label="Passenger Names (one per line or comma-separated)">
              <textarea
                value={form.passenger_names}
                onChange={(e) => set("passenger_names", e.target.value)}
                rows={3}
                placeholder={"e.g.\nDeepika Gandhi\nGandhi S"}
                disabled={!canWrite}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Any special instructions…"
                disabled={!canWrite}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
              />
            </Field>

            {canWrite && (
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <Plane className="h-4 w-4" /> {saving ? "Saving…" : saved ? "Saved!" : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
