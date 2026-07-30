"use client";
import { useState, useEffect, useRef, use } from "react";
import { itineraryApi, authApi, resolveAssetUrl } from "@/lib/api";
import Link from "next/link";

const BRAND = "#0ea5e9";
const DARK = "#0f172a";

// ── Fallback image helper mapping loremflickr.com to gorgeous Unsplash ────────
function getFallbackImage(url: string, seed: string = ""): string {
  if (!url) return "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80";
  if (!url.includes("loremflickr.com")) return url;
  
  const lower = url.toLowerCase();
  
  // 1. Destination checks
  if (lower.includes("bali")) {
    if (lower.includes("beach") || lower.includes("sunset") || lower.includes("jimbaran") || lower.includes("seminyak")) {
      return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"; // Bali beach
    }
    if (lower.includes("rice") || lower.includes("tegalalang") || lower.includes("ubud") || lower.includes("forest") || lower.includes("swing")) {
      return "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&w=800&q=80"; // Ubud/Rice terraces
    }
    return "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80"; // Bali temple
  }
  
  if (lower.includes("singapore")) {
    return "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("malaysia") || lower.includes("kuala")) {
    return "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("manali") || lower.includes("mountain") || lower.includes("snow") || lower.includes("himalaya")) {
    return "https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("goa")) {
    return "https://images.unsplash.com/photo-1506477331477-33d5d8b3dc85?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("kashmir")) {
    return "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("maldives")) {
    return "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=1200&q=80";
  }
  if (lower.includes("paris") || lower.includes("europe") || lower.includes("london")) {
    return "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80";
  }
  
  // 2. Hotel / Stay checks
  if (lower.includes("hotel") || lower.includes("resort") || lower.includes("stay") || lower.includes("villa")) {
    const hotelImages = [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80"
    ];
    let hash = 0;
    const str = seed || url;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % hotelImages.length;
    return hotelImages[idx];
  }
  
  // 3. Sightseeing / Place checks (generic stunning photos)
  const placesImages = [
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?auto=format&fit=crop&w=800&q=80"
  ];
  let hash = 0;
  const str = seed || url;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % placesImages.length;
  return placesImages[idx];
}

function formatDate(d?: string) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
  catch { return d; }
}

// Mirrors isSectionVisible() in ../page.tsx — sections default to visible;
// a false entry in itin.section_visibility hides them from the PDF too.
function isSectionVisible(itin: any, key: string): boolean {
  return itin?.section_visibility?.[key] !== false;
}

function FlightRow({ leg, label }: { leg: any; label: string }) {
  if (!leg?.from && !leg?.airline) return null;
  return (
    <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
      <td style={{ padding: "10px 12px", fontWeight: 600, color: BRAND }}>{label}</td>
      <td style={{ padding: "10px 12px" }}>{leg.airline || "—"} {leg.flight_number && `(${leg.flight_number})`}</td>
      <td style={{ padding: "10px 12px" }}>{leg.from || "—"} → {leg.to || "—"}</td>
      <td style={{ padding: "10px 12px" }}>{formatDate(leg.date)}</td>
      <td style={{ padding: "10px 12px" }}>{leg.departure_time || "—"} – {leg.arrival_time || "—"}</td>
      <td style={{ padding: "10px 12px" }}>{leg.baggage || "—"}</td>
    </tr>
  );
}

