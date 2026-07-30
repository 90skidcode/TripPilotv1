"use client";
import { useState, useEffect, Suspense } from "react";
import AppShell from "@/components/AppShell";
import { itineraryApi } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const LAYOUTS = [
  {
    id: "visual_experience",
    icon: "🖼️",
    name: "Visual Experience",
    desc: "Rich imagery, story-style narration. Best for leisure & honeymoon trips.",
    preview: "linear-gradient(135deg, #2D9B7A 0%, #1a3a4a 100%)",
  },
  {
    id: "daily_snapshot",
    icon: "📋",
    name: "Daily Snapshot",
    desc: "Clean day-by-day table with icons. Best for corporate & group tours.",
    preview: "linear-gradient(135deg, #6366f1 0%, #1e1b4b 100%)",
  },
  {
    id: "magazine_pro",
    icon: "✨",
    name: "Magazine Pro",
    desc: "Bold typography, full-bleed layout. Best for premium & luxury clients.",
    preview: "linear-gradient(135deg, #f59e0b 0%, #7c2d12 100%)",
  },
  {
    id: "dark_template",
    icon: "🌙",
    name: "Dark Template",
    desc: "Sleek dark mode layout with cyan accents, glowing timeline & glassmorphic cards.",
    preview: "linear-gradient(135deg, #0a0e14 0%, #1a222c 50%, #00b4d8 100%)",
  },
];

function ItineraryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadIdParam = searchParams.get("lead_id");
  const leadId = leadIdParam ? Number(leadIdParam) : null;
  const { hasPermission } = useAuth();
  const canWrite = hasPermission("itinerary", "write");

  useEffect(() => {
    if (!canWrite) {
      router.push("/itinerary");
    }
  }, [canWrite, router]);

  const [step, setStep] = useState<1 | 2>(1);
  const [layout, setLayout] = useState("dark_template");
  const [rawText, setRawText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!canWrite) {
    return (
      <AppShell title="New Itinerary">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          ⏳ Redirecting to itineraries...
        </div>
      </AppShell>
    );
  }


  async function handleGenerate() {
    if (!rawText.trim()) { setError("Please describe the trip first."); return; }
    setLoading(true);
    setError("");
    try {
      const itin = await itineraryApi.generate({ raw_text: rawText, layout, lead_id: leadId });
      router.push(`/itinerary/${itin.id}`);
    } catch (e: any) {
      setError(e.message || "Generation failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AppShell title="New Itinerary">
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        {/* Progress Steps */}
        <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 36 }}>
          {["Choose Layout", "Describe Trip"].map((label, i) => {
            const num = i + 1;
            const active = step === num;
            const done = step > num;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  opacity: active || done ? 1 : 0.4,
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: done ? "var(--brand)" : active ? "var(--brand)" : "var(--border)",
                    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>{done ? "✓" : num}</div>
                  <span style={{ fontWeight: active ? 700 : 500, fontSize: 14, whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < 1 && <div style={{ flex: 1, height: 2, background: step > 1 ? "var(--brand)" : "var(--border)", margin: "0 12px" }} />}
              </div>
            );
          })}
        </div>

        {/* Step 1: Layout Picker */}
        {step === 1 && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Choose a Layout</h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 14 }}>
              Select how your itinerary will look when sent to clients.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {LAYOUTS.map((l) => (
                <div
                  key={l.id}
                  id={`layout-${l.id}`}
                  onClick={() => setLayout(l.id)}
                  style={{
                    borderRadius: "var(--radius-xl)",
                    border: `2px solid ${layout === l.id ? "var(--brand)" : "var(--border)"}`,
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all .2s",
                    boxShadow: layout === l.id ? "0 0 0 4px var(--brand)20" : "none",
                  }}
                >
                  {/* Mock preview */}
                  <div style={{ height: 120, background: l.preview, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <div style={{ fontSize: 36 }}>{l.icon}</div>
                    {layout === l.id && (
                      <div style={{ background: "white", color: "var(--brand)", borderRadius: 20, padding: "2px 12px", fontSize: 11, fontWeight: 700 }}>
                        SELECTED
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{l.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5 }}>{l.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, display: "flex", justifyContent: "flex-end" }}>
              <button id="next-step-btn" className="btn btn-primary" onClick={() => setStep(2)}>
                Next → Describe Trip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Describe + Generate */}
        {step === 2 && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Describe the Trip</h2>
                <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                  Layout: <strong>{LAYOUTS.find((l) => l.id === layout)?.name}</strong>
                </p>
              </div>
            </div>

            {/* Prompt examples */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
              {[
                "5D4N Bali honeymoon for 2, budget ₹80,000",
                "7D Singapore + Malaysia family trip for 4",
                "3D2N Manali adventure for 6 friends",
                "10D Europe tour from Delhi",
              ].map((ex) => (
                <button
                  key={ex}
                  className="btn btn-outline btn-sm"
                  onClick={() => setRawText(ex)}
                  style={{ fontSize: 12 }}
                >{ex}</button>
              ))}
            </div>

            <div className="input-group">
              <label className="input-label">Trip Description</label>
              <textarea
                id="trip-description"
                className="input"
                rows={8}
                placeholder={`Describe the trip in any format. The more details, the better the itinerary!\n\nExample:\n"5 days 4 nights Bali honeymoon for 2 pax. Include Ubud rice terraces, Tanah Lot sunset, Seminyak beach, spa day, and romantic dinner. Budget ₹80,000. Arrive Denpasar, depart same. Include inter-hotel transfers."`}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                style={{ minHeight: 200, fontSize: 14 }}
              />
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "12px 16px", borderRadius: "var(--radius)", marginTop: 12, fontSize: 13 }}>
                ⚠️ {error}
              </div>
            )}

            {/* AI Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--brand-light)", borderRadius: "var(--radius)", margin: "16px 0" }}>
              <span style={{ fontSize: 22 }}>🤖</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Powered by Gemini AI</div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  Generates day-by-day itinerary, flights, hotel stays, meals, and activities automatically
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>← Change Layout</button>
              <button
                id="generate-btn"
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading || !rawText.trim()}
                style={{ minWidth: 180 }}
              >
                {loading ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                    Generating with AI…
                  </span>
                ) : "✨ Generate Itinerary"}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function NewItineraryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ItineraryForm />
    </Suspense>
  );
}
