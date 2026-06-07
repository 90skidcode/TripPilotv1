"use client";
import { useState } from "react";

interface Props {
  day: any;
  index: number;
  onChange: (updated: any) => void;
  onRemove: () => void;
}

export default function DayCard({ day, index, onChange, onRemove }: Props) {
  const [open, setOpen] = useState(index === 0);

  function update(key: string, val: any) {
    onChange({ ...day, [key]: val });
  }

  function updateMeal(meal: string, val: boolean) {
    onChange({ ...day, meals: { ...day.meals, [meal]: val } });
  }

  function updateActivity(i: number, val: string) {
    const acts = [...(day.activities || [])];
    acts[i] = val;
    onChange({ ...day, activities: acts });
  }

  function addActivity() {
    onChange({ ...day, activities: [...(day.activities || []), ""] });
  }

  function removeActivity(i: number) {
    const acts = [...(day.activities || [])].filter((_, idx) => idx !== i);
    onChange({ ...day, activities: acts });
  }

  return (
    <div style={{
      border: "1.5px solid var(--border)",
      borderRadius: "var(--radius-xl)",
      marginBottom: 12,
      overflow: "hidden",
      transition: "box-shadow .2s",
      boxShadow: open ? "0 4px 20px rgba(0,0,0,.06)" : "none",
    }}>
      {/* Header */}
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
          cursor: "pointer", background: open ? "var(--brand-light)" : "var(--bg-secondary)",
          transition: "background .2s",
        }}
      >
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "var(--brand)", color: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 14, flexShrink: 0,
        }}>D{day.day || index + 1}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>
            {day.city || `City ${index + 1}`}
            {day.summary && <span style={{ fontWeight: 400, color: "var(--text-muted)", marginLeft: 8, fontSize: 13 }}>— {day.summary}</span>}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", gap: 8, marginTop: 2 }}>
            {day.activities?.length > 0 && <span>📍 {day.activities.length} activities</span>}
            {day.meals?.breakfast && <span>🍳 B</span>}
            {day.meals?.lunch && <span>🍽️ L</span>}
            {day.meals?.dinner && <span>🌙 D</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            id={`remove-day-${index}`}
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="btn btn-ghost btn-icon btn-sm"
            style={{ color: "var(--danger)" }}
            title="Remove day"
          >🗑️</button>
          <span style={{ fontSize: 18, color: "var(--text-muted)", userSelect: "none" }}>{open ? "▾" : "▸"}</span>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "16px 18px", background: "var(--bg)" }}>
          <div className="form-grid" style={{ marginBottom: 12 }}>
            <div className="input-group">
              <label className="input-label">City / Location</label>
              <input
                id={`day-city-${index}`}
                className="input"
                value={day.city || ""}
                onChange={(e) => update("city", e.target.value)}
                placeholder="e.g. Ubud, Bali"
              />
            </div>
            <div className="input-group">
              <label className="input-label">Date (optional)</label>
              <input
                id={`day-date-${index}`}
                className="input"
                type="date"
                value={day.date || ""}
                onChange={(e) => update("date", e.target.value)}
              />
            </div>
            <div className="input-group form-full">
              <label className="input-label">Day Summary</label>
              <input
                id={`day-summary-${index}`}
                className="input"
                value={day.summary || ""}
                onChange={(e) => update("summary", e.target.value)}
                placeholder="e.g. Arrive & explore Seminyak beach"
              />
            </div>
          </div>

          {/* Activities */}
          <div className="input-group" style={{ marginBottom: 12 }}>
            <label className="input-label">Activities</label>
            {(day.activities || []).map((act: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                <input
                  id={`day-act-${index}-${i}`}
                  className="input"
                  value={act}
                  onChange={(e) => updateActivity(i, e.target.value)}
                  placeholder={`Activity ${i + 1}`}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => removeActivity(i)}
                  style={{ color: "var(--danger)" }}
                >✕</button>
              </div>
            ))}
            <button
              id={`add-activity-${index}`}
              className="btn btn-ghost btn-sm"
              onClick={addActivity}
              style={{ marginTop: 4 }}
            >+ Add Activity</button>
          </div>

          {/* Meals & Tour Type */}
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div>
              <label className="input-label" style={{ marginBottom: 8, display: "block" }}>Meals Included</label>
              <div style={{ display: "flex", gap: 12 }}>
                {[
                  { key: "breakfast", icon: "🍳", label: "Breakfast" },
                  { key: "lunch", icon: "🍽️", label: "Lunch" },
                  { key: "dinner", icon: "🌙", label: "Dinner" },
                ].map((m) => (
                  <label key={m.key} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
                    <input
                      type="checkbox"
                      id={`meal-${m.key}-${index}`}
                      checked={day.meals?.[m.key] || false}
                      onChange={(e) => updateMeal(m.key, e.target.checked)}
                    />
                    {m.icon} {m.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="input-group">
              <label className="input-label">Tour Type</label>
              <select
                id={`tour-type-${index}`}
                className="input"
                value={day.tour_type || "Private"}
                onChange={(e) => update("tour_type", e.target.value)}
                style={{ minWidth: 130 }}
              >
                <option>Private</option>
                <option>SIC</option>
                <option>Self-drive</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
