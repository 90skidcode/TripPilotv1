"use client";

interface StayOption {
  option?: string;
  hotel_name?: string;
  city?: string;
  nights?: number;
  room_category?: string;
  meal_plan?: string;
  check_in?: string;
  check_out?: string;
}

interface Props {
  options: StayOption[];
  onChange: (updated: StayOption[]) => void;
}

export default function StayOptions({ options, onChange }: Props) {
  function update(i: number, key: keyof StayOption, val: any) {
    const updated = [...options];
    updated[i] = { ...updated[i], [key]: val };
    onChange(updated);
  }

  function addOption() {
    onChange([...options, { option: `OPTION ${options.length + 1}`, hotel_name: "", city: "", nights: 1, room_category: "Deluxe" }]);
  }

  function removeOption(i: number) {
    onChange(options.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {options.map((opt, i) => (
        <div key={i} style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "var(--brand)", color: "white", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
              {opt.option || `OPTION ${i + 1}`}
            </div>
            <input
              id={`stay-option-label-${i}`}
              className="input"
              value={opt.option || ""}
              onChange={(e) => update(i, "option", e.target.value)}
              placeholder="Option label"
              style={{ flex: 1, fontSize: 13 }}
            />
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={() => removeOption(i)}
              style={{ color: "var(--danger)" }}
              id={`remove-stay-${i}`}
            >🗑️</button>
          </div>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Hotel Name</label>
              <input id={`stay-hotel-${i}`} className="input" value={opt.hotel_name || ""} onChange={(e) => update(i, "hotel_name", e.target.value)} placeholder="e.g. Alaya Ubud" />
            </div>
            <div className="input-group">
              <label className="input-label">City</label>
              <input id={`stay-city-${i}`} className="input" value={opt.city || ""} onChange={(e) => update(i, "city", e.target.value)} placeholder="e.g. Ubud" />
            </div>
            <div className="input-group">
              <label className="input-label">Room Category</label>
              <input id={`stay-room-${i}`} className="input" value={opt.room_category || ""} onChange={(e) => update(i, "room_category", e.target.value)} placeholder="e.g. Deluxe Pool View" />
            </div>
            <div className="input-group">
              <label className="input-label">No. of Nights</label>
              <input id={`stay-nights-${i}`} className="input" type="number" min={1} value={opt.nights || ""} onChange={(e) => update(i, "nights", Number(e.target.value))} />
            </div>
            <div className="input-group">
              <label className="input-label">Meal Plan</label>
              <select id={`stay-meal-${i}`} className="input" value={opt.meal_plan || ""} onChange={(e) => update(i, "meal_plan", e.target.value)}>
                <option value="">Select…</option>
                <option>Room Only</option>
                <option>Breakfast Included</option>
                <option>Half Board</option>
                <option>Full Board</option>
                <option>All Inclusive</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Check-in</label>
              <input id={`stay-checkin-${i}`} className="input" type="date" value={opt.check_in || ""} onChange={(e) => update(i, "check_in", e.target.value)} />
            </div>
            <div className="input-group">
              <label className="input-label">Check-out</label>
              <input id={`stay-checkout-${i}`} className="input" type="date" value={opt.check_out || ""} onChange={(e) => update(i, "check_out", e.target.value)} />
            </div>
          </div>
        </div>
      ))}
      <button id="add-stay-btn" className="btn btn-outline" style={{ width: "100%" }} onClick={addOption}>
        + Add Hotel Option
      </button>
    </div>
  );
}