export default function ItineraryPDFPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);   // Next.js 15: params is a Promise
  const [itin, setItin] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    itineraryApi.get(Number(id)).then(setItin).catch(console.error).finally(() => setLoading(false));
    // Best-effort — agency branding falls back when unavailable
    authApi.me().then(setMe).catch(() => {});
  }, [id]);

  function handlePrint() {
    window.print();
  }

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#888" }}>⏳ Loading…</div>;
  if (!itin) return <div style={{ padding: 60, textAlign: "center", color: "#888" }}>Itinerary not found.</div>;

  const days: any[] = itin.days || [];
  const stays: any[] = itin.stay_options || [];
  const flights = itin.flights || {};
  const meals = itin.meals_summary || {};

  // Agency branding shown at the top (cover) and bottom (footer) of the
  // exported/shared document — text "TripPilot" is hidden per configuration.
  const rawAgencyName = itin.agency_name || me?.agency_name;
  const agencyName = (rawAgencyName && rawAgencyName.trim().toLowerCase() !== "trippilot") ? rawAgencyName.trim() : "";
  const agencyLogoSrc = resolveAssetUrl(itin.logo_url || me?.logo_url);
  const agencyAddress = itin.agency_office_address || me?.agency_office_address;
  const agencyInitial = agencyName ? agencyName.charAt(0).toUpperCase() : "";
  const hasAgencyBranding = Boolean((agencyName && agencyName.toLowerCase() !== "trippilot") || agencyLogoSrc);

  if (itin.layout === "dark_template") {
    return <DarkTemplateView itin={itin} me={me} printRef={printRef} handlePrint={handlePrint} id={id} />;
  }

  return (
    <>
      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "white", borderBottom: "1px solid #e5e7eb",
        padding: "12px 24px", display: "flex", gap: 12, alignItems: "center",
      }}>
        <Link href={`/itinerary/${id}`} style={{ textDecoration: "none" }}>
          <button className="btn btn-ghost">← Edit Itinerary</button>
        </Link>
        <div style={{ flex: 1 }} />
        <button id="download-pdf-btn" className="btn btn-primary" onClick={handlePrint}>
          🖨️ Print / Download PDF
        </button>
      </div>

      {/* PDF Document */}
      <div ref={printRef} style={{ maxWidth: 860, margin: "0 auto", fontFamily: "'Inter', sans-serif", color: "#1a1a1a", padding: "0 20px 60px" }}>

        {/* ══════ COVER PAGE ══════ */}
        <div style={{
          minHeight: "55vh", 
          background: itin.cover_image_url ? `url(${getFallbackImage(itin.cover_image_url, itin.title)}) center/cover no-repeat` : "#f8fafc",
          borderRadius: 24, marginBottom: 36, marginTop: 24,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          padding: "48px 48px 52px",
          position: "relative", overflow: "hidden",
          border: itin.cover_image_url ? "none" : "1px solid #e2e8f0"
        }}>
          {itin.cover_image_url && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0) 100%)" }} />}
          
          {!itin.cover_image_url && (
            <>
              {/* Decorative shapes */}
              <div style={{ position: "absolute", top: -60, right: -60, width: 300, height: 300, borderRadius: "50%", background: BRAND + "10" }} />
              <div style={{ position: "absolute", top: 60, right: 60, width: 150, height: 150, borderRadius: "50%", background: BRAND + "15" }} />
            </>
          )}
          
          {/* Agency branding — only shown when valid agency name or logo is present */}
          {hasAgencyBranding && (
            <div style={{ position: "absolute", top: 36, left: 48, display: "flex", alignItems: "center", gap: 10, zIndex: 10 }}>
              {agencyLogoSrc && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agencyLogoSrc}
                  alt={agencyName || "Agency logo"}
                  style={{ height: 36, maxWidth: 150, objectFit: "contain", background: "white", borderRadius: 6, padding: 3 }}
                  onError={() => setImgError(true)}
                />
              ) : agencyInitial ? (
                <div style={{ width: 36, height: 36, borderRadius: 8, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, color: "white", fontSize: 16 }}>{agencyInitial}</div>
              ) : null}
              {agencyName && agencyName.toLowerCase() !== "trippilot" && (
                <span style={{ color: itin.cover_image_url ? "white" : DARK, fontWeight: 800, fontSize: 16, letterSpacing: "-0.5px" }}>{agencyName}</span>
              )}
            </div>
          )}

          {/* Content */}
          <div style={{ color: itin.cover_image_url ? "white" : DARK, zIndex: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: itin.cover_image_url ? "white" : BRAND, marginBottom: 12, opacity: 0.9 }}>
              {itin.destination || "Your Destination"} · {itin.total_days || "—"}D{itin.total_nights || ""}N
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 900, lineHeight: 1.05, margin: "0 0 14px", letterSpacing: "-1px", textShadow: itin.cover_image_url ? "0 2px 10px rgba(0,0,0,0.5)" : "none" }}>
              {itin.cover_title || itin.title || "Travel Itinerary"}
            </h1>
            <p style={{ fontSize: 18, color: itin.cover_image_url ? "rgba(255,255,255,0.9)" : "#64748b", margin: "0 0 24px", fontWeight: 500, textShadow: itin.cover_image_url ? "0 1px 4px rgba(0,0,0,0.5)" : "none" }}>
              {itin.cover_subheading || "Your personalized travel experience"}
            </p>
            {/* Tags */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {itin.num_travellers && (
                <div style={{ background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "white", color: itin.cover_image_url ? "white" : DARK, border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #e2e8f0", borderRadius: 30, padding: "6px 16px", fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                  👥 {itin.num_travellers} Travellers
                </div>
              )}
              {(itin.total_days || itin.total_nights) && (
                <div style={{ background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "white", color: itin.cover_image_url ? "white" : DARK, border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #e2e8f0", borderRadius: 30, padding: "6px 16px", fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                  📅 {itin.total_days}D / {itin.total_nights}N
                </div>
              )}
              {(meals.breakfast || meals.lunch || meals.dinner) && (
                <div style={{ background: itin.cover_image_url ? "rgba(255,255,255,0.2)" : "white", color: itin.cover_image_url ? "white" : DARK, border: itin.cover_image_url ? "1px solid rgba(255,255,255,0.3)" : "1px solid #e2e8f0", borderRadius: 30, padding: "6px 16px", fontSize: 13, fontWeight: 600, backdropFilter: "blur(4px)" }}>
                  🍽️ {[meals.breakfast && "B", meals.lunch && "L", meals.dinner && "D"].filter(Boolean).join(" · ")} included
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ══════ FLIGHTS ══════ */}
        {isSectionVisible(itin, "flights") && (flights.onward?.from || flights.return?.from) && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, borderBottom: `3px solid ${BRAND}`, paddingBottom: 8, marginBottom: 16 }}>
              ✈️ Flight Details
            </h2>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: BRAND + "15" }}>
                    {["Sector", "Airline", "Route", "Date", "Timing", "Baggage"].map((h) => (
                      <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 700, color: BRAND, fontSize: 12, textTransform: "uppercase", letterSpacing: 1 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <FlightRow leg={flights.onward} label="Onward" />
                  <FlightRow leg={flights.return} label="Return" />
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ══════ SUMMARY (top placement) ══════ */}
        <PdfSummarySection itin={itin} />

        {/* ══════ PACKAGE PRICING TABLE ══════ */}
        {isSectionVisible(itin, "pricing") && <PdfPackagePricing stayOptions={itin.stay_options || []} />}

        {/* ══════ MEAL ══════ */}
        {isSectionVisible(itin, "meals") && <PdfMeal meals={meals} />}

        {/* ══════ HOTEL STAY ══════ */}
        {isSectionVisible(itin, "stay") && stays.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, borderBottom: `3px solid ${BRAND}`, paddingBottom: 8, marginBottom: 16 }}>
              🏨 Premium Stay
            </h2>
            <div style={{ display: "grid", gap: 16 }}>
              {stays.map((s: any, i: number) => (
                <div key={i} style={{ border: `1px solid #e2e8f0`, borderRadius: 16, padding: "16px", display: "flex", gap: 16, alignItems: "stretch", background: "white" }}>
                  <div style={{ width: 140, borderRadius: 12, overflow: "hidden", background: "#f1f5f9", position: "relative", flexShrink: 0 }}>
                    {s.image_url ? (
                      <img src={getFallbackImage(s.image_url, s.hotel_name)} alt="Hotel" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} onError={(e) => { const t = e.currentTarget; const fb = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"; if (t.src !== fb) t.src = fb; }} />
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#94a3b8", fontSize: 28 }}>🏨</div>
                    )}
                  </div>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 4 }}>{s.option || `Option ${i + 1}`}</div>
                        <div style={{ fontWeight: 800, fontSize: 18, color: DARK, marginBottom: 6 }}>{s.hotel_name || "Hotel"}</div>
                      </div>
                      {s.google_rating && (
                        <div style={{ background: "#fef3c7", color: "#b45309", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                          ⭐ {s.google_rating}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
                      📍 {s.city || "—"} · 🛏️ {s.room_category || "Standard"} · 🌙 {s.nights || 0} Nights
                      {s.meal_plan && <span> · 🍽️ {s.meal_plan}</span>}
                    </div>
                    {s.directions_url && (
                      <div>
                        <a href={s.directions_url} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 600, color: BRAND, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          🗺️ View on Map
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══════ DAY-BY-DAY ══════ */}
        {days.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: DARK, borderBottom: `3px solid ${BRAND}`, paddingBottom: 8, marginBottom: 20 }}>
              📅 Day-by-Day Itinerary
            </h2>
            {days.map((day: any, i: number) => (
              <div key={i} style={{ display: "flex", gap: 20, marginBottom: 24, pageBreakInside: "avoid" }}>
                {/* Day number */}
                <div style={{ flexShrink: 0, textAlign: "center" }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: BRAND, color: "white",
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    fontWeight: 900, lineHeight: 1,
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 600, opacity: .8 }}>DAY</span>
                    <span style={{ fontSize: 18 }}>{day.day || i + 1}</span>
                  </div>
                  {i < days.length - 1 && (
                    <div style={{ width: 2, height: 30, background: BRAND + "30", margin: "6px auto" }} />
                  )}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 17, color: DARK }}>{day.city || `Day ${i + 1}`}</div>
                      {day.summary && <div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>{day.summary}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      {day.date && <span style={{ fontSize: 11, color: "#888", border: "1px solid #ddd", borderRadius: 20, padding: "2px 10px" }}>{formatDate(day.date)}</span>}
                      {day.tour_type && <span style={{ fontSize: 11, background: BRAND + "15", color: BRAND, borderRadius: 20, padding: "2px 10px", fontWeight: 600 }}>{day.tour_type}</span>}
                    </div>
                  </div>
                  {/* Places */}
                  {(day.places || []).length > 0 && (
                    <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
                      {(day.places || []).map((p: any, pi: number) => (
                        <div key={pi} style={{ border: "1px solid #e2e8f0", borderRadius: 12, overflow: "hidden", pageBreakInside: "avoid", background: "white" }}>
                          {p.image_url && (
                            <div style={{ height: 180, background: "#f8fafc", position: "relative" }}>
                              <img src={getFallbackImage(p.image_url, p.name)} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { const t = e.currentTarget; const fb = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"; if (t.src !== fb) t.src = fb; }} />
                              <div style={{ position: "absolute", top: 12, left: 12, background: "white", padding: "3px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700, color: "#334155", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
                                📍 Sightseeing
                              </div>
                            </div>
                          )}
                          <div style={{ padding: "14px", background: "white" }}>
                            <div style={{ fontWeight: 800, fontSize: 15, color: DARK, marginBottom: 6 }}>{p.name}</div>
                            {p.description && <div style={{ fontSize: 12.5, color: "#475569", lineHeight: 1.5 }}>{p.description}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Minor Activities */}
                  {(day.activities || []).filter(Boolean).length > 0 && (
                    <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                      {(day.activities || []).filter(Boolean).map((act: string, ai: number) => (
                        <li key={ai} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13, marginBottom: 5, color: "#333" }}>
                          <span style={{ color: BRAND, fontWeight: 700, flexShrink: 0 }}>›</span>
                          {act}
                        </li>
                      ))}
                    </ul>
                  )}
                  {/* Meals */}
                  {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
                    <div style={{ marginTop: 10, fontSize: 12, color: "#666", display: "flex", gap: 8 }}>
                      <span>Meals:</span>
                      {day.meals.breakfast && <span>🍳 Breakfast</span>}
                      {day.meals.lunch && <span>🍽️ Lunch</span>}
                      {day.meals.dinner && <span>🌙 Dinner</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ══════ INCLUSIONS ══════ */}
        {isSectionVisible(itin, "inclusions") && <PdfInclusions inclusions={itin.inclusions} />}

        {/* ══════ EXCLUSIONS ══════ */}
        {isSectionVisible(itin, "exclusions") && <PdfExclusions exclusions={itin.exclusions} />}

        {/* ══════ PAYMENT POLICY & TERMS ══════ */}
        {isSectionVisible(itin, "payment_terms") && <PdfPaymentPolicy terms={itin.payment_terms} />}

        {/* ══════ ABOUT US / WHY CHOOSE US / ADVISOR ══════ */}
        {isSectionVisible(itin, "about_us") && (
          <PdfAboutUs
            highlights={Array.isArray(itin.agency_highlights) ? itin.agency_highlights : []}
            advisor={{ name: itin.advisor_name, phone: itin.advisor_phone, email: itin.advisor_email }}
            agency={{ name: itin.agency_name, office_address: itin.agency_office_address }}
          />
        )}

        {/* ══════ FOOTER ══════ */}
        <div style={{ borderTop: `2px solid ${BRAND}20`, paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          {hasAgencyBranding && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {agencyLogoSrc && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={agencyLogoSrc}
                  alt={agencyName || "Agency logo"}
                  style={{ width: 28, height: 28, objectFit: "contain", borderRadius: 6 }}
                  onError={() => setImgError(true)}
                />
              ) : agencyInitial ? (
                <div style={{ width: 28, height: 28, borderRadius: 6, background: BRAND, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 13 }}>{agencyInitial}</div>
              ) : null}
              <div>
                {agencyName && agencyName.toLowerCase() !== "trippilot" && <div style={{ fontWeight: 700, fontSize: 13 }}>{agencyName}</div>}
                {agencyAddress && <div style={{ fontSize: 11, color: "#888" }}>{agencyAddress}</div>}
              </div>
            </div>
          )}
          <div style={{ fontSize: 11, color: "#bbb", marginLeft: "auto" }}>
            Generated by TripPilot · {new Date().toLocaleDateString("en-IN")}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 15mm; size: A4; }
          /* Browsers drop background-image/background-color from printed
             output by default, which strips the cover photo and its dark
             overlay — leaving the white cover title/subtitle invisible
             against blank paper. Force backgrounds to print as shown. */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  );
}

// ── PDF section components ─────────────────────────────────────────────────
function fmtINR(n: any): string {
  const num = Number(String(n || "").replace(/[^\d.]/g, ""));
  if (!num || Number.isNaN(num)) return "—";
  return "Rs." + num.toLocaleString("en-IN");
}
function fmtDateLong(d: any): string {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return String(d); }
}
function bulletList(text: string | null | undefined): string[] {
  if (!text) return [];
  return text.split(/\r?\n/).map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim()).filter(Boolean);
}

function PdfSectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
      <div style={{ width: 40, height: 40, background: "#6366f1", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 18 }}>{icon}</div>
      <div style={{ fontWeight: 800, fontSize: 22, color: "#1e293b" }}>{title}</div>
    </div>
  );
}

function PdfSummarySection({ itin }: { itin: any }) {
  const rows: [string, string, string][] = [
    ["📅", "Date", `${fmtDateLong(itin.start_date)} - ${fmtDateLong(itin.end_date)}`],
    ["⏱️", "Duration", `${itin.total_nights || 0} Nights, ${itin.total_days || 0} Days`],
    ["💵", "Per Person Cost", itin.per_person_cost ? fmtINR(itin.per_person_cost) : "—"],
    ["💰", "Total Cost", itin.package_cost ? fmtINR(itin.package_cost) : "Refer to costing below"],
    ["👥", "Travelers", `${itin.num_adults ?? 0} Adults${itin.num_children ? ` | ${itin.num_children} Children` : ""}`],
    ["🚙", "Cab Details", itin.cab_type || "—"],
    ["📍", "Destinations", itin.destination || "—"],
  ];
  return (
    <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <PdfSectionHeader icon="👆" title="Summary" />
        <div className="no-print" style={{ background: "#ef4444", color: "white", padding: "8px 18px", borderRadius: 20, fontWeight: 700, fontSize: 13 }}>Book Now</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 32px", paddingTop: 8, borderTop: "1px solid #f1f5f9" }}>
        {rows.map(([icon, label, val], i) => (
          <div key={i}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b", marginBottom: 2 }}><span>{icon}</span>{label}</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: label === "Total Cost" ? "#16a34a" : "#0f172a" }}>{val}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PdfPackagePricing({ stayOptions }: { stayOptions: any[] }) {
  if (!stayOptions.length) return null;
  const groups: Record<string, any[]> = {};
  for (const s of stayOptions) {
    const key = s.option || "Option";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }
  const cities = Array.from(new Set(stayOptions.map((s) => s.city).filter(Boolean)));
  if (!cities.length) return null;
  const groupKeys = Object.keys(groups);
  return (
    <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
      <PdfSectionHeader icon="📦" title="Package Pricing & Details" />
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#fef3c7" }}>
            <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#78350f", fontSize: 12 }}>Option</th>
            {cities.map((c) => <th key={c} style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#78350f", fontSize: 12 }}>Hotel Details {c}</th>)}
            <th style={{ padding: "12px 14px", textAlign: "left", fontWeight: 700, color: "#78350f", fontSize: 12 }}>Total Cost</th>
          </tr>
        </thead>
        <tbody>
          {groupKeys.map((opt, i) => {
            const rowBg = i % 2 === 0 ? "#fff7ed" : "#f0fdf4";
            const rows = groups[opt];
            const totalCost = rows.find((r) => r.total_cost)?.total_cost;
            return (
              <tr key={opt} style={{ background: rowBg }}>
                <td style={{ padding: 14, color: "#1f2937", verticalAlign: "top" }}>{opt}</td>
                {cities.map((c) => {
                  const row = rows.find((r) => r.city === c);
                  return (
                    <td key={c} style={{ padding: 14, color: "#1f2937", verticalAlign: "top" }}>
                      {row ? `${row.nights || 0} N ${c} - ${row.hotel_name || ""}${row.hotel_name ? " /Similar" : ""}` : "—"}
                    </td>
                  );
                })}
                <td style={{ padding: 14, color: "#1f2937", verticalAlign: "top", fontWeight: 700 }}>{totalCost ? fmtINR(totalCost) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function PdfMeal({ meals }: { meals: any }) {
  const items = [
    meals?.breakfast ? `${meals.breakfast} Breakfast` : null,
    meals?.lunch ? `${meals.lunch} Lunch` : null,
    meals?.dinner ? `${meals.dinner} Dinner` : null,
  ].filter(Boolean) as string[];
  if (!items.length) return null;
  return (
    <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
      <PdfSectionHeader icon="🍽️" title="Meal" />
      <div style={{ background: "#fff7ed", borderRadius: 12, padding: 20, textAlign: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#1e293b", marginBottom: 14 }}>Meals Included Throughout Your Journey</div>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          {items.map((it) => (
            <div key={it} style={{ background: "white", border: "1px solid #fed7aa", borderRadius: 10, padding: "16px 32px", fontWeight: 700, fontSize: 16, color: "#c2410c" }}>{it}</div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 12 }}><strong>Note:</strong> Specific meal details are mentioned in each day's itinerary below</div>
      </div>
    </section>
  );
}

function PdfInclusions({ inclusions }: { inclusions?: string }) {
  const items = bulletList(inclusions);
  if (!items.length) return null;
  return (
    <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
      <PdfSectionHeader icon="✅" title="What's Included & Excluded" />
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
    </section>
  );
}

function PdfExclusions({ exclusions }: { exclusions?: string }) {
  const items = bulletList(exclusions);
  if (!items.length) return null;
  return (
    <section style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
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
    </section>
  );
}

function PdfPaymentPolicy({ terms }: { terms?: string }) {
  const items = bulletList(terms);
  if (!items.length) return null;
  return (
    <section style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 24px", marginBottom: 28, pageBreakInside: "avoid" }}>
      <PdfSectionHeader icon="📋" title="Payment Policy & Terms" />
      <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b", marginBottom: 12 }}>Important Notes</div>
      <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <li key={i} style={{ display: "flex", gap: 14, fontSize: 13.5, color: "#1f2937", lineHeight: 1.55 }}>
            <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "#dbeafe", color: "#1d4ed8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13 }}>{i + 1}</span>
            <span style={{ paddingTop: 4 }}>{it}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PdfAboutUs({ highlights, advisor, agency }: { highlights: any[]; advisor: { name?: string; phone?: string; email?: string }; agency: { name?: string; office_address?: string } }) {
  const hasAnything = highlights.length || advisor.name || advisor.phone || advisor.email || agency.name || agency.office_address;
  if (!hasAnything) return null;
  return (
    <section style={{ marginBottom: 28, pageBreakInside: "avoid" }}>
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
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
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
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2 }}>📞 Contact Number</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{advisor.phone}</div>
              </div>
            )}
            {advisor.email && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2 }}>✉️ Email Address</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{advisor.email}</div>
              </div>
            )}
            {agency.name && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2 }}>🏢 Company</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>{agency.name}</div>
              </div>
            )}
            {agency.office_address && (
              <div>
                <div style={{ fontSize: 12, color: "#6366f1", marginBottom: 2 }}>📍 Office Address</div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a", lineHeight: 1.4 }}>{agency.office_address}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

// ── Dark Template Layout Component (Plannatrip Style) ──────────────────────
function DarkTemplateView({ itin, me, printRef, handlePrint, id }: { itin: any; me: any; printRef: any; handlePrint: () => void; id: string }) {
  const days: any[] = itin.days || [];
  const stays: any[] = itin.stay_options || [];
  const flights = itin.flights || {};

  const rawAgencyName = itin.agency_name || me?.agency_name;
  const agencyName = (rawAgencyName && rawAgencyName.trim().toLowerCase() !== "trippilot") ? rawAgencyName.trim() : "";
  const agencyLogoSrc = resolveAssetUrl(itin.logo_url || me?.logo_url);
  const agencyAddress = itin.agency_office_address || me?.agency_office_address;
  const hasAgencyBranding = Boolean((agencyName && agencyName.toLowerCase() !== "trippilot") || agencyLogoSrc);

  const inclusionsList = bulletList(itin.inclusions);
  const exclusionsList = bulletList(itin.exclusions);
  const paymentTermsList = bulletList(itin.payment_terms);

  return (
    <div style={{ background: "#0a0e14", color: "#f0f4f8", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* Toolbar — hidden on print */}
      <div className="no-print" style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(10, 14, 20, 0.9)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "12px 24px", display: "flex", gap: 12, alignItems: "center",
      }}>
        <Link href={`/itinerary/${id}`} style={{ textDecoration: "none" }}>
          <button className="btn btn-ghost" style={{ color: "#a0aec0", border: "1px solid rgba(255, 255, 255, 0.15)" }}>← Edit Itinerary</button>
        </Link>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "#d4af37", background: "rgba(212, 175, 55, 0.1)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(212, 175, 55, 0.3)" }}>
          🌙 Dark Template Active
        </span>
        <button id="download-pdf-btn" className="btn btn-primary" onClick={handlePrint} style={{ background: "linear-gradient(90deg, #00b4d8, #0077b6)", border: "none" }}>
          🖨️ Print / Download PDF
        </button>
      </div>

      <div ref={printRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 64px" }}>
        
        {/* ══════ HERO BANNER ══════ */}
        <div style={{
          minHeight: "75vh",
          background: itin.cover_image_url 
            ? `linear-gradient(rgba(10, 14, 20, 0.4) 0%, rgba(10, 14, 20, 0.95) 100%), url(${getFallbackImage(itin.cover_image_url, itin.title)}) center/cover no-repeat`
            : "linear-gradient(135deg, #0a0e14 0%, #1a222c 50%, #0a0e14 100%)",
          borderRadius: 24, marginBottom: 48, marginTop: 24,
          display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
          textAlign: "center", padding: "64px 32px",
          position: "relative", overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 10px 40px rgba(0,0,0,0.6)"
        }}>
          {/* Agency Logo Pill */}
          {hasAgencyBranding && (
            <div style={{
              background: "rgba(255, 255, 255, 0.92)", borderRadius: 16, padding: "10px 24px",
              marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", display: "flex", alignItems: "center", gap: 10
            }}>
              {agencyLogoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={agencyLogoSrc} alt={agencyName || "Agency Logo"} style={{ height: 40, maxWidth: 180, objectFit: "contain" }} />
              ) : (
                <span style={{ color: "#0a0e14", fontWeight: 800, fontSize: 18, fontFamily: "Outfit, sans-serif" }}>{agencyName}</span>
              )}
            </div>
          )}

          {/* Subtitle Badge */}
          <div style={{ color: "#d4af37", letterSpacing: "3px", textTransform: "uppercase", fontSize: "1.2rem", fontWeight: 600, marginBottom: 12, textShadow: "0 4px 10px rgba(0,0,0,0.5)" }}>
            {itin.destination ? `EXPLORE ${itin.destination.toUpperCase()}` : "CUSTOMER BROCHURE"}
          </div>

          {/* Main Title */}
          <h1 style={{
            fontFamily: "Outfit, sans-serif", fontSize: "3.5rem", fontWeight: 800,
            letterSpacing: "6px", textTransform: "uppercase", margin: "0 0 16px",
            background: "linear-gradient(180deg, #ffffff 0%, #d1d5db 100%)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            lineHeight: 1.15
          }}>
            {itin.cover_title || itin.title || "TRAVEL ITINERARY"}
          </h1>

          {/* Subheading */}
          <p style={{ color: "#a0aec0", fontSize: "1.25rem", maxWidth: 650, margin: "0 0 32px", lineHeight: 1.6 }}>
            {itin.cover_subheading || "An exclusive hand-crafted journey designed for an unforgettable travel experience."}
          </p>

          {/* Hero Meta Pill */}
          <div style={{
            background: "rgba(26, 34, 44, 0.75)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: 20,
            padding: "16px 32px", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
          }}>
            {itin.destination && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", color: "#f0f4f8", fontWeight: 500 }}>
                <span style={{ color: "#00b4d8" }}>📍</span> {itin.destination}
              </div>
            )}
            {(itin.total_days || itin.total_nights) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", color: "#f0f4f8", fontWeight: 500 }}>
                <span style={{ color: "#00b4d8" }}>📅</span> {itin.total_days || "—"} Days / {itin.total_nights || "—"} Nights
              </div>
            )}
            {itin.num_travellers && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", color: "#f0f4f8", fontWeight: 500 }}>
                <span style={{ color: "#00b4d8" }}>👥</span> {itin.num_travellers} Travelers
              </div>
            )}
            {itin.start_date && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", color: "#f0f4f8", fontWeight: 500 }}>
                <span style={{ color: "#00b4d8" }}>🗓️</span> {formatDate(itin.start_date)} {itin.end_date && `– ${formatDate(itin.end_date)}`}
              </div>
            )}
            {itin.cab_type && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "1rem", color: "#f0f4f8", fontWeight: 500 }}>
                <span style={{ color: "#00b4d8" }}>🚙</span> {itin.cab_type}
              </div>
            )}
          </div>
        </div>

        {/* ══════ MAIN LAYOUT GRID WITH SIDEBAR NAV ══════ */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 48, position: "relative" }} className="dark-layout-grid">
          
          {/* Sticky Sidebar Navigation (hidden on print) */}
          <div className="no-print" style={{ position: "sticky", top: "100px", height: "fit-content" }}>
            <div style={{ background: "#1a222c", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 20, padding: "24px 20px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, color: "#d4af37", marginBottom: 16 }}>
                NAVIGATE TRIP
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <a href="#section-summary" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Summary & Costing
                </a>
                {isSectionVisible(itin, "flights") && (flights.onward?.from || flights.return?.from) && (
                  <a href="#section-flights" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Flight Details
                  </a>
                )}
                {isSectionVisible(itin, "stay") && stays.length > 0 && (
                  <a href="#section-stays" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Accommodations
                  </a>
                )}
                {days.length > 0 && (
                  <a href="#section-itinerary" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Day-by-Day Plan
                  </a>
                )}
                {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
                  <a href="#section-inclusions" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Inclusions & Exclusions
                  </a>
                )}
                {paymentTermsList.length > 0 && (
                  <a href="#section-policies" style={{ textDecoration: "none", color: "#a0aec0", fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#00b4d8" }} /> Important Notes
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Column */}
          <div style={{ minWidth: 0 }}>

            {/* ══════ SUMMARY CARD ══════ */}
            <div id="section-summary" style={{
              background: "#1a222c", border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 20, padding: 32, marginBottom: 48, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
            }}>
              <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ color: "#00b4d8" }}>⚡</span> Trip Highlights & Overview
              </h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
                <div style={{ background: "rgba(10, 14, 20, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#a0aec0", marginBottom: 4 }}>Duration</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{itin.total_days || 0} Days / {itin.total_nights || 0} Nights</div>
                </div>
                <div style={{ background: "rgba(10, 14, 20, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#a0aec0", marginBottom: 4 }}>Destination</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{itin.destination || "—"}</div>
                </div>
                <div style={{ background: "rgba(10, 14, 20, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 14, padding: 16 }}>
                  <div style={{ fontSize: 12, color: "#a0aec0", marginBottom: 4 }}>Total Package Price</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#00b4d8" }}>{itin.package_cost ? fmtINR(itin.package_cost) : "On Request"}</div>
                </div>
                {itin.per_person_cost && (
                  <div style={{ background: "rgba(10, 14, 20, 0.5)", border: "1px solid rgba(255, 255, 255, 0.05)", borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 12, color: "#a0aec0", marginBottom: 4 }}>Per Person Rate</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#d4af37" }}>{fmtINR(itin.per_person_cost)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* ══════ FLIGHTS ══════ */}
            {isSectionVisible(itin, "flights") && (flights.onward?.from || flights.return?.from) && (
              <div id="section-flights" style={{
                background: "#1a222c", border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 20, padding: 32, marginBottom: 48, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
              }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#00b4d8" }}>✈️</span> Flight Details
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(0, 180, 216, 0.1)" }}>
                        {["Sector", "Airline", "Route", "Date", "Timing", "Baggage"].map((h) => (
                          <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#00b4d8", fontWeight: 600, fontSize: 12, textTransform: "uppercase" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {flights.onward?.from && (
                        <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: 14, color: "#d4af37", fontWeight: 700 }}>Onward</td>
                          <td style={{ padding: 14, color: "#fff" }}>{flights.onward.airline || "—"} {flights.onward.flight_number && `(${flights.onward.flight_number})`}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.onward.from} → {flights.onward.to}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{formatDate(flights.onward.date)}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.onward.departure_time || "—"} – {flights.onward.arrival_time || "—"}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.onward.baggage || "—"}</td>
                        </tr>
                      )}
                      {flights.return?.from && (
                        <tr style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)" }}>
                          <td style={{ padding: 14, color: "#d4af37", fontWeight: 700 }}>Return</td>
                          <td style={{ padding: 14, color: "#fff" }}>{flights.return.airline || "—"} {flights.return.flight_number && `(${flights.return.flight_number})`}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.return.from} → {flights.return.to}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{formatDate(flights.return.date)}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.return.departure_time || "—"} – {flights.return.arrival_time || "—"}</td>
                          <td style={{ padding: 14, color: "#a0aec0" }}>{flights.return.baggage || "—"}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ══════ PACKAGE PRICING CARDS ══════ */}
            {isSectionVisible(itin, "pricing") && stays.length > 0 && (
              <div id="section-stays" style={{ marginBottom: 48 }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#fff", textAlign: "center", marginBottom: 8 }}>
                  Package Pricing Options
                </h2>
                <p style={{ color: "#a0aec0", textAlign: "center", marginBottom: 32, fontSize: "1.05rem" }}>
                  Select from our curated accommodation packages
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>
                  {stays.map((s: any, i: number) => {
                    const isPremium = i === 0;
                    return (
                      <div key={i} style={{
                        background: isPremium ? "linear-gradient(145deg, #1a222c 0%, #0a0e14 100%)" : "rgba(10, 14, 20, 0.6)",
                        border: `1px solid ${isPremium ? "rgba(212, 175, 55, 0.4)" : "rgba(255, 255, 255, 0.08)"}`,
                        borderRadius: 20, padding: 32, position: "relative",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                      }}>
                        {isPremium && (
                          <div style={{
                            background: "#d4af37", color: "#0a0e14", borderRadius: 999,
                            padding: "4px 14px", fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                            letterSpacing: 1, position: "absolute", top: -12, right: 24
                          }}>
                            POPULAR
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: "#00b4d8", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                          {s.option || `OPTION ${i + 1}`}
                        </div>
                        <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.5rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>
                          {s.hotel_name || "Luxury Stay"}
                        </h3>
                        {s.google_rating && (
                          <div style={{ color: "#d4af37", fontSize: 13, marginBottom: 16 }}>
                            {"★".repeat(Math.round(Number(s.google_rating) || 5))} <span style={{ color: "#a0aec0" }}>({s.google_rating} Star)</span>
                          </div>
                        )}
                        <div style={{ fontFamily: "Outfit, sans-serif", fontSize: "2.4rem", fontWeight: 800, color: isPremium ? "#d4af37" : "#00b4d8", marginBottom: 16 }}>
                          {s.total_cost ? fmtINR(s.total_cost) : (itin.package_cost ? fmtINR(itin.package_cost) : "On Request")}
                          <span style={{ fontSize: 13, color: "#a0aec0", fontWeight: 400, marginLeft: 8 }}>/ total</span>
                        </div>
                        <div style={{ height: 1, background: "rgba(255, 255, 255, 0.08)", margin: "20px 0" }} />
                        <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", color: "#f0f4f8", fontSize: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                          <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#00b4d8" }}>🏨</span> {s.hotel_name || "Hotel Option"} ({s.city || "Destination"})
                          </li>
                          <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#00b4d8" }}>🛏️</span> Room: {s.room_category || "Deluxe / Standard"}
                          </li>
                          <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ color: "#00b4d8" }}>🌙</span> Duration: {s.nights || 1} Night(s)
                          </li>
                          {s.meal_plan && (
                            <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ color: "#00b4d8" }}>🍽️</span> Meal Plan: {s.meal_plan}
                            </li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══════ DAY BY DAY ITINERARY ══════ */}
            {days.length > 0 && (
              <div id="section-itinerary" style={{ marginBottom: 48 }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: 32, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#00b4d8" }}>🗓️</span> Detailed Itinerary
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: 36 }}>
                  {days.map((day: any, i: number) => (
                    <div key={i} style={{
                      background: "#1a222c", border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: 20, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
                    }}>
                      {/* Day Header */}
                      <div style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: 16, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <span style={{
                            background: "rgba(0, 180, 216, 0.12)", color: "#00b4d8",
                            border: "1px solid rgba(0, 180, 216, 0.3)", borderRadius: 12,
                            padding: "6px 14px", fontSize: 13, fontWeight: 700
                          }}>
                            DAY {day.day || i + 1}
                          </span>
                          <span style={{ fontSize: 14, color: "#a0aec0", display: "flex", alignItems: "center", gap: 4 }}>
                            📍 {day.city || `Day ${i + 1}`}
                          </span>
                        </div>
                        {(day.meals?.breakfast || day.meals?.lunch || day.meals?.dinner) && (
                          <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                            🍳 {[day.meals.breakfast && "Breakfast", day.meals.lunch && "Lunch", day.meals.dinner && "Dinner"].filter(Boolean).join(" · ")}
                          </div>
                        )}
                      </div>

                      {/* Day Summary */}
                      {day.summary && (
                        <p style={{ color: "#a0aec0", fontSize: "1.1rem", lineHeight: 1.7, marginBottom: 24 }}>
                          {day.summary}
                        </p>
                      )}

                      {/* Sightseeing Places */}
                      {(day.places || []).length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
                          {(day.places || []).map((p: any, pi: number) => (
                            <div key={pi} style={{
                              background: "rgba(10, 14, 20, 0.6)", border: "1px solid rgba(255, 255, 255, 0.06)",
                              borderRadius: 14, overflow: "hidden"
                            }}>
                              {p.image_url && (
                                <div style={{ height: 160, overflow: "hidden", position: "relative" }}>
                                  <img
                                    src={getFallbackImage(p.image_url, p.name)}
                                    alt={p.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    onError={(e) => { const t = e.currentTarget; const fb = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80"; if (t.src !== fb) t.src = fb; }}
                                  />
                                </div>
                              )}
                              <div style={{ padding: 16 }}>
                                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 6 }}>{p.name}</div>
                                {p.description && <div style={{ fontSize: 13, color: "#a0aec0", lineHeight: 1.5 }}>{p.description}</div>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Activities Timeline */}
                      {(day.activities || []).filter(Boolean).length > 0 && (
                        <div style={{ position: "relative", paddingLeft: 24, marginTop: 16 }}>
                          <div style={{ position: "absolute", top: 4, bottom: 4, left: 7, width: 2, background: "rgba(255, 255, 255, 0.1)" }} />
                          {(day.activities || []).filter(Boolean).map((act: string, ai: number) => (
                            <div key={ai} style={{ position: "relative", marginBottom: 14 }}>
                              <div style={{
                                position: "absolute", left: -24, top: 4, width: 12, height: 12,
                                borderRadius: "50%", background: "#1a222c", border: "2px solid #00b4d8"
                              }} />
                              <div style={{ color: "#f0f4f8", fontSize: 14, lineHeight: 1.6 }}>{act}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ══════ INCLUSIONS & EXCLUSIONS ══════ */}
            {(inclusionsList.length > 0 || exclusionsList.length > 0) && (
              <div id="section-inclusions" style={{
                background: "#1a222c", border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: 20, padding: 32, marginBottom: 48, boxShadow: "0 4px 20px rgba(0,0,0,0.4)"
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }} className="dark-inc-grid">
                  {/* Inclusions */}
                  {inclusionsList.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#00b4d8" }}>✓</span> What&apos;s Included
                      </h3>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                        {inclusionsList.map((item, idx) => (
                          <li key={idx} style={{
                            background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
                            fontSize: 14, color: "#a0aec0"
                          }}>
                            <span style={{ color: "#00b4d8", fontWeight: 700 }}>✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Exclusions */}
                  {exclusionsList.length > 0 && (
                    <div>
                      <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.4rem", fontWeight: 700, color: "#fff", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ color: "#f87171" }}>✕</span> What&apos;s Excluded
                      </h3>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                        {exclusionsList.map((item, idx) => (
                          <li key={idx} style={{
                            background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.05)",
                            borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12,
                            fontSize: 14, color: "#a0aec0", opacity: 0.85
                          }}>
                            <span style={{ color: "#f87171", fontWeight: 700 }}>✕</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════ PAYMENT TERMS & IMPORTANT NOTES ══════ */}
            {paymentTermsList.length > 0 && (
              <div id="section-policies" style={{
                background: "rgba(0, 180, 216, 0.05)", border: "1px solid rgba(0, 180, 216, 0.2)",
                borderRadius: 20, padding: 32, marginBottom: 48
              }}>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.6rem", fontWeight: 700, color: "#fff", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "#00b4d8" }}>📜</span> Payment Terms & Important Notes
                </h2>
                <ol style={{ paddingLeft: 20, margin: 0, color: "#a0aec0", fontSize: 14, lineHeight: 1.7, display: "flex", flexDirection: "column", gap: 8 }}>
                  {paymentTermsList.map((term, idx) => (
                    <li key={idx}>{term}</li>
                  ))}
                </ol>
              </div>
            )}

            {/* ══════ FOOTER SECTION ══════ */}
            <div style={{
              textAlign: "center", borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: 48, marginTop: 48
            }}>
              {hasAgencyBranding && (
                <div style={{ marginBottom: 16 }}>
                  {agencyName && <h3 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.8rem", fontWeight: 700, color: "#fff", marginBottom: 6 }}>{agencyName}</h3>}
                  {agencyAddress && <p style={{ color: "#a0aec0", fontSize: 14 }}>{agencyAddress}</p>}
                </div>
              )}
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Crafted with TripPilot Dark Template · All rights reserved.
              </div>
            </div>

          </div>
        </div>

      </div>

      <style>{`
        @media (max-width: 768px) {
          .dark-layout-grid { grid-template-columns: 1fr !important; }
          .dark-inc-grid { grid-template-columns: 1fr !important; }
        }
        @media print {
          .no-print { display: none !important; }
          body { background: #0a0e14 !important; color: #f0f4f8 !important; }
          @page { margin: 15mm; size: A4; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}

