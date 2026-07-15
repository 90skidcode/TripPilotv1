"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useMasterDataByCategory } from "@/hooks/useMasterData";
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
  const { data: stagesData } = useMasterDataByCategory("lead_stages");
  const { data: sourcesData } = useMasterDataByCategory("lead_sources");
  const [local, setLocal] = useState({ ...filters });
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  function close() {
    if (closing) return;
    setClosing(true);
    setTimeout(onClose, 270);
  }

  function toggle(key: string, value: string) {
    setLocal((f: any) => ({ ...f, [key]: f[key] === value ? undefined : value }));
  }

  if (!mounted) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          zIndex: 9998,
          animation: closing ? "overlayFadeOut 0.27s ease-in forwards" : "overlayFadeIn 0.25s ease-out forwards",
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          height: "100%",
          width: 360,
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
          zIndex: 9999,
          animation: closing ? "slideOutRight 0.27s ease-in forwards" : "slideInRight 0.25s ease-out forwards",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16, margin: 0 }}>Filters</h3>
          <button
            onClick={close}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "#6b7280", lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

          {/* Date */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: 10 }}>Quick Date Filter</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {DATE_PRESETS.map((p) => (
              <button
                key={p.value}
                onClick={() => setLocal((f: any) => ({ ...f, date_preset: p.value }))}
                style={{
                  padding: "5px 14px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid",
                  cursor: "pointer",
                  backgroundColor: local.date_preset === p.value ? "#3b82f6" : "#fff",
                  borderColor: local.date_preset === p.value ? "#3b82f6" : "#d1d5db",
                  color: local.date_preset === p.value ? "#fff" : "#374151",
                  fontWeight: local.date_preset === p.value ? 600 : 400,
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "4px 0 20px" }} />

          {/* Source */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: 10 }}>Platform / Source</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {sourcesData.map((s) => (
              <button
                key={s.key}
                onClick={() => toggle("source", s.key)}
                style={{
                  padding: "5px 14px",
                  fontSize: 13,
                  borderRadius: 6,
                  border: "1px solid",
                  cursor: "pointer",
                  backgroundColor: local.source === s.key ? "#3b82f6" : "#fff",
                  borderColor: local.source === s.key ? "#3b82f6" : "#d1d5db",
                  color: local.source === s.key ? "#fff" : "#374151",
                  fontWeight: local.source === s.key ? 600 : 400,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ height: 1, backgroundColor: "#e5e7eb", margin: "4px 0 20px" }} />

          {/* Stage */}
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280", marginBottom: 10 }}>Lead Stage</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {stagesData.map((s) => (
              <label
                key={s.key}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 4px", borderRadius: 6 }}
              >
                <input
                  type="radio"
                  name="stage"
                  checked={local.stage === s.key}
                  onChange={() => toggle("stage", s.key)}
                  style={{ accentColor: "#3b82f6", width: 16, height: 16 }}
                />
                <span style={{ fontSize: 14, color: "#374151" }}>{s.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => setLocal({})}
            style={{ padding: "9px 16px", borderRadius: 8, border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#374151" }}
          >
            Clear All
          </button>
          <button
            onClick={() => onApply(local)}
            style={{ padding: "9px 16px", borderRadius: 8, border: "none", background: "#3b82f6", cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#fff" }}
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
