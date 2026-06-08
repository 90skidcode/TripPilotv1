"use client";

import { useEffect, useState, use } from "react";
import { flightsApi } from "@/lib/api";

const BRAND = "#2563eb";

export default function FlightPdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [flight, setFlight] = useState<any>(null);

  useEffect(() => {
    flightsApi.get(Number(id)).then(setFlight).catch(console.error);
  }, [id]);

  if (!flight) return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Loading ticket…</div>;

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD";

  const passengers: any[] = Array.isArray(flight.passengers) ? flight.passengers : [];

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", padding: "40px 0", fontFamily: "'Inter', sans-serif" }}>
      {/* Print controls (hidden on print) */}
      <div className="print-hide" style={{ maxWidth: 850, margin: "0 auto 20px", display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={() => window.history.back()} style={{ padding: "8px 16px", background: "white", border: "1px solid #cbd5e1", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
          ← Back
        </button>
        <button onClick={() => window.print()} style={{ padding: "8px 16px", background: BRAND, color: "white", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>
          🖨️ Print / Save PDF
        </button>
      </div>

      {/* Ticket */}
      <div style={{ maxWidth: 850, margin: "0 auto", background: "white", borderRadius: 16, overflow: "hidden", boxShadow: "0 10px 40px rgba(0,0,0,0.08)" }}>
        {/* Header */}
        <div style={{ background: BRAND, color: "white", padding: "28px 36px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, opacity: 0.85, letterSpacing: "0.08em", textTransform: "uppercase" }}>E-Ticket / Itinerary</div>
            <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{flight.airline}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12, opacity: 0.85 }}>PNR</div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.1em" }}>{flight.pnr || "—"}</div>
          </div>
        </div>

        {/* Route */}
        <div style={{ padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, borderBottom: "1px dashed #e2e8f0" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>From</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{flight.origin || "—"}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{fmt(flight.depart_at)}</div>
          </div>
          <div style={{ fontSize: 28, color: BRAND }}>✈</div>
          <div style={{ flex: 1, textAlign: "right" }}>
            <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>To</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a" }}>{flight.destination || "—"}</div>
            <div style={{ fontSize: 13, color: "#475569", marginTop: 4 }}>{fmt(flight.arrive_at)}</div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ padding: "28px 36px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
          {[
            ["Flight", flight.flight_number || "—"],
            ["Class", flight.cabin_class || "—"],
            ["Passengers", flight.num_passengers ?? passengers.length ?? "—"],
            ["Baggage", flight.baggage || "—"],
            ["Fare", flight.fare ? `₹${flight.fare}` : "—"],
          ].map(([label, value]) => (
            <div key={label as string}>
              <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginTop: 4 }}>{value as any}</div>
            </div>
          ))}
        </div>

        {/* Passenger list */}
        {passengers.length > 0 && (
          <div style={{ padding: "0 36px 28px" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Passengers</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {passengers.map((p: any, i: number) => (
                <span key={i} style={{ padding: "6px 14px", background: "#eff6ff", color: "#1d4ed8", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
                  {p.name || `Passenger ${i + 1}`}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {flight.notes && (
          <div style={{ padding: "0 36px 32px" }}>
            <div style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Notes</div>
            <div style={{ fontSize: 14, color: "#334155", whiteSpace: "pre-wrap" }}>{flight.notes}</div>
          </div>
        )}
      </div>

      <style>{`@media print { .print-hide { display: none !important; } body { background: white !important; } }`}</style>
    </div>
  );
}
