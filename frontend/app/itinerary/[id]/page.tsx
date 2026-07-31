"use client";
import { useState, useEffect, use, useRef } from "react";
import AppShell from "@/components/AppShell";
import { itineraryApi, authApi, uploadApi, resolveAssetUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import InlineText from "./InlineText";

const BRAND = "#0ea5e9";

// ── Section show/hide toggles ───────────────────────────────────────────────
// Sections default to visible; a false entry in itin.section_visibility hides
// them from the live preview and PDF even when they have data.
const SECTION_TOGGLES: { key: string; icon: string; label: string }[] = [
  { key: "flights", icon: "✈️", label: "Flights" },
  { key: "stay", icon: "🏨", label: "Hotels" },
  { key: "pricing", icon: "📦", label: "Pricing Table" },
  { key: "meals", icon: "🍽️", label: "Meals" },
  { key: "inclusions", icon: "✅", label: "Inclusions" },
  { key: "exclusions", icon: "🚫", label: "Exclusions" },
  { key: "payment_terms", icon: "📜", label: "Payment Policy" },
  { key: "about_us", icon: "🤝", label: "About Us" },
];

function isSectionVisible(itin: any, key: string): boolean {
  return itin?.section_visibility?.[key] !== false;
}

// ── Simple fallback image helper ────────────────────────────────────────────
function getFallbackImage(url: string, seed: string = ""): string {
  if (!url) return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
  if (!url.includes("loremflickr.com")) return url;

  // Just pick from 2 diverse fallback images based on the seed
  const fallbacks = [
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80", // Destination/travel
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80", // Beach
  ];

  let hash = 0;
  const str = seed || url;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % fallbacks.length;
  return fallbacks[idx];
}

// ── Regenerate image via Google (Places) ────────────────────────────────────
function RegenerateImageButton({ query, currentUrl, onResult, canWrite, buttonStyle, className }: { query: string; currentUrl?: string; onResult: (url: string) => void; canWrite: boolean; buttonStyle?: React.CSSProperties; className?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  if (!canWrite) return null;

  async function run() {
    if (!query.trim()) { setError("Add a name first"); return; }
    setLoading(true);
    setError("");
    try {
      const { url } = await itineraryApi.imageSearch(query, currentUrl);
      onResult(url);
    } catch (e: any) {
      setError(e.message || "No photo found");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <button type="button" onClick={run} disabled={loading} className={className ?? "btn btn-outline btn-sm"} style={{ padding: "4px 8px", cursor: "pointer", ...buttonStyle }} title={`Regenerate via Google: "${query}"`}>
        {loading ? "…" : "🔄 Google"}
      </button>
      {error && <span style={{ fontSize: 10, color: "#dc2626", maxWidth: 100 }}>{error}</span>}
    </div>
  );
}

// ── Inline activity row ──────────────────────────────────────────────────────
function ActivityRow({ value, onChange, onRemove, canWrite }: { value: string; onChange: (v: string) => void; onRemove: () => void; canWrite: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, group: true } as any}>
      <span style={{ color: BRAND, fontWeight: 700, flexShrink: 0 }}>›</span>
      <InlineText value={value} onChange={onChange} placeholder="Describe activity…" style={{ fontSize: 14, flex: 1 }} disabled={!canWrite} />
      {canWrite && (
        <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 14, opacity: 0.6, flexShrink: 0, padding: "0 2px" }} title="Remove">✕</button>
      )}
    </div>
  );
}

