"use client";
import { useState } from "react";
import { authApi } from "@/lib/api";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddEmployeeModal({ onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "agent",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(key: string, val: any) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await authApi.register(form);
      onSaved();
    } catch (err: any) {
      setError(err.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Employee</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="employee-modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: "grid", gap: 12 }}>
              <div className="input-group">
                <label className="input-label">Full Name <span className="required">*</span></label>
                <input
                  id="employee-name"
                  className="input"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email <span className="required">*</span></label>
                <input
                  id="employee-email"
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  required
                  placeholder="e.g. john@example.com"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Password <span className="required">*</span></label>
                <input
                  id="employee-password"
                  className="input"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                  placeholder="Minimum 6 characters"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Role</label>
                <select
                  id="employee-role"
                  className="input"
                  value={form.role}
                  onChange={(e) => update("role", e.target.value)}
                >
                  <option value="agent">Agent</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            {error && <div style={{ background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "var(--radius)", fontSize: 13, marginTop: 12 }}>{error}</div>}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} id="employee-modal-cancel">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading} id="employee-modal-save">
              {loading ? "Creating…" : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
