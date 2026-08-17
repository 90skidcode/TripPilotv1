"use client";

import { useState, useEffect, use } from "react";
import AppShell from "@/components/AppShell";
import { vouchersApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const BRAND = "#2D9B7A";

export default function VoucherEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("vouchers", "write");
  const { id } = use(params);
  const [voucher, setVoucher] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    vouchersApi.get(Number(id)).then(setVoucher).catch(console.error);
  }, [id]);

  if (!voucher) {
    return <AppShell title="Loading…"><div style={{ padding: 80, textAlign: "center" }}>⏳ Loading…</div></AppShell>;
  }

  function u(k: string, v: any) {
    if (!canWrite) return;
    setVoucher((prev: any) => ({ ...prev, [k]: v }));
  }

  function uExtra(k: string, v: string) {
    if (!canWrite) return;
    const extra = voucher.extra_data || {};
    u("extra_data", { ...extra, [k]: v });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { id: _, created_at: __, pdf_url: ___, ...updateData } = voucher;
      await vouchersApi.update(Number(id), updateData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      console.error(e);
      alert("Failed to save changes: " + (e.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this voucher?")) return;
    try {
      await vouchersApi.delete(Number(id));
      router.push(voucher.lead_id ? `/leads/${voucher.lead_id}?tab=vouchers` : "/vouchers");
    } catch {
      alert("Failed to delete voucher.");
    }
  }

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6, display: "block" };

  return (
    <AppShell title="Edit Voucher">
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push(voucher.lead_id ? `/leads/${voucher.lead_id}?tab=vouchers` : "/vouchers")}>← Back</button>
        <div style={{ fontWeight: 800, fontSize: 24, color: "#1a1a1a", flex: 1 }}>
          Edit Voucher: {voucher.hotel_name || "Unknown Hotel"}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => router.push(`/vouchers/${voucher.id}/pdf`)}>
            📄 Preview PDF
          </button>
          {canWrite && (
            <>
              <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: "#dc2626" }}>
                🗑️ Delete
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ background: BRAND, border: "none", color: "white" }}>
                {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Main Form */}
        <div style={{ background: "white", borderRadius: 16, border: "1px solid #e4e7ec", padding: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: BRAND, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 10 }}>
            🏨 Hotel Details
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Hotel Name</label>
              <input className="input w-full" value={voucher.hotel_name || ""} onChange={(e) => u("hotel_name", e.target.value)} disabled={!canWrite} />
            </div>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Hotel Address</label>
              <textarea className="input w-full" rows={2} value={voucher.hotel_address || ""} onChange={(e) => u("hotel_address", e.target.value)} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Star Rating</label>
              <input className="input w-full" type="number" min={1} max={5} value={voucher.hotel_stars || ""} onChange={(e) => u("hotel_stars", Number(e.target.value))} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Banner Image URL</label>
              <input className="input w-full" value={voucher.banner_image_url || ""} onChange={(e) => u("banner_image_url", e.target.value)} placeholder="https://..." disabled={!canWrite} />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: BRAND, marginTop: 32, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 10 }}>
            📅 Booking Details
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={labelStyle}>Guest Name (Primary Traveller)</label>
              <input className="input w-full" value={voucher.guest_name || ""} onChange={(e) => u("guest_name", e.target.value)} placeholder="e.g. John Doe" disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Check In</label>
              <input className="input w-full" type="date" value={voucher.check_in ? new Date(voucher.check_in).toISOString().split('T')[0] : ""} onChange={(e) => u("check_in", e.target.value)} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Check Out</label>
              <input className="input w-full" type="date" value={voucher.check_out ? new Date(voucher.check_out).toISOString().split('T')[0] : ""} onChange={(e) => u("check_out", e.target.value)} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Room Type</label>
              <input className="input w-full" value={voucher.room_type || ""} onChange={(e) => u("room_type", e.target.value)} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Meal Plan</label>
              <input className="input w-full" value={voucher.meal_plan || ""} onChange={(e) => u("meal_plan", e.target.value)} placeholder="e.g., Breakfast Included" disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Number of Rooms</label>
              <input className="input w-full" type="number" value={voucher.num_rooms || ""} onChange={(e) => u("num_rooms", Number(e.target.value))} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Number of Guests</label>
              <input className="input w-full" type="number" value={voucher.num_guests || ""} onChange={(e) => u("num_guests", Number(e.target.value))} disabled={!canWrite} />
            </div>
          </div>

          <h3 style={{ fontSize: 16, fontWeight: 800, color: BRAND, marginTop: 32, marginBottom: 20, borderBottom: "2px solid #f1f5f9", paddingBottom: 10 }}>
            📝 Policies & Extras
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div>
              <label style={labelStyle}>Cancellation Policy</label>
              <textarea className="input w-full" rows={3} value={voucher.cancellation_policy || ""} onChange={(e) => u("cancellation_policy", e.target.value)} disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Special Requests</label>
              <textarea className="input w-full" rows={3} value={voucher.special_requests || ""} onChange={(e) => u("special_requests", e.target.value)} disabled={!canWrite} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #e4e7ec", padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 16 }}>
              🎫 Supplier Details
            </h3>
            <div style={{ marginBottom: 12 }}>
              <label style={labelStyle}>Confirmation Number</label>
              <input className="input w-full" value={voucher.extra_data?.confirmation_number || ""} onChange={(e) => uExtra("confirmation_number", e.target.value)} placeholder="e.g. MMT-1234567" disabled={!canWrite} />
            </div>
            <div>
              <label style={labelStyle}>Supplier Name</label>
              <input className="input w-full" value={voucher.extra_data?.supplier_name || ""} onChange={(e) => uExtra("supplier_name", e.target.value)} placeholder="e.g. Agoda" disabled={!canWrite} />
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0", padding: 20 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
              Raw AI Parse Data
            </h3>
            <div style={{ fontSize: 12, color: "#475569", background: "white", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", maxHeight: 300, overflowY: "auto", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
              {voucher.extra_data?.raw || "No raw data available."}
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