// ── Single day preview card ──────────────────────────────────────────────────
function DayPreviewCard({ day, index, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast, onUploadFile, canWrite }: {
  day: any; index: number; onChange: (d: any) => void; onRemove: () => void;
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean;
  onUploadFile: (f: File) => Promise<string | null>; canWrite: boolean;
}) {
  function u(k: string, v: any) { onChange({ ...day, [k]: v }); }
  function updateActivity(i: number, v: string) {
    const a = [...(day.activities || [])];
    if (typeof a[i] === "string") {
      a[i] = v;
    } else {
      a[i] = { id: a[i]?.id, text: v };
    }
    u("activities", a);
  }
  function addActivity() { u("activities", [...(day.activities || []), { id: `activity_${Date.now()}_${Math.random()}`, text: "" }]); }
  function removeActivity(i: number) { u("activities", (day.activities || []).filter((_: any, idx: number) => idx !== i)); }
  function toggleMeal(m: string) { u("meals", { ...day.meals, [m]: !day.meals?.[m] }); }

  // Places
  function updatePlace(i: number, k: string, v: any) {
    const p = [...(day.places || [])]; p[i] = { ...p[i], [k]: v }; u("places", p);
  }
  function addPlace() { u("places", [...(day.places || []), { id: `place_${Date.now()}_${Math.random()}`, name: "", description: "", image_url: "" }]); }
  function removePlace(i: number) { u("places", (day.places || []).filter((_: any, idx: number) => idx !== i)); }

  return (
    <div style={{ border: "1.5px solid #e4e7ec", borderRadius: 16, overflow: "hidden", marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,.06)", background: "white" }}>
      {/* Header bar */}
      <div style={{ background: "#f8fafc", padding: "14px 18px", borderBottom: "1px solid #e4e7ec", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ background: BRAND, color: "white", borderRadius: 8, padding: "4px 10px", fontWeight: 800, fontSize: 13 }}>
            DAY {day.day || index + 1}
          </div>
          <InlineText value={day.city || ""} onChange={(v) => u("city", v)} placeholder="City / Location" style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }} disabled={!canWrite} />
        </div>
        {canWrite && (
          <div style={{ display: "flex", gap: 6 }}>
            {!isFirst && <button onClick={onMoveUp} style={{ ...iconBtn, color: "#64748b", background: "white", border: "1px solid #e2e8f0" }}>▲</button>}
            {!isLast && <button onClick={onMoveDown} style={{ ...iconBtn, color: "#64748b", background: "white", border: "1px solid #e2e8f0" }}>▼</button>}
            <button onClick={onRemove} style={{ ...iconBtn, background: "#fee2e2", color: "#ef4444" }}>🗑</button>
          </div>
        )}
      </div>

      <div style={{ padding: "18px" }}>
        {/* Summary */}
        <InlineText value={day.summary || ""} onChange={(v) => u("summary", v)} placeholder="Day summary…" style={{ fontSize: 14, color: "#475569", marginBottom: 16, display: "block", fontStyle: "italic" }} disabled={!canWrite} />

        {/* Places */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
          {(day.places || []).map((p: any, i: number) => (
            <div key={p.id || i} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", background: "white" }}>
              {/* Place Image */}
              <div style={{ position: "relative", height: 220, background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                {p.image_url ? (
                  <img src={getFallbackImage(p.image_url, p.name)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { const t = e.currentTarget; const fb = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"; if (t.src !== fb) t.src = fb; }} />
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 24, flexDirection: "column", gap: 8 }}>
                    📸 No Image
                  </div>
                )}
                {/* Tag overlay */}
                <div style={{ position: "absolute", top: 12, left: 12, background: "white", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#0f172a", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", gap: 4 }}>
                  📍 Sightseeing
                </div>
                {/* Action buttons overlay */}
                {canWrite && (
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: 6 }}>
                    <label className="btn btn-sm" style={{ background: "white", border: "none", color: "#333", fontSize: 11, padding: "4px 8px", borderRadius: 6, cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}>
                      Upload Image
                      <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                        if (e.target.files?.[0]) {
                          const url = await onUploadFile(e.target.files[0]);
                          if (url) updatePlace(i, "image_url", url);
                        }
                      }} />
                    </label>
                    <RegenerateImageButton
                      query={[p.name, day.city].filter(Boolean).join(" ")}
                      currentUrl={p.image_url}
                      onResult={(url) => updatePlace(i, "image_url", url)}
                      canWrite={canWrite}
                      className=""
                      buttonStyle={{ background: "white", border: "none", color: "#333", fontSize: 11, borderRadius: 6, boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}
                    />
                    <button onClick={() => removePlace(i)} style={{ background: "#fee2e2", color: "#ef4444", border: "none", padding: "4px 8px", borderRadius: 6, cursor: "pointer", fontSize: 11, boxShadow: "0 2px 4px rgba(0,0,0,.1)" }}>✕</button>
                  </div>
                )}
              </div>
              {/* Place Content */}
              <div style={{ padding: "16px", background: "#fff" }}>
                <InlineText value={p.name || ""} onChange={(v) => updatePlace(i, "name", v)} placeholder="Place Name (e.g. Shanti Stupa)" style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 6, display: "block" }} disabled={!canWrite} />
                <InlineText value={p.description || ""} onChange={(v) => updatePlace(i, "description", v)} placeholder="Short description of what to do here..." style={{ fontSize: 14, color: "#475569", display: "block", lineHeight: 1.5, marginBottom: 12 }} disabled={!canWrite} />

                {/* Directions link */}
                {p.directions_url && (
                  <a href={p.directions_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: BRAND, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, background: BRAND + "10", padding: "6px 12px", borderRadius: 8, marginBottom: 12 }}>
                    🗺️ Get Directions
                  </a>
                )}

                {/* Manual Image/Directions Edit (hidden by default, only in edit) */}
                {canWrite && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>Edit:</div>
                    <input className="input" value={p.image_url || ""} onChange={(e) => updatePlace(i, "image_url", e.target.value)} placeholder="Image URL (optional)..." style={{ fontSize: 11 }} />
                    <input className="input" value={p.directions_url || ""} onChange={(e) => updatePlace(i, "directions_url", e.target.value)} placeholder="Google Maps URL (e.g. https://maps.google.com/?q=...)" style={{ fontSize: 11 }} />
                  </div>
                )}
              </div>
            </div>
          ))}
          {canWrite && <button onClick={addPlace} style={actAddBtn}>＋ Add Place / Sightseeing</button>}
        </div>

        {/* Activities */}
        <div style={{ marginBottom: 16 }}>
          {(day.activities || []).map((act: any, i: number) => {
            const actId = typeof act === "string" ? i : act?.id;
            const actText = typeof act === "string" ? act : act?.text || "";
            return <ActivityRow key={actId || i} value={actText} onChange={(v) => updateActivity(i, v)} onRemove={() => removeActivity(i)} canWrite={canWrite} />;
          })}
          {canWrite && <button onClick={addActivity} style={actAddBtn}>＋ Add Minor Activity</button>}
        </div>

        {/* Meals & tour type */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", paddingTop: 12, borderTop: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[["breakfast", "🍳"], ["lunch", "🍽️"], ["dinner", "🌙"]].map(([m, icon]) => (
              <label key={m} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: canWrite ? "pointer" : "default" }}>
                <input type="checkbox" checked={day.meals?.[m] || false} onChange={() => toggleMeal(m)} disabled={!canWrite} />
                {icon} <span style={{ textTransform: "capitalize", color: "#475569" }}>{m}</span>
              </label>
            ))}
          </div>
          <select
            value={day.tour_type || "Private"}
            onChange={(e) => u("tour_type", e.target.value)}
            disabled={!canWrite}
            style={{ fontSize: 12, border: "1px solid #e4e7ec", borderRadius: 6, padding: "4px 8px", background: "white", cursor: canWrite ? "pointer" : "default", color: "#334155" }}
          >
            {["Private", "SIC", "Self-drive"].map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}

const iconBtn: React.CSSProperties = { background: "rgba(0,0,0,.45)", color: "white", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 13 };
const actAddBtn: React.CSSProperties = { background: "none", border: "1.5px dashed #d1d5db", borderRadius: 8, padding: "5px 12px", fontSize: 12, color: "#6b7280", cursor: "pointer", width: "100%", marginTop: 4, transition: "all .15s" };

