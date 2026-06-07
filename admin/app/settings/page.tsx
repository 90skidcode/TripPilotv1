"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();

  // Diagnostics & Profiles States
  const [checkingDiagnostics, setCheckingDiagnostics] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<any>(null);
  
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
    }
  }, []);

  function showToast(message: string, type: "success" | "error" | "info" = "success") {
    setToast({ message, type, isOpen: true });
    setTimeout(() => {
      setToast(current => {
        if (current && current.message === message) {
          return { ...current, isOpen: false };
        }
        return current;
      });
    }, 4000);
  }

  async function runDiagnostics() {
    setCheckingDiagnostics(true);
    setDiagnosticResult(null);
    try {
      const startTime = performance.now();
      const res = await SuperAdminAPI.getHealth();
      const endTime = performance.now();
      
      setDiagnosticResult({
        status: "SUCCESS",
        responseTimeMs: Math.round(endTime - startTime),
        gatewayUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
        payload: res,
        timestamp: new Date().toISOString()
      });
      showToast("Diagnostics diagnostic check: healthy", "success");
    } catch (err) {
      console.error(err);
      setDiagnosticResult({
        status: "FAILURE",
        gatewayUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
        error: err instanceof Error ? err.message : "Gateway is currently unreachable or offline",
        timestamp: new Date().toISOString()
      });
      showToast("Diagnostics diagnostic check: failed", "error");
    } finally {
      setCheckingDiagnostics(false);
    }
  }

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px", background: "var(--bg-main)", minHeight: "calc(100vh - 70px)" }}>
      {/* HEADER SECTION */}
      <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>Portal Settings</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>Manage system profiles, developer sandboxes, and perform API latency diagnostic tests</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        {/* LEFT COLUMN: PROFILE CARD & SYSTEM SETTINGS */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* PROFILE CARD */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
            <div style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--brand) 0%, #a78bfa 100%)",
              color: "white",
              fontWeight: 800,
              fontSize: "24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(139, 92, 246, 0.25)"
            }}>
              SA
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>Super Administrator</h3>
                <span style={{ fontSize: "10px", background: "#FEF3C7", color: "#D97706", padding: "2px 6px", borderRadius: "6px", fontWeight: 700, textTransform: "uppercase" }}>
                  Root Access
                </span>
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>admin@trippilot.com</p>
              <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
                <span style={{ fontSize: "11px", background: "var(--bg-hover)", color: "var(--text-primary)", padding: "2px 8px", borderRadius: "4px", fontWeight: 600 }}>
                  Portal Security Level: 5 (Maximum)
                </span>
              </div>
            </div>
          </div>

          {/* SYSTEM PROPERTIES SHEET */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>System Specification Parameters</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Internal environmental variables configured in deployment files</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>API Gateway Endpoint</span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "monospace", fontWeight: 600 }}>
                  {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Active Port Mapping</span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontFamily: "monospace", fontWeight: 600 }}>8000 (Core Backend)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Relational DB Engine</span>
                <span style={{ fontSize: "13px", color: "var(--text-primary)", fontWeight: 600 }}>SQLite (FastAPI Context / SQLAlchemy ORM)</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #F1F5F9", paddingBottom: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Diagnostics Sandbox Status</span>
                <span style={{ fontSize: "11px", background: "#DCFCE7", color: "#16A34A", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>OPERATIONAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DEVELOPER SANDBOX & TOAST INTERACTIVE SUITE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          
          {/* INTERACTIVE TOAST SUITE */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Interactive Toast Suite</h3>
              <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Test and verify CSS transition toast alerts</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <button
                onClick={() => showToast("Database index table seeding complete!", "success")}
                className="btn"
                style={{
                  background: "#10B981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#059669"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#10B981"}
              >
                ✅ Success Toast
              </button>

              <button
                onClick={() => showToast("Gateway notification: active sessions optimized", "info")}
                className="btn"
                style={{
                  background: "var(--brand)",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#6D28D9"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--brand)"}
              >
                ℹ️ Info Toast
              </button>

              <button
                onClick={() => showToast("Simulation error: transactional locks detected", "error")}
                className="btn"
                style={{
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "10px",
                  fontWeight: 600,
                  fontSize: "12px",
                  cursor: "pointer",
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "#DC2626"}
                onMouseLeave={(e) => e.currentTarget.style.background = "#EF4444"}
              >
                ❌ Error Toast
              </button>
            </div>
          </div>

          {/* DIAGNOSTIC API DUMP SANDBOX */}
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Gateway Diagnostic Console</h3>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Test and verify real-time FastAPI routing health</p>
              </div>
              <button
                onClick={runDiagnostics}
                disabled={checkingDiagnostics}
                className="btn btn-primary"
                style={{ fontSize: "12px", height: "32px", padding: "0 12px" }}
              >
                {checkingDiagnostics ? "Running..." : "🧪 Run Diagnostics"}
              </button>
            </div>

            {/* JSON Output Container */}
            <div style={{
              background: "#0F172A",
              border: "1px solid #1E293B",
              borderRadius: "8px",
              padding: "14px",
              minHeight: "140px",
              maxHeight: "220px",
              overflowY: "auto",
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#38BDF8"
            }}>
              {diagnosticResult ? (
                <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(diagnosticResult, null, 2)}
                </pre>
              ) : (
                <div style={{ color: "#64748B", textAlign: "center", paddingTop: "50px" }}>
                  Console idle. Press &quot;Run Diagnostics&quot; to test connection.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING TOAST COMPONENT */}
      {toast && toast.isOpen && (
        <>
          <style>{`
            @keyframes toastSlideIn {
              from {
                transform: translateX(120%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div
            style={{
              position: "fixed",
              top: "24px",
              right: "24px",
              background: toast.type === "success" 
                ? "#E6F4EA" 
                : toast.type === "error" 
                ? "#FCE8E6" 
                : "var(--brand-light)",
              color: toast.type === "success" 
                ? "#137333" 
                : toast.type === "error" 
                ? "#C5221F" 
                : "var(--brand)",
              border: toast.type === "success" 
                ? "1px solid #A3E2AB" 
                : toast.type === "error" 
                ? "1px solid #FAD2CF" 
                : "1px solid #D8C1FF",
              padding: "16px 20px",
              borderRadius: "12px",
              boxShadow: "0 10px 30px rgba(15, 23, 42, 0.12)",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              zIndex: 9999,
              minWidth: "320px",
              maxWidth: "450px",
              fontSize: "14px",
              fontWeight: 600,
              animation: "toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            <span style={{ fontSize: "18px" }}>
              {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
            </span>
            <span style={{ flex: 1, color: "var(--text-primary)" }}>{toast.message}</span>
            <button
              onClick={() => setToast(current => current ? { ...current, isOpen: false } : null)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-secondary)",
                fontSize: "16px",
                padding: "4px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0.7,
                transition: "opacity 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
              onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
            >
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}
