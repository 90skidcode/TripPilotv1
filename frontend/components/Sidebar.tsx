"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const NAV = [
  { icon: "📊", label: "Dashboard", href: "/dashboard", screen: "dashboard" },
  { icon: "📈", label: "Usage", href: "/usage", screen: null },
  { icon: "👤", label: "Customer Master", href: "/customers", screen: "leads" },
  { icon: "👥", label: "Master Leads", href: "/leads", screen: "leads" },
  { icon: "🤝", label: "B2B Partners", href: "/b2b-partners", screen: "leads" },
  { icon: "💬", label: "WhatsApp", href: "/whatsapp", screen: null },
  { icon: "🎨", label: "WA Studio", href: "/whatsapp-studio", screen: null },
  { icon: "📸", label: "Instagram", href: "/instagram", screen: null },
  {
    icon: "🏨", label: "Inventory", href: "/inventory", screen: "inventory",
    sub: [
      { label: "Hotel Inventory", href: "/inventory?tab=hotels", screen: "inventory" },
      { label: "Activity Inventory", href: "/inventory?tab=activities", screen: "inventory" },
    ],
  },
  {
    icon: "🛠️", label: "Tools", href: "/tools", screen: null,
    sub: [
      { label: "Itinerary Builder", href: "/itinerary", screen: "itinerary" },
      { label: "Hotel Voucher", href: "/vouchers", screen: "vouchers" },
      { label: "Generate Bill", href: "/invoice", screen: null },
    ],
  },
  { icon: "⚙️", label: "Settings", href: "/settings", screen: null },
];

function stageLabel(stage: string) {
  const map: Record<string, { label: string; cls: string }> = {
    fresh: { label: "Fresh Lead", cls: "badge-teal" },
    qualified_hot: { label: "Qualified Hot", cls: "badge-red" },
    qualified_warm: { label: "Qualified Warm", cls: "badge-orange" },
    won: { label: "Won", cls: "badge-green" },
    lost: { label: "Lost", cls: "badge-gray" },
    not_responding: { label: "Not Responding", cls: "badge-yellow" },
    disqualified: { label: "Disqualified", cls: "badge-gray" },
    future_prospect: { label: "Future Prospect", cls: "badge-blue" },
  };
  return map[stage] || { label: stage, cls: "badge-gray" };
}

function sourceLabel(source: string) {
  const icons: Record<string, string> = {
    whatsapp: "💬", instagram: "📸", website: "🌐",
    referral: "🤝", advertisement: "📢", manual: "✍️", email: "📧",
  };
  return icons[source] || "📌";
}

export { stageLabel, sourceLabel };

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasPermission, logout } = useAuth();
  const [openMenus, setOpenMenus] = useState<string[]>(["Master Leads", "Tools"]);

  function toggleMenu(label: string) {
    setOpenMenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function canView(item: any): boolean {
    if (!item.screen) return true;
    return hasPermission(item.screen, "read");
  }

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <aside className={`flex flex-col bg-[#313a46] text-[#ced4da] transition-all duration-300 relative z-20 ${collapsed ? "w-20" : "w-[260px]"}`}>
      {/* Brand Header */}
      <div className="flex items-center h-[70px] px-6 border-b border-white/10">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-white font-bold shrink-0 text-xl shadow-sm">P</div>
        {!collapsed && <span className="ml-3 font-bold text-xl tracking-wide text-white whitespace-nowrap overflow-hidden uppercase">TripPilot</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1 custom-scrollbar">
        {!collapsed && <div className="px-3 mb-2 text-xs font-semibold text-[#8391a2] uppercase tracking-wider">Navigation</div>}
        {NAV.map((item) => {
          if (!canView(item)) return null;

          const isActive = pathname.startsWith(item.href) && item.href !== "/";
          const isOpen = openMenus.includes(item.label);
          const visibleSubs = item.sub?.filter(canView) || [];

          return (
            <div key={item.label} className="mb-1">
              <div
                className={`flex items-center px-3 py-2.5 rounded transition-all group cursor-pointer ${isActive ? "text-white" : "hover:text-white"}`}
                onClick={() => {
                  if (item.sub && visibleSubs.length > 0) toggleMenu(item.label);
                  else if (!item.sub) router.push(item.href);
                }}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
              >
                <span className={`text-lg shrink-0 flex items-center justify-center w-6 transition-colors ${isActive ? "text-white" : "text-[#8391a2] group-hover:text-[#ced4da]"}`}>{item.icon}</span>
                {!collapsed && (
                  <>
                    <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden flex-1">{item.label}</span>
                    {visibleSubs.length > 0 && (
                      <span className="text-[10px] opacity-70 ml-auto transition-transform duration-200" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                    )}
                  </>
                )}
              </div>
              {visibleSubs.length > 0 && isOpen && !collapsed && (
                <div className="mt-1 ml-9 space-y-1">
                  {visibleSubs.map((sub) => {
                    const isSubActive = pathname + (typeof window !== "undefined" ? window.location.search : "") === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        className={`block py-2 text-[13.5px] transition-colors ${isSubActive ? "text-white font-semibold" : "text-[#8391a2] hover:text-white"}`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex items-center px-3 py-2.5 rounded cursor-pointer text-[#8391a2] hover:text-white transition-colors" onClick={handleLogout} id="nav-logout">
            <span className="text-lg shrink-0 flex items-center justify-center w-6">🚪</span>
            {!collapsed && <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden">Logout</span>}
          </div>
        </div>
      </nav>

      <button 
        className="absolute -right-3 top-24 flex items-center justify-center w-6 h-6 bg-primary text-white rounded-full shadow-md z-30 hover:bg-[#616be8] transition-colors"
        onClick={onToggle} 
        id="sidebar-toggle-btn" 
        title={collapsed ? "Expand" : "Collapse"}
      >
        {collapsed ? "→" : "←"}
      </button>
    </aside>
  );
}
