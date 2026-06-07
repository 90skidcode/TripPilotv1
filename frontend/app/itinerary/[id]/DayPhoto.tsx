// Destination → Unsplash photo ID map
const PHOTO_MAP: Record<string, string> = {
  bali:         "1537996194471-e657df975ab4",
  ubud:         "1537996194471-e657df975ab4",
  seminyak:     "1537996194471-e657df975ab4",
  singapore:    "1525625293386-3f8f99389edd",
  "kuala lumpur":"1596422846543-b5e81e9e0c21",
  malaysia:     "1596422846543-b5e81e9e0c21",
  maldives:     "1507525428034-b723cf961d3e",
  paris:        "1502602898657-3e91760cbb34",
  dubai:        "1512453979798-5ea266f8880c",
  thailand:     "1508009603885-50cf7c579365",
  bangkok:      "1508009603885-50cf7c579365",
  phuket:       "1519451241324-20b4ea2c4220",
  tokyo:        "1540959733332-eab4deabeeaf",
  london:       "1513635269975-59663e0ac1ad",
  rome:         "1552832230-c0197dd311b5",
  switzerland:  "1506905925346-21bda4d32df4",
  manali:       "1626621341517-bbf3d9b1c6e0",
  goa:          "1507003211169-0a1dd7228f2d",
  kerala:       "1602216056096-3b40cc0c9944",
  jaipur:       "1599661046827-dacff0c0f09a",
  rajasthan:    "1599661046827-dacff0c0f09a",
  "new york":   "1496442226666-8d4d0e62e6e9",
  amsterdam:    "1512470810-b7b2b49b9e9b",
  barcelona:    "1583422409516-2895a9e4ab48",
  santorini:    "1613395877344-13d4a8e0d49e",
  istanbul:     "1524231757912-21f4fe3a7200",
};

export function getDayPhoto(city: string): string {
  if (!city) return "";
  const key = city.toLowerCase().replace(/,.*/, "").trim();
  const match = Object.keys(PHOTO_MAP).find((k) => key.includes(k) || k.includes(key));
  if (match) return `https://images.unsplash.com/photo-${PHOTO_MAP[match]}?w=900&q=80&auto=format&fit=crop`;
  return `https://picsum.photos/seed/${encodeURIComponent(key)}/900/300`;
}

export function DayPhoto({ city, height = 180 }: { city: string; height?: number }) {
  const url = getDayPhoto(city);

  if (!city) return (
    <div style={{ height, background: "linear-gradient(135deg,#2D9B7A30,#1a3a4a50)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 52 }}>🌴</div>
  );

  return (
    <div style={{ height, overflow: "hidden", position: "relative", flexShrink: 0 }}>
      <img
        src={url}
        alt={city}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
      />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 55%)" }} />
      <div style={{ position: "absolute", bottom: 12, left: 14, color: "white", fontWeight: 700, fontSize: 17, textShadow: "0 1px 4px rgba(0,0,0,.6)" }}>
        📍 {city}
      </div>
    </div>
  );
}
