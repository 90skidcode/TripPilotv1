"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";

interface AgencyReportData {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string | null;
  user_count: number;
  lead_count: number;
  plan: string;
}

export default function ReportsPage() {
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<{
    status: string;
    organizations: { total: number; active: number };
    users: { total: number };
    leads: { total: number };
  } | null>(null);

  const [agencies, setAgencies] = useState<AgencyReportData[]>([]);
  const [latency, setLatency] = useState<number | null>(null);
  const [testingLatency, setTestingLatency] = useState(false);
  const { pagination, handlers } = usePagination(0);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    loadReportMetrics();
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

  async function loadReportMetrics() {
    setLoading(true);
    const startTime = performance.now();
    try {
      const [fetchedHealth, fetchedAgencies] = await Promise.all([
        SuperAdminAPI.getHealth(),
        SuperAdminAPI.getAgencies()
      ]);

      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      setHealthData(fetchedHealth);
      setAgencies(fetchedAgencies);
    } catch (error) {
      console.error("Failed to load reports data:", error);
      if (error instanceof Error && error.message === "Unauthorized") {
        showToast("Session expired. Redirecting to login...", "error");
        setTimeout(() => router.push("/login"), 1500);
      } else {
        showToast("Failed to fetch systems metrics and logs", "error");
      }
    } finally {
      setLoading(false);
    }
  }

  async function testLatency() {
    setTestingLatency(true);
    const startTime = performance.now();
    try {
      await SuperAdminAPI.getHealth();
      const endTime = performance.now();
      setLatency(Math.round(endTime - startTime));
      showToast("Gateway health diagnostics complete", "success");
    } catch (err) {
      showToast("Latency check failed: Gateway unreachable", "error");
    } finally {
      setTestingLatency(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "350px", color: "var(--text-primary)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto 16px auto", width: "40px", height: "40px", border: "3px solid var(--border)", borderTop: "3px solid var(--brand)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
          <div style={{ fontSize: "16px", fontWeight: 600 }}>Analyzing system database logs...</div>
        </div>
      </div>
    );
  }

  // --- Dynamic calculations ---
  const totalOrgs = agencies.length;
  const activeOrgs = agencies.filter(a => a.is_active).length;
  const suspendedOrgs = totalOrgs - activeOrgs;
  
  const activePercentage = totalOrgs > 0 ? Math.round((activeOrgs / totalOrgs) * 100) : 0;
  const suspendedPercentage = totalOrgs > 0 ? 100 - activePercentage : 0;

  // Maximum usage limits for comparative scales
  const maxLeads = Math.max(...agencies.map(a => a.lead_count), 5);
  const maxUsers = Math.max(...agencies.map(a => a.user_count), 3);

  // Chronological registration log (sorted oldest to newest by created_at date)
  const chronologicalLogs = [...agencies].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  return (
    <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "28px", background: "var(--bg-main)", minHeight: "calc(100vh - 70px)" }}>
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 800, marginBottom: "8px", color: "var(--text-primary)" }}>System Reports</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>Cross-tenant audit diagnostics, active distributions, and database load parameters</p>
        </div>
        <button
          onClick={testLatency}
          disabled={testingLatency}
          className="btn btn-outline"
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", height: "38px" }}
        >
          {testingLatency ? (
            <span>Testing...</span>
          ) : (
            <>
              <span>⚡ Test Latency</span>
              {latency !== null && (
                <span style={{
                  fontSize: "11px",
                  background: latency < 100 ? "#DCFCE7" : "#FEF3C7",
                  color: latency < 100 ? "#15803D" : "#B45309",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 700
                }}>
                  {latency}ms
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* 4-KPI METRIC GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        {/* KPI 1 */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(15,23,42,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>Organizations</span>
            <span style={{ fontSize: "20px" }}>🏢</span>
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{totalOrgs}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            <span style={{ color: "#16A34A", fontWeight: 600 }}>{activeOrgs} Active</span> / {suspendedOrgs} Suspended
          </p>
        </div>

        {/* KPI 2 */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(15,23,42,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>Total Roster Users</span>
            <span style={{ fontSize: "20px" }}>👥</span>
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{healthData?.users.total ?? 0}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Average of {totalOrgs > 0 ? (healthData ? Math.round(healthData.users.total / totalOrgs * 10) / 10 : 0) : 0} users per agency
          </p>
        </div>

        {/* KPI 3 */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(15,23,42,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>Active Lead Records</span>
            <span style={{ fontSize: "20px" }}>💼</span>
          </div>
          <h2 style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>{healthData?.leads.total ?? 0}</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "6px" }}>
            Total processed customer opportunities
          </p>
        </div>

        {/* KPI 4 */}
        <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(15,23,42,0.01)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-secondary)", letterSpacing: "0.02em" }}>System Status</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="pulse" style={{ display: "inline-block", width: "8px", height: "8px", background: "#16A34A", borderRadius: "50%", boxShadow: "0 0 8px #16A34A" }} />
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#16A34A" }}>LIVE</span>
            </div>
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "var(--text-primary)", margin: 0, textTransform: "uppercase" }}>
            {healthData?.status === "healthy" ? "Healthy ✅" : "Warning ⚠️"}
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "16px" }}>
            Core gateway endpoints operational
          </p>
        </div>
      </div>

      {/* CHARTS CONTAINER: ACTIVE RATIO AND VERTICAL UTILIZATION */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px" }}>
        
        {/* CHART LEFT: ACTIVE VS SUSPENDED (HORIZONTAL PURE-CSS RATIO) */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Organization Distribution</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Ratio metrics showing overall suspension rates</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "10px" }}>
            {/* Visual ratio bar */}
            <div style={{ display: "flex", height: "24px", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border)", background: "#F1F5F9" }}>
              {totalOrgs === 0 ? (
                <div style={{ width: "100%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--text-secondary)" }}>
                  No Data Configured
                </div>
              ) : (
                <>
                  <div
                    style={{
                      width: `${activePercentage}%`,
                      background: "linear-gradient(90deg, #10B981 0%, #059669 100%)",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                    title={`Active: ${activeOrgs}`}
                  >
                    {activePercentage > 15 && `${activePercentage}%`}
                  </div>
                  <div
                    style={{
                      width: `${suspendedPercentage}%`,
                      background: "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                    title={`Suspended: ${suspendedOrgs}`}
                  >
                    {suspendedPercentage > 15 && `${suspendedPercentage}%`}
                  </div>
                </>
              )}
            </div>

            {/* Labels and Legend */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg-hover)", padding: "16px", borderRadius: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", background: "#10B981", borderRadius: "50%" }} />
                  <span>Active Spaces</span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", paddingLeft: "16px" }}>
                  {activeOrgs} <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>({activePercentage}%)</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                  <span style={{ display: "inline-block", width: "10px", height: "10px", background: "#EF4444", borderRadius: "50%" }} />
                  <span>Suspended Spaces</span>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", paddingLeft: "16px" }}>
                  {suspendedOrgs} <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 500 }}>({suspendedPercentage}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CHART RIGHT: PURE-CSS VERTICAL COMPARATIVE UTILIZATION BAR CHART */}
        <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Resource Comparative Load</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>Interactive tenant-level Leads & Users comparison</p>
          </div>

          <div style={{ flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-around", minHeight: "180px", paddingTop: "20px", borderBottom: "2px solid var(--border)" }}>
            {agencies.length === 0 ? (
              <div style={{ fontSize: "12px", color: "var(--text-secondary)", alignSelf: "center" }}>No resources recorded</div>
            ) : (
              agencies.map((agency) => {
                // Calculate percentage heights based on max system resource parameters
                const leadsPct = Math.round((agency.lead_count / maxLeads) * 100);
                const usersPct = Math.round((agency.user_count / maxUsers) * 100);

                return (
                  <div
                    key={agency.id}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "8px",
                      width: "60px"
                    }}
                  >
                    {/* Double-bars stacked side-by-side */}
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "130px" }}>
                      {/* Leads bar (Accented Purple/Brand) */}
                      <div
                        style={{
                          width: "12px",
                          height: `${Math.max(leadsPct, 5)}%`,
                          background: "linear-gradient(180deg, var(--brand) 0%, var(--brand-alpha) 100%)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 1s ease",
                          cursor: "pointer"
                        }}
                        title={`${agency.name}: ${agency.lead_count} Leads`}
                      />
                      {/* Users bar (Accented Turquoise) */}
                      <div
                        style={{
                          width: "12px",
                          height: `${Math.max(usersPct, 5)}%`,
                          background: "linear-gradient(180deg, #0ea5e9 0%, #bae6fd 100%)",
                          borderRadius: "4px 4px 0 0",
                          transition: "height 1s ease",
                          cursor: "pointer"
                        }}
                        title={`${agency.name}: ${agency.user_count} Users`}
                      />
                    </div>
                    {/* Label */}
                    <div style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                      textAlign: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      width: "100%"
                    }}>
                      {agency.name}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: "20px", fontSize: "11px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-primary)" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", background: "var(--brand)", borderRadius: "2px" }} />
              <span>Leads Count</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, color: "var(--text-primary)" }}>
              <span style={{ display: "inline-block", width: "10px", height: "10px", background: "#0ea5e9", borderRadius: "2px" }} />
              <span>Users Count</span>
            </div>
          </div>
        </div>
      </div>

      {/* DATABASE RESOURCE CHRONOLOGICAL LOGS TABLE */}
      <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Database Resource Audit Logs</h3>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>Chronologically ordered ledger of tenant creations and system utilization indices</p>
        </div>

        {(() => {
          const columns: DataTableColumn<AgencyReportData>[] = [
            {
              key: "created_at",
              header: "Registration Date",
              render: (value) =>
                value
                  ? new Date(value).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : "Pre-existing Seed",
            },
            {
              key: "name",
              header: "Organization Name",
              render: (value, log) => (
                <div>
                  <div className="font-semibold">{value}</div>
                  <div className="text-xs text-slate-500">/{log.slug}</div>
                </div>
              ),
            },
            {
              key: "plan",
              header: "Subscription Plan",
              render: (value) => (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-600">
                  👑 {value || "Free Trial Plan"}
                </span>
              ),
            },
            {
              key: "user_count",
              header: "User Index",
              align: "center",
              render: (value) => <span className="font-semibold">{value}</span>,
            },
            {
              key: "lead_count",
              header: "Lead Index",
              align: "center",
              render: (value) => <span className="font-semibold">{value}</span>,
            },
            {
              key: "is_active",
              header: "Account Status",
              align: "center",
              render: (value) => (
                <span
                  className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                    value
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {value ? "Active" : "Suspended"}
                </span>
              ),
            },
          ];

          return (
            <DataTable<AgencyReportData>
              columns={columns}
              data={chronologicalLogs}
              pagination={{ ...pagination, total: chronologicalLogs.length }}
              onPaginationChange={handlers.onPaginationChange}
              isLoading={loading}
              emptyMessage="No audit log parameters found"
              emptyIcon="📋"
              compact={false}
              striped={true}
              hoverable={true}
            />
          );
        })()}
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
