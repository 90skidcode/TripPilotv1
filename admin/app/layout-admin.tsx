"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SuperAdminAPI } from "@/lib/api";
import {
  LayoutDashboard,
  Building2,
  Wallet,
  CreditCard,
  Database,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

interface MenuItemType {
  label: string;
  href: string;
  icon: LucideIcon;
  subItems?: MenuItemType[];
}

const MENU_ITEMS: MenuItemType[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Agencies",
    href: "/agencies",
    icon: Building2,
  },
  {
    label: "Pricing Plans",
    href: "/pricing-plans",
    icon: Wallet,
  },
  {
    label: "Subscriptions",
    href: "/subscriptions",
    icon: CreditCard,
  },
  {
    label: "Master Data",
    href: "/master-data",
    icon: Database,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "SA";
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<{ name?: string; email?: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("superadmin_user");
      if (stored) setAdminUser(JSON.parse(stored));
    } catch {
      // ignore malformed stored user
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        {/* Collapse toggle on the edge */}
        <button
          className="sidebar-edge-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          id="sidebar-toggle-btn"
          title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Navigation Menu */}
        <nav className="sidebar-nav">
          {sidebarOpen && <div className="nav-section-label">Navigation</div>}
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
                <span className="nav-icon"><item.icon size={20} /></span>
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

          {/* Logout at the bottom of navigation */}
          <div style={{ marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
            <div
              className="nav-item"
              onClick={handleLogout}
              title={!sidebarOpen ? "Logout" : ""}
              id="nav-logout"
            >
              <span className="nav-icon"><LogOut size={20} /></span>
              <span className="nav-label">Logout</span>
            </div>
          </div>
        </nav>
      </aside>

      {/* Top Bar */}
      <header className={`topbar ${!sidebarOpen ? "collapsed" : ""}`}>
        <div className="topbar-left">
          <h2 className="page-title">
            {MENU_ITEMS.find((item) => isActive(item.href))?.label || "Dashboard"}
          </h2>
        </div>
        <div className="topbar-right">
          <div className="relative" ref={menuRef} style={{ position: "relative" }}>
            <button
              className="avatar"
              style={{ border: "none" }}
              title={adminUser?.name || "Superadmin"}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {getInitials(adminUser?.name || "Super Admin")}
            </button>

            {menuOpen && (
              <div className="avatar-menu" role="menu">
                <div className="avatar-menu-header">
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {adminUser?.name || "Superadmin"}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {adminUser?.email || ""}
                  </p>
                </div>
                <button className="avatar-menu-item" role="menuitem" onClick={handleLogout}>
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`main-content ${!sidebarOpen ? "collapsed" : ""}`}>
        {children}
      </main>
    </>
  );
}
