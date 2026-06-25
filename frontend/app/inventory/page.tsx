"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { inventoryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { useDebounce } from "@/hooks/useDebounce";
import SidePanel from "@/components/SidePanel";
import { Trash2, Plus, X } from "lucide-react";

const BRAND = "#2D9B7A";

const MEAL_PLANS = [
  { value: "EP", label: "EP – Room Only" },
  { value: "CP", label: "CP – Breakfast" },
  { value: "MAP", label: "MAP – Breakfast & Dinner" },
  { value: "AP", label: "AP – All Meals" },
  { value: "AI", label: "AI – All Inclusive" },
];

const EMPTY_CATEGORY = { room_category_name: "", meal_plan: "EP", selling_price_weekday: "", selling_price_weekend: "" };
const EMPTY_ACTIVITY_ITEM = { activity_name: "", activity_type: "", duration: "", selling_price_adult: "", selling_price_child: "" };

type RoomCategory = {
  room_category_name: string;
  meal_plan: string;
  selling_price_weekday: string | number;
  selling_price_weekend: string | number;
};

type ActivityItemRow = {
  activity_name: string;
  activity_type: string;
  duration: string;
  selling_price_adult: string | number;
  selling_price_child: string | number;
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6, display: "block",
};

function InventoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const canWrite = hasPermission("inventory", "write");
  const initialTab = searchParams.get("tab") === "activities" ? "activities" : "hotels";

  const [activeTab, setActiveTab] = useState<"hotels" | "activities">(initialTab);
  const [hotels, setHotels] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery);

  const [hotelPage, setHotelPage] = useState(1);
  const [hotelTotal, setHotelTotal] = useState(0);
  const [hotelPages, setHotelPages] = useState(1);
  const [actPage, setActPage] = useState(1);
  const [actTotal, setActTotal] = useState(0);
  const [actPages, setActPages] = useState(1);

  const [showDrawer, setShowDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Hotel form
  const [hotelForm, setHotelForm] = useState({
    hotel_name: "", city: "", country: "", star_rating: 3, supplier_name: "",
  });
  const [roomCategories, setRoomCategories] = useState<RoomCategory[]>([{ ...EMPTY_CATEGORY }]);

  // Activity form
  const [activityForm, setActivityForm] = useState({ vendor_name: "", city: "", country: "", supplier_name: "" });
  const [activityItems, setActivityItems] = useState<ActivityItemRow[]>([{ ...EMPTY_ACTIVITY_ITEM }]);

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setHotels([]);
    setActivities([]);
    try {
      if (activeTab === "hotels") {
        const params: any = { page: hotelPage, per_page: 10 };
        if (debouncedSearch) params.search = debouncedSearch;
        const data = await inventoryApi.hotels(params);
        setHotels(data.items || []);
        setHotelTotal(data.total || 0);
        setHotelPages(data.pages || 1);
      } else {
        const params: any = { page: actPage, per_page: 10 };
        if (debouncedSearch) params.search = debouncedSearch;
        const data = await inventoryApi.activities(params);
        setActivities(data.items || []);
        setActTotal(data.total || 0);
        setActPages(data.pages || 1);
      }
    } catch (err: any) {
      showToast({ type: "error", message: `✕ Failed to load inventory: ${err.message}`, duration: 4000 });
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, hotelPage, actPage, showToast]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  useEffect(() => {
    const tabParam = searchParams.get("tab") === "activities" ? "activities" : "hotels";
    setActiveTab(tabParam);
  }, [searchParams]);

  function handleTabChange(tab: "hotels" | "activities") {
    setActiveTab(tab);
    setSearchQuery("");
    setHotelPage(1);
    setActPage(1);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`${window.location.pathname}?${params.toString()}`);
  }

  function openAddDrawer() {
    if (!canWrite) return;
    setEditingItem(null);
    setHotelForm({ hotel_name: "", city: "", country: "", star_rating: 3, supplier_name: "" });
    setRoomCategories([{ ...EMPTY_CATEGORY }]);
    setActivityForm({ vendor_name: "", city: "", country: "", supplier_name: "" });
    setActivityItems([{ ...EMPTY_ACTIVITY_ITEM }]);
    setShowDrawer(true);
  }

  function openEditDrawer(item: any) {
    if (!canWrite) return;
    setEditingItem(item);
    if (activeTab === "hotels") {
      setHotelForm({
        hotel_name: item.hotel_name || "", city: item.city || "", country: item.country || "",
        star_rating: item.star_rating || 3, supplier_name: item.supplier_name || "",
      });
      setRoomCategories(
        item.room_categories?.length
          ? item.room_categories.map((rc: any) => ({
              room_category_name: rc.room_category_name || "",
              meal_plan: rc.meal_plan || "EP",
              selling_price_weekday: rc.selling_price_weekday ?? "",
              selling_price_weekend: rc.selling_price_weekend ?? "",
            }))
          : [{ ...EMPTY_CATEGORY }]
      );
    } else {
      setActivityForm({
        vendor_name: item.vendor_name || "", city: item.city || "",
        country: item.country || "", supplier_name: item.supplier_name || "",
      });
      setActivityItems(
        item.activity_items?.length
          ? item.activity_items.map((ai: any) => ({
              activity_name: ai.activity_name || "",
              activity_type: ai.activity_type || "",
              duration: ai.duration || "",
              selling_price_adult: ai.selling_price_adult ?? "",
              selling_price_child: ai.selling_price_child ?? "",
            }))
          : [{ ...EMPTY_ACTIVITY_ITEM }]
      );
    }
    setShowDrawer(true);
  }

  async function handleDelete(id: number) {
    if (!canWrite || !confirm("Are you sure you want to delete this inventory item?")) return;
    try {
      if (activeTab === "hotels") await inventoryApi.deleteHotel(id);
      else await inventoryApi.deleteActivity(id);
      showToast({ type: "success", message: "✓ Item deleted successfully", duration: 3000 });
      fetchInventory();
    } catch (err: any) {
      showToast({ type: "error", message: `✕ Failed to delete: ${err.message}`, duration: 4000 });
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    try {
      if (activeTab === "hotels") {
        if (!hotelForm.hotel_name || !hotelForm.city || !hotelForm.country)
          throw new Error("Hotel Name, City, and Country are required.");
        const validCats = roomCategories.filter(rc => rc.room_category_name.trim());
        const payload = {
          ...hotelForm,
          room_categories: validCats.map(rc => ({
            room_category_name: rc.room_category_name,
            meal_plan: rc.meal_plan || null,
            selling_price_weekday: rc.selling_price_weekday !== "" ? Number(rc.selling_price_weekday) : null,
            selling_price_weekend: rc.selling_price_weekend !== "" ? Number(rc.selling_price_weekend) : null,
          })),
        };
        if (editingItem) await inventoryApi.updateHotel(editingItem.id, payload);
        else await inventoryApi.createHotel(payload);
      } else {
        if (!activityForm.vendor_name || !activityForm.city || !activityForm.country)
          throw new Error("Vendor Name, City, and Country are required.");
        const validItems = activityItems.filter(ai => ai.activity_name.trim());
        const payload = {
          ...activityForm,
          activity_items: validItems.map(ai => ({
            activity_name: ai.activity_name,
            activity_type: ai.activity_type || null,
            duration: ai.duration || null,
            selling_price_adult: ai.selling_price_adult !== "" ? Number(ai.selling_price_adult) : null,
            selling_price_child: ai.selling_price_child !== "" ? Number(ai.selling_price_child) : null,
          })),
        };
        if (editingItem) await inventoryApi.updateActivity(editingItem.id, payload);
        else await inventoryApi.createActivity(payload);
      }
      showToast({ type: "success", message: `✓ Item ${editingItem ? "updated" : "created"} successfully`, duration: 3000 });
      setShowDrawer(false);
      fetchInventory();
    } catch (err: any) {
      showToast({ type: "error", message: `✕ Save failed: ${err.message}`, duration: 4000 });
    } finally {
      setSaving(false);
    }
  }

  function addCategory() {
    setRoomCategories(prev => [...prev, { ...EMPTY_CATEGORY }]);
  }

  function removeCategory(idx: number) {
    setRoomCategories(prev => prev.filter((_, i) => i !== idx));
  }

  function updateCategory(idx: number, field: keyof RoomCategory, value: string) {
    setRoomCategories(prev => prev.map((rc, i) => i === idx ? { ...rc, [field]: value } : rc));
  }

  function addActivityItem() {
    setActivityItems(prev => [...prev, { ...EMPTY_ACTIVITY_ITEM }]);
  }

  function removeActivityItem(idx: number) {
    setActivityItems(prev => prev.filter((_, i) => i !== idx));
  }

  function updateActivityItem(idx: number, field: keyof ActivityItemRow, value: string) {
    setActivityItems(prev => prev.map((ai, i) => i === idx ? { ...ai, [field]: value } : ai));
  }

  return (
    <AppShell title="Inventory Manager">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ margin: 0 }}>Inventory Manager</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ margin: 0 }}>Maintain catalog of standard supplier rates, hotels, and activities</p>
        </div>
        {canWrite && (
          <button onClick={openAddDrawer} className="btn btn-primary" style={{ background: BRAND, color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer" }}>
            ＋ Add {activeTab === "hotels" ? "Hotel" : "Activity"}
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-border mb-5">
        {([
          { id: "hotels", label: "Hotel Inventory", icon: "🏨" },
          { id: "activities", label: "Activity Inventory", icon: "🎯" },
        ] as const).map((t) => (
          <button
            key={t.id}
            onClick={() => handleTabChange(t.id)}
            className={[
              "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="toolbar" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 360, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder={`Search ${activeTab === "hotels" ? "hotels" : "activities"} by name...`}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); if (activeTab === "hotels") setHotelPage(1); else setActPage(1); }}
          />
        </div>
        <button className="btn btn-outline" onClick={fetchInventory}>Refresh</button>
      </div>

      <div className="card p-0 overflow-hidden" style={{ background: "white", borderRadius: "12px", border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading catalog items...</div>
        ) : activeTab === "hotels" ? (
          hotels.length === 0 ? (
            <div className="p-16 text-center">
              <div style={{ fontSize: 52, marginBottom: 12 }}>🏨</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Hotels in Catalog</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">Add your standard hotel supply rates, room types, and weekend markups for fast itinerary building.</p>
              {canWrite && <button className="btn btn-primary btn-sm" onClick={openAddDrawer} style={{ background: BRAND, border: "none" }}>＋ Add First Hotel</button>}
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Hotel</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>City & Country</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Room Category</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Meal Plan</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Weekday (₹)</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Weekend (₹)</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Supplier</th>
                    {canWrite && <th className="text-xs font-bold text-gray-500 uppercase text-right" style={{ padding: 14, textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {hotels.map((h, hi) => {
                    const cats = h.room_categories || [];
                    const rowCount = Math.max(cats.length, 1);
                    return cats.length === 0 ? (
                      <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50 transition-colors">
                        <td rowSpan={1} style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>
                          <div className="font-bold" style={{ color: BRAND }}>{h.hotel_name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{"★".repeat(h.star_rating || 0)}</div>
                        </td>
                        <td style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>{h.city}, {h.country}</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, fontSize: 13, color: "#6b7280", verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>{h.supplier_name || "—"}</td>
                        {canWrite && (
                          <td style={{ padding: 14, textAlign: "right", verticalAlign: "top" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button onClick={() => openEditDrawer(h)} className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50" style={{ cursor: "pointer" }}>✏️ Edit</button>
                              <button onClick={() => handleDelete(h.id)} className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" style={{ cursor: "pointer" }}>🗑️</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ) : cats.map((rc: any, ci: number) => (
                      <tr key={`${h.id}-${ci}`} style={{ borderBottom: ci === cats.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9", background: ci % 2 === 1 ? "#fafbfc" : "white" }} className="hover:bg-blue-50/30 transition-colors">
                        {ci === 0 && (
                          <>
                            <td rowSpan={rowCount} style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>
                              <div className="font-bold" style={{ color: BRAND }}>{h.hotel_name}</div>
                              <div className="text-xs text-gray-400 mt-0.5">{"★".repeat(h.star_rating || 0)}</div>
                            </td>
                            <td rowSpan={rowCount} style={{ padding: 14, fontSize: 13, color: "#374151", verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>{h.city}, {h.country}</td>
                          </>
                        )}
                        <td style={{ padding: "10px 14px" }}>
                          <span className="font-semibold text-gray-800 text-sm">{rc.room_category_name}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span className="inline-block rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs font-semibold border border-blue-100">
                            {rc.meal_plan || "—"}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827", fontSize: 13 }}>
                          {rc.selling_price_weekday != null ? `₹${Number(rc.selling_price_weekday).toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827", fontSize: 13 }}>
                          {rc.selling_price_weekend != null ? `₹${Number(rc.selling_price_weekend).toLocaleString()}` : "—"}
                        </td>
                        {ci === 0 && (
                          <>
                            <td rowSpan={rowCount} style={{ padding: 14, fontSize: 13, color: "#6b7280", verticalAlign: "top", borderLeft: "1px solid #f1f5f9" }}>{h.supplier_name || "—"}</td>
                            {canWrite && (
                              <td rowSpan={rowCount} style={{ padding: 14, textAlign: "right", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => openEditDrawer(h)} className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50" style={{ cursor: "pointer" }}>✏️ Edit</button>
                                  <button onClick={() => handleDelete(h.id)} className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" style={{ cursor: "pointer" }}>🗑️</button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
              {hotelPages > 1 && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Page {hotelPage} of {hotelPages} • {hotelTotal} hotels</span>
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setHotelPage(1)} disabled={hotelPage === 1}>«</button>
                    <button className="page-btn" onClick={() => setHotelPage(p => Math.max(1, p - 1))} disabled={hotelPage === 1}>‹</button>
                    <span className="page-info">{hotelPage} / {hotelPages}</span>
                    <button className="page-btn" onClick={() => setHotelPage(p => Math.min(hotelPages, p + 1))} disabled={hotelPage === hotelPages}>›</button>
                    <button className="page-btn" onClick={() => setHotelPage(hotelPages)} disabled={hotelPage === hotelPages}>»</button>
                  </div>
                </div>
              )}
            </>
          )
        ) : (
          activities.length === 0 ? (
            <div className="p-16 text-center">
              <div style={{ fontSize: 52, marginBottom: 12 }}>🎯</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Activities in Catalog</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-4">Store sightseeing, transfers, excursions, and ticketing rates for accurate pricing.</p>
              {canWrite && <button className="btn btn-primary btn-sm" onClick={openAddDrawer} style={{ background: BRAND, border: "none" }}>＋ Add First Activity</button>}
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Vendor</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>City & Country</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Activity Name</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Type</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Duration</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Adult (₹)</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Child (₹)</th>
                    <th className="text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Supplier</th>
                    {canWrite && <th className="text-xs font-bold text-gray-500 uppercase text-right" style={{ padding: 14, textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {activities.map((a) => {
                    const items = a.activity_items || [];
                    const rowCount = Math.max(items.length, 1);
                    return items.length === 0 ? (
                      <tr key={a.id} style={{ borderBottom: "1px solid #f1f5f9" }} className="hover:bg-slate-50 transition-colors">
                        <td rowSpan={1} style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>
                          <div className="font-bold" style={{ color: BRAND }}>{a.vendor_name}</div>
                        </td>
                        <td style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9", fontSize: 13, color: "#374151" }}>{a.city}, {a.country}</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, color: "#9ca3af", fontSize: 13 }}>—</td>
                        <td style={{ padding: 14, fontSize: 13, color: "#6b7280", verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>{a.supplier_name || "—"}</td>
                        {canWrite && (
                          <td style={{ padding: 14, textAlign: "right", verticalAlign: "top" }}>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button onClick={() => openEditDrawer(a)} className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50" style={{ cursor: "pointer" }}>✏️ Edit</button>
                              <button onClick={() => handleDelete(a.id)} className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" style={{ cursor: "pointer" }}>🗑️</button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ) : items.map((ai: any, ii: number) => (
                      <tr key={`${a.id}-${ii}`} style={{ borderBottom: ii === items.length - 1 ? "2px solid #e2e8f0" : "1px solid #f1f5f9", background: ii % 2 === 1 ? "#fafbfc" : "white" }} className="hover:bg-blue-50/30 transition-colors">
                        {ii === 0 && (
                          <>
                            <td rowSpan={rowCount} style={{ padding: 14, verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>
                              <div className="font-bold" style={{ color: BRAND }}>{a.vendor_name}</div>
                            </td>
                            <td rowSpan={rowCount} style={{ padding: 14, fontSize: 13, color: "#374151", verticalAlign: "top", borderRight: "1px solid #f1f5f9" }}>{a.city}, {a.country}</td>
                          </>
                        )}
                        <td style={{ padding: "10px 14px" }}>
                          <span className="font-semibold text-gray-800 text-sm">{ai.activity_name}</span>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          {ai.activity_type ? (
                            <span className="inline-block rounded-full bg-purple-50 text-purple-700 px-2 py-0.5 text-xs font-semibold border border-purple-100">{ai.activity_type}</span>
                          ) : <span className="text-gray-400 text-xs">—</span>}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 13, color: "#374151" }}>{ai.duration || "—"}</td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827", fontSize: 13 }}>
                          {ai.selling_price_adult != null ? `₹${Number(ai.selling_price_adult).toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: 600, color: "#111827", fontSize: 13 }}>
                          {ai.selling_price_child != null ? `₹${Number(ai.selling_price_child).toLocaleString()}` : "—"}
                        </td>
                        {ii === 0 && (
                          <>
                            <td rowSpan={rowCount} style={{ padding: 14, fontSize: 13, color: "#6b7280", verticalAlign: "top", borderLeft: "1px solid #f1f5f9" }}>{a.supplier_name || "—"}</td>
                            {canWrite && (
                              <td rowSpan={rowCount} style={{ padding: 14, textAlign: "right", verticalAlign: "top" }}>
                                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                                  <button onClick={() => openEditDrawer(a)} className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50" style={{ cursor: "pointer" }}>✏️ Edit</button>
                                  <button onClick={() => handleDelete(a.id)} className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100" style={{ cursor: "pointer" }}>🗑️</button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ));
                  })}
                </tbody>
              </table>
              {actPages > 1 && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Page {actPage} of {actPages} • {actTotal} activities</span>
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setActPage(1)} disabled={actPage === 1}>«</button>
                    <button className="page-btn" onClick={() => setActPage(p => Math.max(1, p - 1))} disabled={actPage === 1}>‹</button>
                    <span className="page-info">{actPage} / {actPages}</span>
                    <button className="page-btn" onClick={() => setActPage(p => Math.min(actPages, p + 1))} disabled={actPage === actPages}>›</button>
                    <button className="page-btn" onClick={() => setActPage(actPages)} disabled={actPage === actPages}>»</button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Drawer */}
      {showDrawer && (
        <SidePanel
          title={`${editingItem ? "Edit" : "Add"} ${activeTab === "hotels" ? "Hotel" : "Activity"}`}
          subtitle={editingItem ? "Update catalog resource rates" : "Add standard catalog item details"}
          onClose={() => setShowDrawer(false)}
          onSave={handleSave}
          saveLabel={editingItem ? "Update" : "Save"}
          saving={saving}
        >
            <form onSubmit={handleSave}>
              <div style={{ padding: 24 }}>
                {activeTab === "hotels" ? (
                  <div style={{ display: "grid", gap: 16 }}>
                    {/* Hotel Header */}
                    <div>
                      <label style={labelStyle}>Hotel Name <span style={{ color: "red" }}>*</span></label>
                      <input className="input" required value={hotelForm.hotel_name} onChange={(e) => setHotelForm({ ...hotelForm, hotel_name: e.target.value })} placeholder="e.g. Radisson Blu" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City <span style={{ color: "red" }}>*</span></label>
                        <input className="input" required value={hotelForm.city} onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })} placeholder="e.g. Goa" />
                      </div>
                      <div>
                        <label style={labelStyle}>Country <span style={{ color: "red" }}>*</span></label>
                        <input className="input" required value={hotelForm.country} onChange={(e) => setHotelForm({ ...hotelForm, country: e.target.value })} placeholder="e.g. India" />
                      </div>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Star Rating</label>
                        <select className="input" value={hotelForm.star_rating} onChange={(e) => setHotelForm({ ...hotelForm, star_rating: Number(e.target.value) })}>
                          {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Star</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Supplier Name</label>
                        <input className="input" value={hotelForm.supplier_name} onChange={(e) => setHotelForm({ ...hotelForm, supplier_name: e.target.value })} placeholder="e.g. TBO Holidays" />
                      </div>
                    </div>

                    {/* Room Categories */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ ...labelStyle, marginBottom: 0, fontSize: 13 }}>Room Categories</label>
                        <button type="button" onClick={addCategory} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: BRAND, background: "transparent", border: `1px solid ${BRAND}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                          <Plus size={13} /> Add Category
                        </button>
                      </div>

                      {/* Header row */}
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 32px", gap: 8, marginBottom: 6, padding: "0 4px" }}>
                        {["Room Category", "Meal Plan", "Weekday ₹", "Weekend ₹", ""].map((h, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {roomCategories.map((rc, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.4fr 1fr 1fr 32px", gap: 8, alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                            <input
                              className="input"
                              style={{ fontSize: 13 }}
                              placeholder="e.g. Deluxe Room"
                              value={rc.room_category_name}
                              onChange={(e) => updateCategory(idx, "room_category_name", e.target.value)}
                            />
                            <select
                              className="input"
                              style={{ fontSize: 13 }}
                              value={rc.meal_plan}
                              onChange={(e) => updateCategory(idx, "meal_plan", e.target.value)}
                            >
                              {MEAL_PLANS.map(mp => <option key={mp.value} value={mp.value}>{mp.label}</option>)}
                            </select>
                            <input
                              className="input"
                              type="number"
                              style={{ fontSize: 13 }}
                              placeholder="0"
                              value={rc.selling_price_weekday}
                              onChange={(e) => updateCategory(idx, "selling_price_weekday", e.target.value)}
                            />
                            <input
                              className="input"
                              type="number"
                              style={{ fontSize: 13 }}
                              placeholder="0"
                              value={rc.selling_price_weekend}
                              onChange={(e) => updateCategory(idx, "selling_price_weekend", e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => removeCategory(idx)}
                              disabled={roomCategories.length === 1}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: roomCategories.length === 1 ? "#d1d5db" : "#ef4444", background: "transparent", border: "none", cursor: roomCategories.length === 1 ? "not-allowed" : "pointer", borderRadius: 4, padding: 4 }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {/* Vendor Header */}
                    <div>
                      <label style={labelStyle}>Vendor / Operator Name <span style={{ color: "red" }}>*</span></label>
                      <input className="input" required value={activityForm.vendor_name} onChange={(e) => setActivityForm({ ...activityForm, vendor_name: e.target.value })} placeholder="e.g. Klook Experiences" />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City <span style={{ color: "red" }}>*</span></label>
                        <input className="input" required value={activityForm.city} onChange={(e) => setActivityForm({ ...activityForm, city: e.target.value })} placeholder="e.g. Bali" />
                      </div>
                      <div>
                        <label style={labelStyle}>Country <span style={{ color: "red" }}>*</span></label>
                        <input className="input" required value={activityForm.country} onChange={(e) => setActivityForm({ ...activityForm, country: e.target.value })} placeholder="e.g. Indonesia" />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Supplier Name</label>
                      <input className="input" value={activityForm.supplier_name} onChange={(e) => setActivityForm({ ...activityForm, supplier_name: e.target.value })} placeholder="e.g. Klook" />
                    </div>

                    {/* Activity Items */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <label style={{ ...labelStyle, marginBottom: 0, fontSize: 13 }}>Activities</label>
                        <button type="button" onClick={addActivityItem} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: BRAND, background: "transparent", border: `1px solid ${BRAND}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                          <Plus size={13} /> Add Activity
                        </button>
                      </div>

                      {/* Header row */}
                      <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 32px", gap: 8, marginBottom: 6, padding: "0 4px" }}>
                        {["Activity Name", "Type", "Duration", "Adult ₹", "Child ₹", ""].map((h, i) => (
                          <span key={i} style={{ fontSize: 10, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</span>
                        ))}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {activityItems.map((ai, idx) => (
                          <div key={idx} style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 0.8fr 0.8fr 0.8fr 32px", gap: 8, alignItems: "center", background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                            <input
                              className="input"
                              style={{ fontSize: 13 }}
                              placeholder="e.g. Scuba Diving"
                              value={ai.activity_name}
                              onChange={(e) => updateActivityItem(idx, "activity_name", e.target.value)}
                            />
                            <input
                              className="input"
                              style={{ fontSize: 13 }}
                              placeholder="e.g. Water Sports"
                              value={ai.activity_type}
                              onChange={(e) => updateActivityItem(idx, "activity_type", e.target.value)}
                            />
                            <input
                              className="input"
                              style={{ fontSize: 13 }}
                              placeholder="e.g. 4 hrs"
                              value={ai.duration}
                              onChange={(e) => updateActivityItem(idx, "duration", e.target.value)}
                            />
                            <input
                              className="input"
                              type="number"
                              style={{ fontSize: 13 }}
                              placeholder="0"
                              value={ai.selling_price_adult}
                              onChange={(e) => updateActivityItem(idx, "selling_price_adult", e.target.value)}
                            />
                            <input
                              className="input"
                              type="number"
                              style={{ fontSize: 13 }}
                              placeholder="0"
                              value={ai.selling_price_child}
                              onChange={(e) => updateActivityItem(idx, "selling_price_child", e.target.value)}
                            />
                            <button
                              type="button"
                              onClick={() => removeActivityItem(idx)}
                              disabled={activityItems.length === 1}
                              style={{ display: "flex", alignItems: "center", justifyContent: "center", color: activityItems.length === 1 ? "#d1d5db" : "#ef4444", background: "transparent", border: "none", cursor: activityItems.length === 1 ? "not-allowed" : "pointer", borderRadius: 4, padding: 4 }}
                            >
                              <X size={15} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
        </SidePanel>
      )}
    </AppShell>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <AppShell title="Inventory Manager">
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>⏳ Loading Inventory Catalog…</div>
      </AppShell>
    }>
      <InventoryContent />
    </Suspense>
  );
}
