"use client";
import { useState, useEffect } from "react";

function getInitials(name: string) {
  return name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "U";
}

export default function Topbar({ collapsed, title }: { collapsed: boolean; title?: string }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("trippilot_user");
    if (u) setUser(JSON.parse(u));
  }, []);

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-[70px] px-6 lg:px-8 bg-card shadow-[0_0_35px_0_rgba(154,161,171,.15)] dark:shadow-none border-b border-border/50">
      <div className="flex items-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">{title || "Dashboard"}</h1>
      </div>
      <div className="flex items-center gap-4">
        <button className="p-2 text-slate-500 hover:text-primary transition-colors" id="topbar-search-btn" title="Global Search">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        </button>
        <button className="p-2 text-slate-500 hover:text-primary transition-colors relative" id="topbar-notification-btn" title="Notifications">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          <span className="absolute top-1 right-2 w-2 h-2 bg-destructive rounded-full border border-white"></span>
        </button>
        <div className="w-px h-8 bg-slate-200 mx-2"></div>
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary font-semibold text-sm cursor-pointer hover:bg-primary hover:text-white transition-colors" id="topbar-avatar" title={user?.name || "Profile"}>
          {getInitials(user?.name || "U")}
        </div>
      </div>
    </header>
  );
}
