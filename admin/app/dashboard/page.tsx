"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";

interface HealthStats {
  status: string;
  organizations: {
    total: number;
    active: number;
  };
  users: {
    total: number;
  };
  leads: {
    total: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<HealthStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await SuperAdminAPI.getHealth();
      setStats(data);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading dashboard stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={{ padding: "28px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600, color: "var(--danger)", marginBottom: "12px" }}>Failed to load dashboard stats</div>
        <button onClick={loadStats} className="btn btn-outline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px", marginBottom: "24px" }}>
        {/* Total Organizations */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>🏢</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>+12.5%</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Total Organizations</p>
          <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stats.organizations.total}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
            {stats.organizations.active} active
          </p>
        </div>

        {/* Active Organizations */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>✅</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>+8.2%</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Active Organizations</p>
          <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stats.organizations.active}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>
            {stats.organizations.total - stats.organizations.active} suspended
          </p>
        </div>

        {/* Total Users */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>👥</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>+15.3%</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Total Users</p>
          <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stats.users.total}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>vs last month</p>
        </div>

        {/* Total Leads */}
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <span style={{ fontSize: "24px" }}>📊</span>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--success)" }}>+22.1%</span>
          </div>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Total Leads</p>
          <p style={{ fontSize: "32px", fontWeight: 700, color: "var(--text-primary)" }}>
            {stats.leads.total}
          </p>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "8px" }}>vs last month</p>
        </div>
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "24px", marginBottom: "24px" }}>
        {/* Organizations Status */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
            Organizations Status
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Active
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {stats.organizations.active}
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--success)",
                    borderRadius: "4px",
                    width:
                      stats.organizations.total > 0
                        ? `${Math.round((stats.organizations.active / stats.organizations.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-secondary)" }}>
                  Suspended
                </span>
                <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {stats.organizations.total - stats.organizations.active}
                </span>
              </div>
              <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "4px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    background: "var(--danger)",
                    borderRadius: "4px",
                    width:
                      stats.organizations.total > 0
                        ? `${Math.round(((stats.organizations.total - stats.organizations.active) / stats.organizations.total) * 100)}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Overview */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "24px" }}>
            System Overview
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Avg Users per Org</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                {stats.organizations.total && stats.users.total
                  ? (stats.users.total / stats.organizations.total).toFixed(1)
                  : "0"}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Avg Leads per Org</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                {stats.organizations.total && stats.leads.total
                  ? (stats.leads.total / stats.organizations.total).toFixed(0)
                  : "0"}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>Total Data Points</p>
              <p style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)" }}>
                {((stats.users.total || 0) + (stats.leads.total || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "8px" }}>System Health</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--success)" }}></div>
                <span style={{ color: "var(--success)", fontWeight: 600 }}>Healthy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>Quick Actions</h3>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          <Link
            href="/agencies"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              textDecoration: "none",
              transition: "all var(--transition)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.backgroundColor = "#f3e8ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>🏢</p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>View Agencies</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Manage agencies</p>
          </Link>
          <Link
            href="/pricing-plans"
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              textDecoration: "none",
              transition: "all var(--transition)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--brand)";
              e.currentTarget.style.backgroundColor = "#f3e8ff";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>💰</p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Pricing Plans</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Manage subscriptions</p>
          </Link>
          <button
            onClick={() => {
              SuperAdminAPI.logout();
              router.push("/login");
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              padding: "16px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              textAlign: "center",
              cursor: "pointer",
              background: "transparent",
              transition: "all var(--transition)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--danger)";
              e.currentTarget.style.backgroundColor = "#fee2e2";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <p style={{ fontSize: "24px", marginBottom: "8px" }}>🚪</p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)" }}>Logout</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Sign out</p>
          </button>
        </div>
      </div>
    </div>
  );
}
