"use client";
import { useState, useEffect } from "react";
import { Search, Bell } from "lucide-react";

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Topbar({ title }: { collapsed: boolean; title?: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("trippilot_user");
    if (u) setUser(JSON.parse(u));
  }, []);

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
        <div 
          className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-xs font-semibold cursor-pointer hover:opacity-90 transition-opacity" 
          id="topbar-avatar" 
          title={user?.name || "Profile"}
        >
          {getInitials(user?.name || "U")}
        </div>
      </div>
    </header>
  );
}
