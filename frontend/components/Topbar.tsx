"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, BarChart3, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Topbar({ title }: { collapsed: boolean; title?: string }) {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const u = localStorage.getItem("trippilot_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  // Close the profile menu when clicking outside of it
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-6 lg:px-8 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title || "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          id="topbar-search-btn"
          title="Global Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          id="topbar-notification-btn"
          title="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border border-background"></span>
        </button>
        <div className="w-px h-6 bg-border mx-1"></div>

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            id="topbar-avatar"
            title={user?.name || "Profile"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {getInitials(user?.name || "U")}
          </button>

          {menuOpen && (
            <div
              className="absolute right-0 mt-2 w-60 rounded-md border border-border bg-background shadow-lg z-20 py-1"
              role="menu"
            >
              {/* User header */}
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                )}
              </div>

              {/* Usage */}
              <Link
                href="/usage"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                Usage
              </Link>

              {/* Logout */}
              <button
                role="menuitem"
                className="flex w-full items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
