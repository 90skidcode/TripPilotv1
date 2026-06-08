"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { PageContainer, PageHeader } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { flightsApi } from "@/lib/api";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { ArrowLeft, Plane } from "lucide-react";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function NewFlightPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("vouchers", "write");

  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("lead_id");
  const customerIdParam = searchParams.get("customer_id");
  const leadId = leadIdParam ? Number(leadIdParam) : undefined;
  const customerId = customerIdParam ? Number(customerIdParam) : undefined;

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
  });
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
        lead_id: leadId ?? null,
        customer_id: customerId ?? null,
        airline: form.airline,
        flight_number: form.flight_number || null,
        pnr: form.pnr || null,
        cabin_class: form.cabin_class || null,
        origin: form.origin || null,
        destination: form.destination || null,
        depart_at: form.depart_at || null,
        arrive_at: form.arrive_at || null,
        num_passengers: form.num_passengers ? Number(form.num_passengers) : (passengers.length || null),
        passengers: passengers.length ? passengers : null,
        fare: form.fare || null,
        baggage: form.baggage || null,
        notes: form.notes || null,
      };
      const res = await flightsApi.create(payload);
      showToast({ type: "success", message: "Flight ticket created!" });
      router.push(leadId ? `/leads/${leadId}` : `/flights/${res.id}/pdf`);
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to create flight ticket" });
      setSaving(false);
    }
  }

  if (!canWrite) {
    return (
      <AppShell title="New Flight Ticket">
        <PageContainer>
          <p className="text-sm text-muted-foreground py-10 text-center">You don&apos;t have permission to create flight tickets.</p>
        </PageContainer>
      </AppShell>
    );
  }

  return (
    <AppShell title="New Flight Ticket">
      <PageContainer>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <PageHeader title="New Flight Ticket" description="Add a flight booking to track it on the lead." />

        <Card>
          <CardContent className="space-y-5 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Airline *">
                <Input value={form.airline} onChange={(e) => set("airline", e.target.value)} placeholder="e.g. IndiGo" />
              </Field>
              <Field label="Flight Number">
                <Input value={form.flight_number} onChange={(e) => set("flight_number", e.target.value)} placeholder="e.g. 6E-203" />
              </Field>
              <Field label="PNR">
                <Input value={form.pnr} onChange={(e) => set("pnr", e.target.value)} placeholder="e.g. X9K2QP" />
              </Field>
              <Field label="Cabin Class">
                <Input value={form.cabin_class} onChange={(e) => set("cabin_class", e.target.value)} placeholder="Economy / Business" />
              </Field>
              <Field label="From">
                <Input value={form.origin} onChange={(e) => set("origin", e.target.value)} placeholder="e.g. MAA — Chennai" />
              </Field>
              <Field label="To">
                <Input value={form.destination} onChange={(e) => set("destination", e.target.value)} placeholder="e.g. DEL — Delhi" />
              </Field>
              <Field label="Departure">
                <Input type="datetime-local" value={form.depart_at} onChange={(e) => set("depart_at", e.target.value)} />
              </Field>
              <Field label="Arrival">
                <Input type="datetime-local" value={form.arrive_at} onChange={(e) => set("arrive_at", e.target.value)} />
              </Field>
              <Field label="No. of Passengers">
                <Input type="number" value={form.num_passengers} onChange={(e) => set("num_passengers", e.target.value)} placeholder="e.g. 2" />
              </Field>
              <Field label="Fare (₹)">
                <Input value={form.fare} onChange={(e) => set("fare", e.target.value)} placeholder="e.g. 12,500" />
              </Field>
              <Field label="Baggage">
                <Input value={form.baggage} onChange={(e) => set("baggage", e.target.value)} placeholder="e.g. 15kg + 7kg cabin" />
              </Field>
            </div>

            <Field label="Passenger Names (one per line or comma-separated)">
              <textarea
                value={form.passenger_names}
                onChange={(e) => set("passenger_names", e.target.value)}
                rows={3}
                placeholder={"e.g.\nDeepika Gandhi\nGandhi S"}
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={2}
                placeholder="Any special instructions…"
                className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-ring"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                <Plane className="h-4 w-4" /> {saving ? "Saving…" : "Create Ticket"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </PageContainer>
    </AppShell>
  );
}