// ── Advisor / Agency tab ───────────────────────────────────────────────────
function AdvisorTab({ itin, u, canWrite }: { itin: any; u: (k: string, v: any) => void; canWrite: boolean }) {
  const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 };
  const highlights = Array.isArray(itin.agency_highlights) ? itin.agency_highlights : [];

  function updateHighlight(i: number, k: string, v: string) {
    const h = [...highlights]; h[i] = { ...h[i], [k]: v }; u("agency_highlights", h);
  }
  function addHighlight() { u("agency_highlights", [...highlights, { icon: "✓", label: "" }]); }
  function removeHighlight(i: number) { u("agency_highlights", highlights.filter((_: any, idx: number) => idx !== i)); }

  async function loadDefaults() {
    try {
      const me = await authApi.me();
      if (!itin.advisor_name) u("advisor_name", me.name);
      if (!itin.advisor_phone) u("advisor_phone", me.advisor_phone);
      if (!itin.advisor_email) u("advisor_email", me.email);
      if (!itin.agency_name) u("agency_name", me.agency_name);
      if (!itin.agency_office_address) u("agency_office_address", me.agency_office_address);
      if (!itin.agency_highlights && me.agency_highlights) u("agency_highlights", me.agency_highlights);
    } catch (e) { console.error(e); }
  }

  async function saveAsDefaults() {
    try {
      await authApi.updateMe({
        advisor_phone: itin.advisor_phone,
        agency_name: itin.agency_name,
        agency_office_address: itin.agency_office_address,
        agency_highlights: itin.agency_highlights,
      });
      alert("Saved as your account defaults.");
    } catch (e) { console.error(e); alert("Failed to save defaults."); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 11, color: "#6b7280", padding: "8px 12px", background: "#f1f5f9", borderRadius: 8 }}>
        Per-itinerary overrides. Blank fields fall back to your account defaults.
      </div>
      {canWrite && (
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={loadDefaults} className="btn btn-outline btn-sm" style={{ fontSize: 11, flex: 1 }}>↓ Load my defaults</button>
          <button onClick={saveAsDefaults} className="btn btn-outline btn-sm" style={{ fontSize: 11, flex: 1 }}>↑ Save as my defaults</button>
        </div>
      )}
      {[
        ["Advisor Name", "advisor_name"],
        ["Advisor Phone", "advisor_phone"],
        ["Advisor Email", "advisor_email"],
        ["Agency / Company", "agency_name"],
      ].map(([l, k]) => (
        <div key={k}>
          <div style={fieldLabel}>{l}</div>
          <input className="input" value={itin[k] || ""} onChange={(e) => u(k, e.target.value)} placeholder="" style={{ fontSize: 13 }} disabled={!canWrite} />
        </div>
      ))}
      <div>
        <div style={fieldLabel}>Office Address</div>
        <textarea className="input" rows={2} value={itin.agency_office_address || ""} onChange={(e) => u("agency_office_address", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} />
      </div>
      <div>
        <div style={fieldLabel}>Why Choose Us — Highlights</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {highlights.map((h: any, i: number) => (
            <div key={i} style={{ display: "flex", gap: 6 }}>
              <input className="input" value={h.icon || ""} onChange={(e) => updateHighlight(i, "icon", e.target.value)} placeholder="✓" style={{ fontSize: 13, width: 40, textAlign: "center" }} disabled={!canWrite} />
              <input className="input" value={h.label || ""} onChange={(e) => updateHighlight(i, "label", e.target.value)} placeholder="e.g. 100+ reviews" style={{ fontSize: 13, flex: 1 }} disabled={!canWrite} />
              {canWrite && <button onClick={() => removeHighlight(i)} className="btn btn-ghost btn-sm" style={{ color: "#ef4444", padding: "0 8px" }}>✕</button>}
            </div>
          ))}
          {canWrite && <button onClick={addHighlight} className="btn btn-ghost btn-sm" style={{ fontSize: 12, marginTop: 4 }}>＋ Add Highlight</button>}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ItineraryEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("itinerary", "write");
  const { id } = use(params);
  const [itin, setItin] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [chatCmd, setChatCmd] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<"overview" | "flights" | "stay" | "pricing" | "policies" | "advisor">("overview");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareToken, setShareToken] = useState<string>("");
  const [shareEnabled, setShareEnabled] = useState<boolean>(true);
  const [copied, setCopied] = useState(false);

  const debounceRef = useRef<any>({});

  useEffect(() => {
    itineraryApi.get(Number(id)).then((data) => {
      setItin(data);
      if (data.share_token) setShareToken(data.share_token);
      if (data.share_enabled !== undefined) setShareEnabled(data.share_enabled);
    }).catch(console.error);
  }, [id]);

  if (!itin) return <AppShell title="Loading…"><div style={{ padding: 80, textAlign: "center" }}>⏳ Loading…</div></AppShell>;

  function u(k: string, v: any) { setItin((p: any) => ({ ...p, [k]: v })); }

  function toggleSection(key: string) {
    u("section_visibility", { ...(itin.section_visibility || {}), [key]: !isSectionVisible(itin, key) });
  }

  function uFlight(leg: string, k: string, v: string) {
    // Update local display immediately (keeping focus)
    setItin((p: any) => ({
      ...p,
      flights: {
        ...p.flights,
        [leg]: { ...(p.flights?.[leg] || {}), [k]: v }
      }
    }));

    // Debounce the actual save (if needed in future)
    clearTimeout(debounceRef.current[`${leg}-${k}`]);
  }

  function uMeal(m: string, v: number) { u("meals_summary", { ...itin.meals_summary, [m]: v }); }

  // Days helpers
  function updateDay(i: number, d: any) { const days = [...(itin.days || [])]; days[i] = d; u("days", days); }
  function addDay() { u("days", [...(itin.days || []), { day: (itin.days?.length || 0) + 1, city: "", summary: "", activities: [], meals: {}, tour_type: "Private" }]); }
  function removeDay(i: number) { u("days", (itin.days || []).filter((_: any, idx: number) => idx !== i).map((d: any, idx: number) => ({ ...d, day: idx + 1 }))); }
  function moveDay(i: number, dir: number) {
    const days = [...(itin.days || [])];
    const j = i + dir;
    if (j < 0 || j >= days.length) return;
    [days[i], days[j]] = [days[j], days[i]];
    u("days", days.map((d: any, idx: number) => ({ ...d, day: idx + 1 })));
  }

  // Hotels
  function addHotel() { u("stay_options", [...(itin.stay_options || []), { option: `OPTION ${(itin.stay_options?.length || 0) + 1}`, hotel_name: "", city: "", nights: 1, room_category: "Deluxe", meal_plan: "" }]); }
  function uHotel(i: number, k: string, v: any) {
    setItin((p: any) => {
      const o = [...(p.stay_options || [])];
      o[i] = { ...o[i], [k]: v };
      return { ...p, stay_options: o };
    });
  }
  function removeHotel(i: number) { u("stay_options", (itin.stay_options || []).filter((_: any, idx: number) => idx !== i)); }

  async function handleSave() {
    setSaving(true);
    try { await itineraryApi.update(itin.id, itin); setSaved(true); setTimeout(() => setSaved(false), 2000); }
    catch (e) { console.error(e); } finally { setSaving(false); }
  }

  async function uploadFile(file: File): Promise<string | null> {
    if (!file) return null;
    try {
      const url = await uploadApi.image(file);
      return resolveAssetUrl(url);
    } catch (e) {
      console.error(e);
      alert("Failed to upload image");
      return null;
    }
  }

  async function handleChatEdit() {
    if (!chatCmd.trim()) return;
    setChatLoading(true);
    try { const updated = await itineraryApi.chatEdit(itin.id, chatCmd); setItin(updated); setChatCmd(""); }
    catch (e) { console.error(e); } finally { setChatLoading(false); }
  }

  const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 };

  // ── Left panel tab content ──────────────────────────────────────────────
  // NOTE: intentionally a plain JSX value, not a nested component function —
  // defining it as `function LeftContent() {...}` inside this component's
  // body gave it a new identity every render, which made React unmount and
  // remount the whole left panel (and its focused <input>) on every
  // keystroke.
  const leftContent = (
      <div>
        {/* Visible Sections */}
        <div style={{ marginBottom: 16, padding: 10, background: "#f8fafc", borderRadius: 10, border: "1px solid #e4e7ec" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 8 }}>Visible Sections</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 8px" }}>
            {SECTION_TOGGLES.map(({ key, icon, label }) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, cursor: canWrite ? "pointer" : "default", color: "#374151" }}>
                <input type="checkbox" checked={isSectionVisible(itin, key)} onChange={() => toggleSection(key)} disabled={!canWrite} />
                {icon} {label}
              </label>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {(["overview", "flights", "stay", "pricing", "policies", "advisor"] as const).map((t) => (
            <button key={t} onClick={() => setLeftTab(t)} style={{ padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600, border: "1.5px solid", borderColor: leftTab === t ? BRAND : "#e4e7ec", background: leftTab === t ? BRAND : "white", color: leftTab === t ? "white" : "#6b7280", cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
          ))}
        </div>

        {leftTab === "overview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={fieldLabel}>Layout Theme</div>
              <select
                className="input"
                value={itin.layout || "dark_template"}
                onChange={(e) => u("layout", e.target.value)}
                style={{ fontSize: 13, fontWeight: 600 }}
                disabled={!canWrite}
              >
                <option value="dark_template">🌙 Dark Template (Plannatrip Style)</option>
                <option value="visual_experience">🖼️ Visual Experience</option>
                <option value="daily_snapshot">📋 Daily Snapshot</option>
                <option value="magazine_pro">✨ Magazine Pro</option>
              </select>
            </div>
            {[
              { label: "Cover Title", k: "cover_title" },
              { label: "Cover Subheading", k: "cover_subheading" },
              { label: "Destination", k: "destination" },
            ].map(({ label, k }) => (
              <div key={k}>
                <div style={fieldLabel}>{label}</div>
                <input className="input" value={itin[k] || ""} onChange={(e) => u(k, e.target.value)} placeholder={label} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
            ))}
            <div>
              <div style={fieldLabel}>Cover Image URL</div>
              <div style={{ display: "flex", gap: 6 }}>
                <input className="input" value={itin.cover_image_url || ""} onChange={(e) => u("cover_image_url", e.target.value)} style={{ fontSize: 12, flex: 1 }} placeholder="https://..." disabled={!canWrite} />
                {canWrite && (
                  <label className="btn btn-outline btn-sm" style={{ padding: "4px 8px", cursor: "pointer" }}>
                    Upload
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                      if (e.target.files?.[0]) {
                        const url = await uploadFile(e.target.files[0]);
                        if (url) u("cover_image_url", url);
                      }
                    }} />
                  </label>
                )}
                <RegenerateImageButton
                  query={itin.destination ? `${itin.destination} iconic landmark scenery` : (itin.cover_title || itin.title || "")}
                  currentUrl={itin.cover_image_url}
                  onResult={(url) => u("cover_image_url", url)}
                  canWrite={canWrite}
                />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {[["Days", "total_days"], ["Nights", "total_nights"], ["Pax", "num_travellers"]].map(([l, k]) => (
                <div key={k}>
                  <div style={fieldLabel}>{l}</div>
                  <input className="input" type="number" value={itin[k] || ""} onChange={(e) => u(k, Number(e.target.value))} style={{ fontSize: 13 }} disabled={!canWrite} />
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <div style={fieldLabel}>Start Date</div>
                <input className="input" type="date" value={itin.start_date || ""} onChange={(e) => u("start_date", e.target.value || null)} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
              <div>
                <div style={fieldLabel}>End Date</div>
                <input className="input" type="date" value={itin.end_date || ""} onChange={(e) => u("end_date", e.target.value || null)} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div>
                <div style={fieldLabel}>Adults</div>
                <input className="input" type="number" min={0} value={itin.num_adults || ""} onChange={(e) => u("num_adults", Number(e.target.value))} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
              <div>
                <div style={fieldLabel}>Children</div>
                <input className="input" type="number" min={0} value={itin.num_children || ""} onChange={(e) => u("num_children", Number(e.target.value))} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
              <div>
                <div style={fieldLabel}>Cab Type</div>
                <input className="input" value={itin.cab_type || ""} onChange={(e) => u("cab_type", e.target.value)} placeholder="e.g. Sedan" style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
            </div>
            <div>
              <div style={fieldLabel}>Meals (B / L / D)</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[["B", "breakfast"], ["L", "lunch"], ["D", "dinner"]].map(([s, m]) => (
                  <div key={m} style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>{s}</div>
                    <input className="input" type="number" min={0} value={itin.meals_summary?.[m] || 0} onChange={(e) => uMeal(m, Number(e.target.value))} style={{ fontSize: 13, textAlign: "center" }} disabled={!canWrite} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {leftTab === "flights" && (
          <div>
            {[["onward", "🛫 Onward"], ["return", "🛬 Return"]].map(([leg, label]) => (
              <div key={leg} style={{ marginBottom: 16, padding: 14, border: "1.5px solid #e4e7ec", borderRadius: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>{label}</div>
                {[["from","From City"],["to","To City"],["airline","Airline"],["flight_number","Flight No."],["date","Date"],["departure_time","Depart"],["arrival_time","Arrive"],["baggage","Baggage"]].map(([k, lbl]) => (
                  <div key={k} style={{ marginBottom: 8 }}>
                    <div style={fieldLabel}>{lbl}</div>
                    <input className="input" type={k.includes("time") ? "time" : k === "date" ? "date" : "text"} value={itin.flights?.[leg]?.[k] || ""} onChange={(e) => uFlight(leg, k, e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {leftTab === "stay" && (
          <div>
            {(itin.stay_options || []).map((s: any, i: number) => (
              <div key={i} style={{ marginBottom: 12, padding: 14, border: "1.5px solid #e4e7ec", borderRadius: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: BRAND }}>{s.option || `Hotel ${i + 1}`}</span>
                  {canWrite && <button onClick={() => removeHotel(i)} style={{ background: "none", border: "none", cursor: "pointer", color: "#f87171", fontSize: 13 }}>✕</button>}
                </div>
                {[["hotel_name","Hotel Name"],["city","City"],["room_category","Room Type"], ["meal_plan", "Meal Plan"], ["google_rating", "Google Rating (e.g. 4.5)"], ["directions_url", "Google Maps URL"]].map(([k, lbl]) => (
                  <div key={k} style={{ marginBottom: 6 }}>
                    <div style={fieldLabel}>{lbl}</div>
                    <input className="input" value={s[k] || ""} onChange={(e) => uHotel(i, k, e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} />
                  </div>
                ))}
                <div style={{ marginBottom: 6 }}>
                  <div style={fieldLabel}>Hotel Image URL</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input className="input" value={s.image_url || ""} onChange={(e) => uHotel(i, "image_url", e.target.value)} style={{ fontSize: 12, flex: 1 }} placeholder="https://..." disabled={!canWrite} />
                    {canWrite && (
                      <label className="btn btn-outline btn-sm" style={{ padding: "4px 8px", cursor: "pointer" }}>
                        Upload
                        <input type="file" accept="image/*" style={{ display: "none" }} onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            const url = await uploadFile(e.target.files[0]);
                            if (url) uHotel(i, "image_url", url);
                          }
                        }} />
                      </label>
                    )}
                    <RegenerateImageButton
                      query={[s.hotel_name, s.city, "hotel"].filter(Boolean).join(" ")}
                      currentUrl={s.image_url}
                      onResult={(url) => uHotel(i, "image_url", url)}
                      canWrite={canWrite}
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
                  <div>
                    <div style={fieldLabel}>Google Rating (1-5)</div>
                    <input className="input" type="number" step="0.1" value={s.google_rating || ""} onChange={(e) => uHotel(i, "google_rating", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} />
                  </div>
                  <div>
                    <div style={fieldLabel}>Directions URL</div>
                    <input className="input" value={s.directions_url || ""} onChange={(e) => uHotel(i, "directions_url", e.target.value)} style={{ fontSize: 12 }} placeholder="https://maps.google..." disabled={!canWrite} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <div>
                    <div style={fieldLabel}>Nights</div>
                    <input className="input" type="number" value={s.nights || ""} onChange={(e) => uHotel(i, "nights", Number(e.target.value))} style={{ fontSize: 12 }} disabled={!canWrite} />
                  </div>
                  <div>
                    <div style={fieldLabel}>Meal Plan</div>
                    <select className="input" value={s.meal_plan || ""} onChange={(e) => uHotel(i, "meal_plan", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite}>
                      {["","Room Only","Breakfast","Half Board","Full Board"].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={fieldLabel}>Total Cost for this option (₹) — shown in Package Pricing table</div>
                  <input className="input" type="number" value={s.total_cost || ""} onChange={(e) => uHotel(i, "total_cost", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} />
                </div>
              </div>
            ))}
            {canWrite && <button onClick={addHotel} style={{ ...addBtn, marginTop: 8 }}>＋ Add Hotel</button>}
          </div>
        )}

        {leftTab === "pricing" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[["Package Cost (₹)", "package_cost"], ["Per Person (₹)", "per_person_cost"]].map(([l, k]) => (
              <div key={k}>
                <div style={fieldLabel}>{l}</div>
                <input className="input" value={itin[k] || ""} onChange={(e) => u(k, e.target.value)} style={{ fontSize: 13 }} disabled={!canWrite} />
              </div>
            ))}
          </div>
        )}

        {leftTab === "policies" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={fieldLabel}>Inclusions (one item per line)</div>
              <textarea className="input" rows={6} value={itin.inclusions || ""} onChange={(e) => u("inclusions", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} placeholder="Accommodation in Hotel as mentioned&#10;Airport Transfer in Leh&#10;Transportation by Ertiga / Innova or Similar" />
            </div>
            <div>
              <div style={fieldLabel}>Exclusions (one item per line)</div>
              <textarea className="input" rows={6} value={itin.exclusions || ""} onChange={(e) => u("exclusions", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} placeholder="Any Airfares&#10;Camera fees, Tips, gratuities&#10;Tour guide&#10;Entries to Monasteries" />
            </div>
            <div>
              <div style={fieldLabel}>Payment Policy & Important Notes (one per line — rendered as numbered list)</div>
              <textarea className="input" rows={6} value={itin.payment_terms || ""} onChange={(e) => u("payment_terms", e.target.value)} style={{ fontSize: 12 }} disabled={!canWrite} placeholder="Prices valid for maximum 4 pax traveling together in one vehicle.&#10;Final Confirmation will be provided on 50% advance payment.&#10;All sightseeing is subject to weather and political conditions." />
            </div>
          </div>
        )}

        {leftTab === "advisor" && (
          <AdvisorTab itin={itin} u={u} canWrite={canWrite} />
        )}

        {/* AI Chat */}
        {canWrite && (
          <div style={{ marginTop: 20, padding: 14, background: "#f0fdf4", borderRadius: 12, border: "1px solid #bbf7d0" }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🤖 AI Chat Edit</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
              {["Add a spa day on Day 2", "Change all hotels to 5-star", "Add beach activities on last day"].map((cmd) => (
                <button key={cmd} onClick={() => setChatCmd(cmd)} style={{ textAlign: "left", background: "white", border: "1px solid #d1fae5", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer", color: "#065f46" }}>💬 {cmd}</button>
              ))}
            </div>
            <textarea
              className="input"
              rows={2}
              value={chatCmd}
              onChange={(e) => setChatCmd(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatEdit(); } }}
              placeholder="e.g. Add a cooking class on Day 3…"
              style={{ fontSize: 12, marginBottom: 8 }}
            />
            <button
              onClick={handleChatEdit}
              disabled={chatLoading || !chatCmd.trim()}
              style={{ width: "100%", background: BRAND, color: "white", border: "none", borderRadius: 8, padding: "8px 0", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >{chatLoading ? "✨ Applying…" : "✨ Apply Edit"}</button>
          </div>
        )}
      </div>
  );

  return (
    <AppShell title="Edit Itinerary">
      {/* Top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/itinerary")}>← Back</button>
        <InlineText value={itin.title || ""} onChange={(v) => canWrite && u("title", v)} placeholder="Itinerary Title" style={{ fontWeight: 700, fontSize: 20, flex: 1, maxWidth: 500, opacity: canWrite ? 1 : 0.6 }} />
        <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowShareModal(true)}
            style={{ background: "linear-gradient(90deg, #00b4d8, #0077b6)", border: "none", color: "white", fontWeight: 700 }}
          >
            🌐 Share Client Link
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => router.push(`/itinerary/${itin.id}/pdf`)}>📄 PDF</button>
          {canWrite && (
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : saved ? "✅ Saved!" : "💾 Save"}
            </button>
          )}
        </div>
      </div>

      {/* ══════ SHARE MANAGEMENT MODAL ══════ */}
      {showShareModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }}>
          <div style={{
            background: "#ffffff", borderRadius: 20, width: "100%", maxWidth: 520,
            padding: 28, boxShadow: "0 20px 40px rgba(0,0,0,0.2)", position: "relative"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, borderBottom: "1px solid #f1f5f9", paddingBottom: 12 }}>
              <div style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🌐</span> Share Itinerary with Client
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            {/* Sharing Toggle */}
            <div style={{ background: shareEnabled ? "#f0fdf4" : "#fef2f2", border: `1px solid ${shareEnabled ? "#bbf7d0" : "#fecaca"}`, borderRadius: 14, padding: 16, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: shareEnabled ? "#166534" : "#991b1b" }}>
                  {shareEnabled ? "🟢 Sharing Enabled" : "🔴 Sharing Disabled"}
                </div>
                <div style={{ fontSize: 12, color: shareEnabled ? "#15803d" : "#b91c1c", marginTop: 2 }}>
                  {shareEnabled ? "Clients can view this itinerary brochure via the share link." : "The share link is currently disabled. Clients will see a private notice."}
                </div>
              </div>
              {canWrite && (
                <button
                  onClick={async () => {
                    try {
                      const res = await itineraryApi.toggleShare(itin.id, !shareEnabled);
                      setShareEnabled(res.share_enabled);
                    } catch (e: any) {
                      alert("Failed to toggle sharing: " + e.message);
                    }
                  }}
                  className={`btn btn-sm ${shareEnabled ? "btn-outline" : "btn-primary"}`}
                  style={{ fontSize: 12, fontWeight: 700 }}
                >
                  {shareEnabled ? "Disable Sharing" : "Enable Sharing"}
                </button>
              )}
            </div>

            {/* Secure Token Link Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>
                Secure Public Share Link (Random Token)
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  className="input"
                  readOnly
                  value={shareToken ? `${typeof window !== "undefined" ? window.location.origin : ""}/share/${shareToken}` : "Generating token..."}
                  style={{ fontSize: 13, flex: 1, background: "#f8fafc", color: "#0f172a", fontFamily: "monospace" }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!shareToken}
                  onClick={() => {
                    const link = `${window.location.origin}/share/${shareToken}`;
                    navigator.clipboard.writeText(link);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  style={{ whiteSpace: "nowrap" }}
                >
                  {copied ? "✅ Copied!" : "📋 Copy Link"}
                </button>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>
                🔒 Secure token protects your itinerary ID from being exposed.
              </div>
            </div>

            {/* Actions: Open & Regenerate */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", borderTop: "1px solid #f1f5f9", paddingTop: 16 }}>
              <a
                href={shareToken ? `/share/${shareToken}` : "#"}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ flex: 1, textDecoration: "none", textAlign: "center", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                👁️ Open Client View
              </a>
              {canWrite && (
                <button
                  className="btn btn-ghost btn-sm"
                  style={{ color: "#dc2626", border: "1px solid #fca5a5" }}
                  onClick={async () => {
                    if (confirm("Regenerating the link will revoke the old token. Anyone with the old link will no longer be able to view the itinerary. Continue?")) {
                      try {
                        const res = await itineraryApi.regenerateShareToken(itin.id);
                        setShareToken(res.share_token);
                        setShareEnabled(res.share_enabled);
                        alert("A new secure share link has been generated!");
                      } catch (e: any) {
                        alert("Failed to regenerate token: " + e.message);
                      }
                    }
                  }}
                >
                  🔄 Regenerate Link
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Split pane */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>

        {/* LEFT: Controls */}
        <div style={{ position: "sticky", top: 20, maxHeight: "calc(100vh - 140px)", overflowY: "auto", background: "white", border: "1.5px solid #e4e7ec", borderRadius: 16, padding: 18 }}>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12, color: BRAND }}>✏️ Edit Details</div>
          {leftContent}
        </div>

        {/* RIGHT: Live preview */}
        <div>
          <div style={{ background: "#f8fafc", border: "1.5px solid #e4e7ec", borderRadius: 16, padding: "18px 20px", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>📋 Live Preview — click any text to edit inline</div>

            {/* Cover preview */}
            <div style={{ 
              position: "relative", 
              borderRadius: 16, 
              overflow: "hidden", 
              marginBottom: 20, 
              minHeight: 280, 
              display: "flex", 
              flexDirection: "column", 
              justifyContent: "flex-end", 
              padding: "32px",
              background: itin.cover_image_url ? `url(${getFallbackImage(itin.cover_image_url, itin.title)}) center/cover no-repeat` : "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)"
            }}>
              {itin.cover_image_url && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)" }} />}
              
              <div style={{ position: "relative", zIndex: 1, color: itin.cover_image_url ? "white" : "#0f172a" }}>
                <InlineText value={itin.cover_title || ""} onChange={(v) => u("cover_title", v)} placeholder="Cover Title" style={{ fontSize: 32, fontWeight: 900, textShadow: itin.cover_image_url ? "0 2px 8px rgba(0,0,0,0.5)" : "none" }} disabled={!canWrite} />
                <InlineText value={itin.cover_subheading || ""} onChange={(v) => u("cover_subheading", v)} placeholder="Cover Subheading" style={{ fontSize: 16, opacity: 0.9, marginTop: 8, textShadow: itin.cover_image_url ? "0 1px 4px rgba(0,0,0,0.5)" : "none" }} disabled={!canWrite} />
                
                <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
                  {itin.num_travellers && <span style={{ ...tag, background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", color: itin.cover_image_url ? "white" : "#0f172a", border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #cbd5e1" }}>👥 {itin.num_travellers} Pax</span>}
                  {itin.total_days && <span style={{ ...tag, background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", color: itin.cover_image_url ? "white" : "#0f172a", border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #cbd5e1" }}>📅 {itin.total_days}D/{itin.total_nights}N</span>}
                  {itin.destination && <span style={{ ...tag, background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)", color: itin.cover_image_url ? "white" : "#0f172a", border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #cbd5e1" }}>📍 {itin.destination}</span>}
                </div>
              </div>
            </div>

            {/* Flights */}
            {isSectionVisible(itin, "flights") && <FlightsSection flights={itin.flights || {}} />}

            {/* Summary — top placement so it sits above stay details, pricing & meal */}
            <SummarySection itin={itin} style={{ marginBottom: 20 }} />

            {/* Package Pricing & Details */}
            {isSectionVisible(itin, "pricing") && <PackagePricingSection stayOptions={itin.stay_options || []} />}

            {/* Meal */}
            {isSectionVisible(itin, "meals") && <MealSection meals={itin.meals_summary || {}} />}

            {/* Hotels summary */}
            {isSectionVisible(itin, "stay") && (itin.stay_options || []).length > 0 && (
              <div style={{ marginBottom: 20, marginTop: 24 }}>
                <SectionHeading>🏨 Premium Stay</SectionHeading>
                {(itin.stay_options || []).map((s: any, i: number) => (
                  <div key={i} style={{ display: "flex", gap: 16, alignItems: "stretch", padding: 12, border: "1px solid #e2e8f0", borderRadius: 16, marginBottom: 12, background: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.02)" }}>
                    <div style={{ width: 120, height: 90, flexShrink: 0, borderRadius: 10, overflow: "hidden", background: "#f1f5f9", position: "relative" }}>
                      {s.image_url ? (
                        <img src={getFallbackImage(s.image_url, s.hotel_name)} alt="Hotel" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { const t = e.currentTarget; const fb = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"; if (t.src !== fb) t.src = fb; }} />
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 28 }}>🏨</div>
                      )}
                    </div>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: BRAND, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 2 }}>{s.option}</div>
                          <InlineText value={s.hotel_name || ""} onChange={(v) => uHotel(i, "hotel_name", v)} placeholder="Hotel Name" style={{ fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 4 }} disabled={!canWrite} />
                        </div>
                        {s.google_rating && (
                          <div style={{ background: "#fef3c7", color: "#b45309", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                            ⭐ {s.google_rating}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                        📍 {s.city} · 🛏️ {s.room_category || "Standard"} · 🌙 {s.nights} Nights
                        {s.meal_plan && <span> · 🍽️ {s.meal_plan}</span>}
                      </div>
                      {s.directions_url && (
                        <div>
                          <a href={s.directions_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: BRAND, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, background: BRAND + "10", padding: "4px 10px", borderRadius: 20 }}>
                            🗺️ Get Directions
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Days */}
            <SectionHeading>📅 Day-by-Day Itinerary</SectionHeading>
            {(itin.days || []).map((day: any, i: number) => (
              <DayPreviewCard
                key={i}
                day={day}
                index={i}
                onChange={(d) => updateDay(i, d)}
                onRemove={() => removeDay(i)}
                onMoveUp={() => moveDay(i, -1)}
                onMoveDown={() => moveDay(i, 1)}
                isFirst={i === 0}
                isLast={i === (itin.days?.length || 0) - 1}
                onUploadFile={uploadFile}
                canWrite={canWrite}
              />
            ))}
            {canWrite && (
              <button onClick={addDay} style={{ ...addBtn, padding: "10px 0", fontSize: 14, fontWeight: 600, color: BRAND, borderColor: BRAND + "50" }}>
                ＋ Add New Day
              </button>
            )}

            {/* Inclusions */}
            {isSectionVisible(itin, "inclusions") && <InclusionsSection inclusions={itin.inclusions} />}

            {/* Exclusions */}
            {isSectionVisible(itin, "exclusions") && <ExclusionsSection exclusions={itin.exclusions} />}

            {/* Payment Policy & Important Notes */}
            {isSectionVisible(itin, "payment_terms") && <PaymentPolicySection terms={itin.payment_terms} />}

            {/* About us / Why choose us + Holiday Advisor */}
            {isSectionVisible(itin, "about_us") && (
              <AboutUsSection
                highlights={Array.isArray(itin.agency_highlights) ? itin.agency_highlights : []}
                advisor={{ name: itin.advisor_name, phone: itin.advisor_phone, email: itin.advisor_email }}
                agency={{ name: itin.agency_name, office_address: itin.agency_office_address }}
              />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

// ── New preview sections ────────────────────────────────────────────────────
function SectionCardHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#1e293b" }}>{title}</div>
    </div>
  );
}

function fmtINR(n: any): string {
  const num = Number(String(n || "").replace(/[^\d.]/g, ""));
  if (!num || Number.isNaN(num)) return "—";
  return "Rs." + num.toLocaleString("en-IN");
}

function fmtDate(d: any): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return String(d); }
}

function FlightRow({ leg, label }: { leg: any; label: string }) {
  if (!leg?.from && !leg?.airline) return null;
  return (
    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
      <td style={pricingTD}><strong style={{ color: BRAND }}>{label}</strong></td>
      <td style={pricingTD}>{leg.airline || "—"}</td>
      <td style={pricingTD}>{leg.from || "—"} → {leg.to || "—"}</td>
      <td style={pricingTD}>{fmtDate(leg.date)}</td>
      <td style={pricingTD}>{leg.departure_time || "—"} – {leg.arrival_time || "—"}</td>
      <td style={pricingTD}>{leg.baggage || "—"}</td>
    </tr>
  );
}

function FlightsSection({ flights }: { flights: any }) {
  if (!flights?.onward?.from && !flights?.return?.from) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 20 }}>
      <SectionCardHeader icon="✈️" title="Flight Details" />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              {["Sector", "Airline", "Route", "Date", "Timing", "Baggage"].map((h) => <th key={h} style={pricingTH}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            <FlightRow leg={flights.onward} label="Onward" />
            <FlightRow leg={flights.return} label="Return" />
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummarySection({ itin, style }: { itin: any; style?: React.CSSProperties }) {
  const rows: [string, string, string][] = [
    ["📅", "Date", `${fmtDate(itin.start_date)} - ${fmtDate(itin.end_date)}`],
    ["⏱️", "Duration", `${itin.total_nights || 0} Nights, ${itin.total_days || 0} Days`],
    ["💵", "Per Person Cost", itin.per_person_cost ? fmtINR(itin.per_person_cost) : "—"],
    ["💰", "Total Cost", itin.package_cost ? fmtINR(itin.package_cost) : "Refer to costing below"],
    ["👥", "Travelers", `${itin.num_adults ?? 0} Adults${itin.num_children ? ` | ${itin.num_children} Children` : ""}`],
    ["🚙", "Cab Details", itin.cab_type || "—"],
    ["📍", "Destinations", itin.destination || "—"],
  ];
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <SectionCardHeader icon="👆" title="Summary" />
        <button style={{ background: "#ef4444", color: "white", border: "none", padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Book Now</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
        {rows.map(([icon, label, val], i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", marginBottom: 2 }}><span>{icon}</span>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: label === "Total Cost" ? "#16a34a" : "#0f172a" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PackagePricingSection({ stayOptions }: { stayOptions: any[] }) {
  if (!stayOptions.length) return null;
  // Group by `option`
  const groups: Record<string, any[]> = {};
  for (const s of stayOptions) {
    const key = s.option || "Option";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  const groupKeys = Object.keys(groups);
  // Collect all city columns across all options for a consistent table
  const cities = Array.from(new Set(stayOptions.map((s) => s.city).filter(Boolean)));
  if (!cities.length) return null;

  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <SectionCardHeader icon="📦" title="Package Pricing & Details" />
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#fef3c7" }}>
              <th style={pricingTH}>Option</th>
              {cities.map((c) => <th key={c} style={pricingTH}>Hotel Details {c}</th>)}
              <th style={pricingTH}>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {groupKeys.map((opt, i) => {
              const rowBg = i % 2 === 0 ? "#fff7ed" : "#f0fdf4";
              const rows = groups[opt];
              const totalCost = rows.find((r) => r.total_cost)?.total_cost;
              return (
                <tr key={opt} style={{ background: rowBg }}>
                  <td style={pricingTD}>{opt}</td>
                  {cities.map((c) => {
                    const row = rows.find((r) => r.city === c);
                    return (
                      <td key={c} style={pricingTD}>
                        {row ? `${row.nights || 0} N ${c} - ${row.hotel_name || ""}${row.hotel_name ? " /Similar" : ""}` : "—"}
                      </td>
                    );
                  })}
                  <td style={{ ...pricingTD, fontWeight: 700 }}>{totalCost ? fmtINR(totalCost) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
const pricingTH: React.CSSProperties = { padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#78350f", fontSize: 12 };
const pricingTD: React.CSSProperties = { padding: "14px", color: "#1f2937", verticalAlign: "top" };

function MealSection({ meals }: { meals: any }) {
  const items = [
    meals?.breakfast ? `${meals.breakfast} Breakfast` : null,
    meals?.lunch ? `${meals.lunch} Lunch` : null,
    meals?.dinner ? `${meals.dinner} Dinner` : null,
  ].filter(Boolean) as string[];
  if (!items.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <SectionCardHeader icon="🍽️" title="Meal" />
      <div style={{ background: "#fff7ed", borderRadius: 12, padding: "20px", textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 14 }}>Meals Included Throughout Your Journey</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {items.map((it) => (
            <div key={it} style={{ background: "white", border: "1px solid #fed7aa", borderRadius: 10, padding: "16px 32px", fontWeight: 700, fontSize: 16, color: "#c2410c" }}>{it}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}>
          <strong>Note:</strong> Specific meal details are mentioned in each day's itinerary below
        </div>
      </div>
    </div>
  );
}

function bulletList(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/\r?\n/).map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim()).filter(Boolean);
}

function InclusionsSection({ inclusions }: { inclusions?: string }) {
  const items = bulletList(inclusions);
  if (!items.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <SectionCardHeader icon="✅" title="What's Included & Excluded" />
      <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "20px 24px", border: "1px solid #bbf7d0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18, color: "#16a34a", marginBottom: 14 }}>
          <span style={{ width: 22, height: 22, background: "#16a34a", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✓</span>
          Inclusions
        </div>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", borderLeft: "2px dotted #86efac", paddingLeft: 16 }}>
          {items.map((it, i) => (
            <li key={i} style={{ position: "relative", marginBottom: 10, fontSize: 13.5, color: "#1f2937", lineHeight: 1.5 }}>
              <span style={{ position: "absolute", left: -22, top: 6, width: 8, height: 8, borderRadius: "50%", background: "#16a34a" }} />
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ExclusionsSection({ exclusions }: { exclusions?: string }) {
  const items = bulletList(exclusions);
  if (!items.length) return null;
  return (
    <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 18, color: "#dc2626", marginBottom: 14 }}>
        <span style={{ width: 22, height: 22, background: "#dc2626", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✕</span>
        Exclusions
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", borderLeft: "2px dotted #fca5a5", paddingLeft: 16 }}>
        {items.map((it, i) => (
          <li key={i} style={{ position: "relative", marginBottom: 10, fontSize: 13.5, color: "#1f2937", lineHeight: 1.5 }}>
            <span style={{ position: "absolute", left: -22, top: 6, width: 8, height: 8, borderRadius: "50%", background: "#dc2626" }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentPolicySection({ terms }: { terms?: string }) {
  const items = bulletList(terms);
  if (!items.length) return null;
  return (
    <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginTop: 24 }}>
      <SectionCardHeader icon="📋" title="Payment Policy & Terms" />
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>Important Notes</div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 14, fontSize: 13.5, color: "#1f2937", lineHeight: 1.55 }}>
            <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
            <span style={{ paddingTop: 4 }}>{it}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function AboutUsSection({ highlights, advisor, agency }: { highlights: any[]; advisor: { name?: string; phone?: string; email?: string }; agency: { name?: string; office_address?: string } }) {
  const hasAnything = highlights.length || advisor.name || advisor.phone || advisor.email || agency.name || agency.office_address;
  if (!hasAnything) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ fontWeight: 800, fontSize: 26, color: "#1e293b", marginBottom: 6 }}>About us</div>
      {highlights.length > 0 && (
        <>
          <div style={{ fontWeight: 800, fontSize: 22, color: "#1e293b", marginBottom: 14 }}>Why should you choose us</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 18px", display: "flex", alignItems: "center", gap: 8, background: "white", fontSize: 13.5, color: "#1e293b", fontWeight: 600 }}>
                <span style={{ color: "#16a34a" }}>{h.icon || "✓"}</span> {h.label}
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", marginBottom: 24 }} />
        </>
      )}
      {(advisor.name || advisor.phone || advisor.email || agency.name) && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: 0, overflow: "hidden" }}>
          <div style={{ background: "#6366f1", color: "white", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "white", color: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👤</div>
            <div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Your Holiday Advisor</div>
              <div style={{ fontWeight: 800, fontSize: 22 }}>{advisor.name || "—"}</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", padding: "20px 24px" }}>
            {advisor.phone && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>📞 Contact Number</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{advisor.phone}</div>
              </div>
            )}
            {advisor.email && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>✉️ Email Address</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{advisor.email}</div>
              </div>
            )}
            {agency.name && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>🏢 Company</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{agency.name}</div>
              </div>
            )}
            {agency.office_address && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>📍 Office Address</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", lineHeight: 1.4 }}>{agency.office_address}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", borderBottom: "2px solid #2D9B7A", paddingBottom: 6, marginBottom: 14 }}>{children}</div>;
}

const tag: React.CSSProperties = { background: "rgba(255,255,255,.15)", borderRadius: 20, padding: "4px 14px", fontSize: 12, backdropFilter: "blur(4px)" };
const addBtn: React.CSSProperties = { background: "none", border: "1.5px dashed #d1d5db", borderRadius: 10, padding: "8px 12px", fontSize: 13, color: "#6b7280", cursor: "pointer", width: "100%", transition: "all .15s" };
