"use client";

interface FlightLeg {
  from?: string;
  to?: string;
  airline?: string;
  date?: string;
  departure_time?: string;
  arrival_time?: string;
  duration?: string;
  flight_number?: string;
  baggage?: string;
}

interface Props {
  flights: { onward?: FlightLeg; return?: FlightLeg };
  onChange: (updated: any) => void;
}

function LegEditor({ label, icon, data, onUpdate }: { label: string; icon: string; data: FlightLeg; onUpdate: (d: FlightLeg) => void }) {
  function u(key: keyof FlightLeg, val: string) { onUpdate({ ...data, [key]: val }); }

  return (
    <div style={{ border: "1.5px solid var(--border)", borderRadius: "var(--radius-xl)", padding: 18, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{label}</div>
      </div>
      <div className="form-grid">
        <div className="input-group">
          <label className="input-label">From City</label>
          <input id={`flight-from-${label}`} className="input" value={data.from || ""} onChange={(e) => u("from", e.target.value)} placeholder="e.g. Delhi (DEL)" />
        </div>
        <div className="input-group">
          <label className="input-label">To City</label>
          <input id={`flight-to-${label}`} className="input" value={data.to || ""} onChange={(e) => u("to", e.target.value)} placeholder="e.g. Denpasar (DPS)" />
        </div>
        <div className="input-group">
          <label className="input-label">Airline</label>
          <input id={`flight-airline-${label}`} className="input" value={data.airline || ""} onChange={(e) => u("airline", e.target.value)} placeholder="e.g. IndiGo" />
        </div>
        <div className="input-group">
          <label className="input-label">Flight No.</label>
          <input id={`flight-num-${label}`} className="input" value={data.flight_number || ""} onChange={(e) => u("flight_number", e.target.value)} placeholder="e.g. 6E 1234" />
        </div>
        <div className="input-group">
          <label className="input-label">Date</label>
          <input id={`flight-date-${label}`} className="input" type="date" value={data.date || ""} onChange={(e) => u("date", e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Departure</label>
          <input id={`flight-dep-${label}`} className="input" type="time" value={data.departure_time || ""} onChange={(e) => u("departure_time", e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Arrival</label>
          <input id={`flight-arr-${label}`} className="input" type="time" value={data.arrival_time || ""} onChange={(e) => u("arrival_time", e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Duration</label>
          <input id={`flight-dur-${label}`} className="input" value={data.duration || ""} onChange={(e) => u("duration", e.target.value)} placeholder="e.g. 6h 30m" />
        </div>
        <div className="input-group">
          <label className="input-label">Baggage Allowance</label>
          <input id={`flight-bag-${label}`} className="input" value={data.baggage || ""} onChange={(e) => u("baggage", e.target.value)} placeholder="e.g. 20kg + 7kg cabin" />
        </div>
      </div>
    </div>
  );
}

export default function FlightBlock({ flights, onChange }: Props) {
  return (
    <div>
      <LegEditor
        label="Onward Flight"
        icon="🛫"
        data={flights.onward || {}}
        onUpdate={(d) => onChange({ ...flights, onward: d })}
      />
      <LegEditor
        label="Return Flight"
        icon="🛬"
        data={flights.return || {}}
        onUpdate={(d) => onChange({ ...flights, return: d })}
      />
    </div>
  );
}
