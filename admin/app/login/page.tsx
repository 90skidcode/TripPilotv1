"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@trippilot.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    setError("");

    try {
      await SuperAdminAPI.login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(to bottom right, var(--brand-light), #f0e6ff)" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div className="logo-icon" style={{ width: "48px", height: "48px", fontSize: "24px", margin: "0 auto 16px" }}>
            P
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
            TripPilot
          </h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "8px" }}>Admin Portal</p>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: "32px" }}>
          <h2 className="card-title" style={{ marginBottom: "24px" }}>Sign In</h2>

          {error && (
            <div style={{ marginBottom: "16px", padding: "12px", backgroundColor: "#fee2e2", color: "var(--danger)", borderRadius: "var(--radius)", border: "1px solid #fecaca", fontSize: "14px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@trippilot.com"
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </div>

          <p style={{ marginTop: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "14px" }}>
            Superadmin account required to access
          </p>
        </div>

        {/* Footer Info */}
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "14px", color: "var(--text-secondary)" }}>
          <p>Demo Credentials:</p>
          <p style={{ marginTop: "8px" }}>
            Email: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>admin@trippilot.com</span>
          </p>
          <p>
            Password: <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>password123</span>
          </p>
        </div>
      </div>
    </div>
  );
}
