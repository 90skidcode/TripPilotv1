"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, BarChart3, LogOut, MapPin, Clock, AlertCircle, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { followupsApi } from "@/lib/api";

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((today.getTime() - date.getTime()) / 86400000);

  if (diffDays === 0) return "Today " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Topbar({ title }: Readonly<{ collapsed: boolean; title?: string }>) {
  const [user, setUser] = useState<any>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [notifLoading, setNotifLoading] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    const u = localStorage.getItem("trippilot_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifLoading(true);
    try {
      const data = await followupsApi.getNotifications();
      setNotifications(data.items || []);
    } catch {
      // silently fail — notifications are non-critical
    } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000); // refresh every 5 min
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setMenuOpen(false);
    logout();
    router.push("/login");
  }

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  const overdueCount = visible.filter((n) => n.kind === "overdue").length;
  const todayCount = visible.filter((n) => n.kind === "today").length;
  const totalCount = visible.length;

  function dismissOne(id: number) {
    setDismissed((prev) => new Set([...prev, id]));
  }

  function dismissAll() {
    setDismissed(new Set(notifications.map((n) => n.id)));
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-6 lg:px-8 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title || "Dashboard"}</h1>
      </div>

      <div className="flex items-center gap-4">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Global Search"
        >
          <Search className="h-5 w-5" />
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Notifications"
            onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) fetchNotifications(); }}
          >
            <Bell className="h-5 w-5" />
            {totalCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-background leading-none">
                {totalCount > 99 ? "99+" : String(totalCount)}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-border bg-background shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
                <div>
                  <p className="text-sm font-bold text-foreground">Notifications</p>
                  {totalCount > 0 && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {overdueCount > 0 && <span className="text-red-600 font-semibold">{overdueCount} overdue</span>}
                      {overdueCount > 0 && todayCount > 0 && " · "}
                      {todayCount > 0 && <span className="text-amber-600 font-semibold">{todayCount} today</span>}
                    </p>
                  )}
                </div>
                {totalCount > 0 && (
                  <button
                    onClick={dismissAll}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Clear all
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifLoading && notifications.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">Loading…</div>
                ) : visible.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">No pending follow-ups for today.</p>
                  </div>
                ) : (
                  <ul>
                    {visible.map((n) => (
                      <li key={n.id} className="group border-b border-border last:border-0">
                        <div className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                          {/* Icon */}
                          {(() => {
                            const isOverdue = n.kind === "overdue";
                            return (
                              <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${isOverdue ? "bg-red-100" : "bg-amber-100"}`}>
                                {isOverdue
                                  ? <AlertCircle className="h-3.5 w-3.5 text-red-600" />
                                  : <Clock className="h-3.5 w-3.5 text-amber-600" />
                                }
                              </div>
                            );
                          })()}

                          {/* Content */}
                          <Link
                            href={`/leads/${n.lead_id}`}
                            className="flex-1 min-w-0"
                            onClick={() => setNotifOpen(false)}
                          >
                            <p className="text-sm font-semibold text-foreground truncate">{n.customer_name}</p>
                            {n.destination && (
                              <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{n.destination}</span>
                              </p>
                            )}
                            {n.notes && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.notes}</p>
                            )}
                            <p className={`text-[11px] font-medium mt-1 ${
                              n.kind === "overdue" ? "text-red-600" : "text-amber-600"
                            }`}>
                              {n.kind === "overdue" ? "⚠ Overdue · " : "🕐 Due · "}{formatDate(n.scheduled_date)}
                            </p>
                          </Link>

                          {/* Dismiss */}
                          <button
                            onClick={() => dismissOne(n.id)}
                            className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-muted-foreground hover:text-foreground transition-all text-lg leading-none mt-0.5"
                            title="Dismiss"
                          >
                            ×
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer */}
              {visible.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border bg-muted/20">
                  <Link
                    href="/leads?filter=followup"
                    className="text-xs font-semibold text-primary hover:underline"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all leads with follow-ups →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Profile menu */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            title={user?.name || "Profile"}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {getInitials(user?.name || "U")}
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-md border border-border bg-background shadow-lg z-20 py-1" role="menu">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name || "User"}</p>
                {user?.email && <p className="text-xs text-muted-foreground truncate">{user.email}</p>}
              </div>
              <Link
                href="/usage"
                role="menuitem"
                className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4 shrink-0" />
                Usage
              </Link>
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
