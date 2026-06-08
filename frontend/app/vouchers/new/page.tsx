"use client";

import { useState, Suspense } from "react";
import AppShell from "@/components/AppShell";
import { useRouter, useSearchParams } from "next/navigation";
import { vouchersApi } from "@/lib/api";

const BRAND = "#2D9B7A";

function VoucherForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("lead_id");
  const customerIdParam = searchParams.get("customer_id");
  const leadId = leadIdParam ? Number(leadIdParam) : undefined;
  const customerId = customerIdParam ? Number(customerIdParam) : undefined;
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!text.trim()) {
      setError("Please paste the booking confirmation text.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await vouchersApi.aiEntry(text, { lead_id: leadId, customer_id: customerId });
      if (res && res.id) {
        router.push(leadId ? `/leads/${leadId}` : `/vouchers/${res.id}`);
      } else {
        throw new Error("Failed to generate voucher. No ID returned.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || err.message || "An error occurred");
      setLoading(false);
    }
  }

  return (
    <AppShell title="Generate Hotel Voucher">
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "20px 0" }}>
        
        <button onClick={() => router.push("/vouchers")} className="btn btn-ghost btn-sm mb-6" style={{ padding: 0 }}>
          ← Back to Vouchers
        </button>

        <div style={{ background: "white", borderRadius: 16, padding: 32, border: "1px solid #e4e7ec", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
          <div style={{ textAlign: "center", marginBottom: 30 }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>✨</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1a1a1a", marginBottom: 8 }}>AI Hotel Voucher Parsing</h1>
            <p style={{ color: "#6b7280", fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
              Paste the raw email confirmation from Agoda, MakeMyTrip, or any supplier. 
              Gemini AI will instantly extract the details and build a print-ready voucher.
            </p>
          </div>

          {error && (
            <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "12px 16px", borderRadius: 8, marginBottom: 20, fontSize: 14 }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4b5563", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Raw Booking Text
            </div>
            <textarea
              className="input"
              rows={12}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. Booking Confirmation: 123456... Dear Guest, Your stay at The Ritz-Carlton Bali is confirmed... Check-in: 12 Aug 2026..."
              style={{ 
                width: "100%", 
                padding: 16, 
                fontSize: 14, 
                lineHeight: 1.6, 
                fontFamily: "monospace",
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: 12,
                resize: "vertical"
              }}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            style={{
              width: "100%",
              padding: "14px",
              background: loading ? "#9ca3af" : BRAND,
              color: "white",
              fontWeight: 800,
              fontSize: 16,
              border: "none",
              borderRadius: 12,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 4px 12px rgba(45, 155, 122, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8
            }}
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">⏳</span> Parsing Document...
              </>
            ) : (
              <>
                ✨ Generate Voucher
              </>
            )}
          </button>
        </div>

        <div style={{ marginTop: 24, padding: "20px", background: "rgba(45, 155, 122, 0.05)", borderRadius: 12, border: "1px dashed rgba(45, 155, 122, 0.3)" }}>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: BRAND, marginBottom: 8 }}>💡 Tip: What to include</h4>
          <ul style={{ fontSize: 13, color: "#4b5563", margin: 0, paddingLeft: 20, lineHeight: 1.6 }}>
            <li>Include the hotel name, check-in/out dates, and number of guests.</li>
            <li>Make sure the room type and meal plan (if any) are in the text.</li>
            <li>You can literally just Ctrl+A & Ctrl+C the supplier's PDF or email.</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

export default function NewVoucherWizard() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VoucherForm />
    </Suspense>
  );
}
