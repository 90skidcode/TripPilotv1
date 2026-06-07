"use client";
import { useState } from "react";

const SOURCES = ["whatsapp", "instagram", "website", "referral", "advertisement", "manual", "email"];
const STAGES = [
  { value: "fresh", label: "Fresh Lead" },
  { value: "qualified_hot", label: "Qualified Hot 🔥" },
  { value: "qualified_warm", label: "Qualified Warm" },
  { value: "won", label: "Won ✅" },
  { value: "lost", label: "Lost" },
  { value: "not_responding", label: "Not Responding" },
  { value: "disqualified", label: "Disqualified" },
  { value: "future_prospect", label: "Future Prospect" },
];
const DATE_PRESETS = [
  { label: "All Leads", value: "" },
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "Last 90 Days", value: "90days" },
];

interface Props {
  filters: any;
  onApply: (filters: any) => void;
  onClose: () => void;
}

export default function FilterDrawer({ filters, onApply, onClose }: Props) {
  const [local, setLocal] = useState({ ...filters });

  function toggle(key: string, value: string) {
    setLocal((f: any) => ({ ...f, [key]: f[key] === value ? undefined : value }));
  }

  function handleClear() { setLocal({}); }

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>Filters</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="filter-drawer-close">✕</button>
        </div>

        <div className="drawer-body">
          {/* Date Presets */}
          <div className="section-title">Quick Date Filter</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                id={`filter-date-${p.value || "all"}`}
                className={`btn btn-sm${local.date_preset === p.value ? " btn-primary" : " btn-outline"}`}
                onClick={() => setLocal((f: any) => ({ ...f, date_preset: p.value }))}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="divider" />

          {/* Platform / Source */}
          <div className="section-title">Platform / Source</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {SOURCES.map((s) => (
              <button
                key={s}
                id={`filter-source-${s}`}
                className={`btn btn-sm${local.source === s ? " btn-primary" : " btn-outline"}`}
                onClick={() => toggle("source", s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="divider" />

          {/* Lead Stage */}
          <div className="section-title">Lead Stage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STAGES.map((s) => (
              <label
                key={s.value}
                id={`filter-stage-${s.value}`}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 0" }}
              >
                <input
                  type="radio"
                  name="stage"
                  checked={local.stage === s.value}
                  onChange={() => toggle("stage", s.value)}
                />
                <span style={{ fontSize: 14 }}>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-outline w-full" onClick={handleClear} id="filter-clear-btn">Clear All</button>
          <button className="btn btn-primary w-full" onClick={() => onApply(local)} id="filter-apply-btn">Apply Filters</button>
        </div>
      </div>
    </>
  );
}
