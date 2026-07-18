"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await SuperAdminAPI.login(email, password);

      // This portal is superadmin-only; server endpoints enforce it too,
      // but reject non-admin accounts here instead of showing a broken shell.
      if (!data.user?.is_superadmin) {
        SuperAdminAPI.clearToken();
        setError("This portal is for TripPilot administrators only.");
        return;
      }

      try {
        localStorage.setItem(
          "superadmin_user",
          JSON.stringify({ name: data.user.name, email: data.user.email })
        );
      } catch {
        // non-critical — topbar falls back to a generic avatar
      }
      router.push("/dashboard");
    } catch {
      setError("Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Brand panel */}
      <div
        className="login-brand-panel"
        style={{
          flex: 1,
          background: "linear-gradient(135deg, var(--brand) 0%, #1D4ED8 100%)",
          color: "white",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.1,
            background: "radial-gradient(ellipse at top left, white, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "12px", zIndex: 1 }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "22px",
            }}
          >
            P
          </div>
          <span style={{ fontSize: "22px", fontWeight: 700, letterSpacing: "-0.5px" }}>TripPilot</span>
        </div>

        <div style={{ zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.15)",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "20px",
            }}
          >
            <ShieldCheck size={16} />
            Admin Portal
          </div>
          <h1 style={{ fontSize: "36px", fontWeight: 700, lineHeight: 1.2, marginBottom: "16px" }}>
            Run TripPilot,
            <br />
            behind the scenes.
          </h1>
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "16px", maxWidth: "400px" }}>
            Manage agencies, pricing plans, and subscriptions from one place.
          </p>
        </div>

        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", zIndex: 1 }}>
          © {new Date().getFullYear()} TripPilot. All rights reserved.
        </p>
      </div>

      {/* Form panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
          padding: "24px",
        }}
      >
        <div style={{ width: "100%", maxWidth: "380px" }}>
          <div style={{ marginBottom: "32px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
              Welcome back
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginTop: "4px" }}>
              Sign in to the TripPilot admin portal.
            </p>
          </div>

          {error && (
            <div
              style={{
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#fee2e2",
                color: "var(--danger)",
                borderRadius: "var(--radius)",
                border: "1px solid #fecaca",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="admin-login-email">
                Email address
              </label>
              <input
                id="admin-login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@trippilot.com"
                autoComplete="email"
                required
                style={{ height: "44px" }}
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="admin-login-password">
                Password
              </label>
              <input
                id="admin-login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                style={{ height: "44px" }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: "100%", height: "44px", fontSize: "15px", justifyContent: "center" }}
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p
            style={{
              marginTop: "32px",
              textAlign: "center",
              color: "var(--text-muted)",
              fontSize: "13px",
            }}
          >
            Superadmin account required to access this portal.
          </p>
        </div>
      </div>

      {/* Hide brand panel on small screens */}
      <style>{`
        @media (max-width: 1023px) {
          .login-brand-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
