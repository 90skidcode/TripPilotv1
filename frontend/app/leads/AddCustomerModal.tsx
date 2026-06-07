"use client";
import { useState } from "react";
import { customersApi } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSaved: (customer: any) => void;
}

export default function AddCustomerModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    whatsapp_number: "",
  });
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function handleSameAsPhoneToggle(checked: boolean) {
    setSameAsPhone(checked);
    if (checked) {
      setForm((f) => ({ ...f, whatsapp_number: f.phone }));
    }
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const customer = await customersApi.create({
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        whatsapp_number: form.whatsapp_number || null,
      });
      onSaved(customer);
    } catch (err: any) {
      setError(err.message || "Failed to save customer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "white",
          borderRadius: "var(--radius, 8px)",
          width: "100%",
          maxWidth: 480,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #e3eaef",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, margin: 0 }}>Add New Customer</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: "24px", overflowY: "auto", maxHeight: "calc(85vh - 120px)" }}>
            <div className="form-grid">
              <div className="input-group form-full">
                <label className="input-label">Full Name <span className="required">*</span></label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  required
                />
              </div>
              <div className="input-group form-full">
                <label className="input-label">Phone <span className="required">*</span></label>
                <input
                  className="input"
                  value={form.phone}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((f) => ({
                      ...f,
                      phone: val,
                      whatsapp_number: sameAsPhone ? val : f.whatsapp_number,
                    }));
                  }}
                  placeholder="e.g. 9876543210"
                  required
                />
              </div>
              <div className="input-group form-full">
                <label className="input-label">Email</label>
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="e.g. priya@example.com"
                />
              </div>
              <div className="input-group form-full">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.375rem" }}>
                  <label className="input-label" style={{ marginBottom: 0 }}>WhatsApp Number</label>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", cursor: "pointer", fontWeight: 500 }}>
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => handleSameAsPhoneToggle(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    Same as Phone
                  </label>
                </div>
                <input
                  className="input"
                  value={form.whatsapp_number}
                  onChange={(e) => {
                    if (!sameAsPhone) {
                      update("whatsapp_number", e.target.value);
                    }
                  }}
                  placeholder="e.g. +919876543210"
                  disabled={sameAsPhone}
                />
              </div>
            </div>

            {error && (
              <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "var(--radius)", fontSize: 13, marginTop: 16 }}>
                {error}
              </div>
            )}
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderTop: "1px solid #e3eaef",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              backgroundColor: "#f1f3fa"
            }}
          >
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving…" : "Save Customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
