"use client";

import { useState, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";

interface MenuItemType {
  label: string;
  href: string;
  icon: string;
  subItems?: MenuItemType[];
}

const MENU_ITEMS: MenuItemType[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: "📊",
  },
  {
    label: "Agencies",
    href: "/agencies",
    icon: "🏢",
  },
  {
    label: "Pricing Plans",
    href: "/pricing-plans",
    icon: "💰",
  },
  {
    label: "Master Data",
    href: "/master-data",
    icon: "📋",
  },
  {
    label: "Users",
    href: "/users",
    icon: "👥",
  },
  {
    label: "Reports",
    href: "/reports",
    icon: "📈",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: "⚙️",
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  const toggleSubmenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => pathname === href;

  const handleLogout = () => {
    SuperAdminAPI.logout();
    router.push("/login");
  };

  return (
    <>
      {/* Sidebar */}
      <aside className={`sidebar ${!sidebarOpen ? "collapsed" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon">P</div>
          {sidebarOpen && (
            <div>
              <div className="logo-text">TripPilot</div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Admin</div>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {MENU_ITEMS.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={(e) => {
                  if (item.subItems) {
                    e.preventDefault();
                    toggleSubmenu(item.label);
                  }
                }}
                className={`nav-item ${isActive(item.href) ? "active" : ""}`}
                title={!sidebarOpen ? item.label : ""}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </Link>

              {/* Submenu Items */}
              {item.subItems && sidebarOpen && expandedMenus.includes(item.label) && (
                <div className="nav-submenu">
                  {item.subItems.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={`nav-item ${isActive(subItem.href) ? "active" : ""}`}
                      style={{ paddingLeft: "28px", fontSize: "13px" }}
                    >
                      <span className="nav-label">{subItem.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Logout Nav Item at the bottom of navigation */}
          <div style={{ marginTop: 8 }}>
            <div
              className="nav-item"
              onClick={handleLogout}
              title={!sidebarOpen ? "Logout" : ""}
              id="nav-logout"
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">Logout</span>
            </div>
          </div>
        </nav>

        {/* Toggle Sidebar Button at the bottom */}
        <div
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          id="sidebar-toggle-btn"
          title={!sidebarOpen ? "Expand" : "Collapse"}
        >
          {sidebarOpen ? "←" : "→"}
        </div>
      </aside>

      {/* Top Bar */}
      <header className={`topbar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="topbar-left">
          <h2 className="page-title">
            {MENU_ITEMS.find((item) => isActive(item.href))?.label || "Dashboard"}
          </h2>
        </div>
        <div className="topbar-right">
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>Superadmin</p>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>admin@trippilot.com</p>
          </div>
          <div className="avatar">A</div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`main-content ${!sidebarOpen ? "collapsed" : ""}`}>
        {children}
      </main>
    </>
  );
}
