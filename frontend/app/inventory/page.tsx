"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { inventoryApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";

const BRAND = "#2D9B7A";

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

  const [hotelPage, setHotelPage] = useState(1);
  const [hotelTotal, setHotelTotal] = useState(0);
  const [hotelPages, setHotelPages] = useState(1);

  const [actPage, setActPage] = useState(1);
  const [actTotal, setActTotal] = useState(0);
  const [actPages, setActPages] = useState(1);
  
  // Drawer states
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form states - Hotel
  const [hotelForm, setHotelForm] = useState({
    hotel_name: "",
    city: "",
    country: "",
    star_rating: 3,
    room_category_name: "",
    meal_plan: "",
    selling_price_weekday: 0,
    selling_price_weekend: 0,
    supplier_name: "",
  });

  // Form states - Activity
  const [activityForm, setActivityForm] = useState({
    activity_name: "",
    city: "",
    country: "",
    duration: "",
    activity_type: "",
    selling_price_adult: 0,
    selling_price_child: 0,
    supplier_name: "",
  });

  // Fetch functions
  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "hotels") {
        const params: any = { page: hotelPage, per_page: 10 };
        if (searchQuery) params.search = searchQuery;
        const data = await inventoryApi.hotels(params);
        setHotels(data.items || []);
        setHotelTotal(data.total || 0);
        setHotelPages(data.pages || 1);
      } else {
        const params: any = { page: actPage, per_page: 10 };
        if (searchQuery) params.search = searchQuery;
        const data = await inventoryApi.activities(params);
        setActivities(data.items || []);
        setActTotal(data.total || 0);
        setActPages(data.pages || 1);
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        type: "error",
        message: `✕ Failed to load inventory: ${err.message}`,
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, hotelPage, actPage, showToast]);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Sync tab with URL search parameter changes
  useEffect(() => {
    const tabParam = searchParams.get("tab") === "activities" ? "activities" : "hotels";
    setActiveTab(tabParam);
  }, [searchParams]);

  const handleTabChange = (tab: "hotels" | "activities") => {
    setActiveTab(tab);
    setSearchQuery("");
    setHotelPage(1);
    setActPage(1);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  const openAddDrawer = () => {
    if (!canWrite) return;
    setEditingItem(null);
    setHotelForm({
      hotel_name: "",
      city: "",
      country: "",
      star_rating: 3,
      room_category_name: "",
      meal_plan: "",
      selling_price_weekday: 0,
      selling_price_weekend: 0,
      supplier_name: "",
    });
    setActivityForm({
      activity_name: "",
      city: "",
      country: "",
      duration: "",
      activity_type: "",
      selling_price_adult: 0,
      selling_price_child: 0,
      supplier_name: "",
    });
    setShowDrawer(true);
  };

  const openEditDrawer = (item: any) => {
    if (!canWrite) return;
    setEditingItem(item);
    if (activeTab === "hotels") {
      setHotelForm({
        hotel_name: item.hotel_name || "",
        city: item.city || "",
        country: item.country || "",
        star_rating: item.star_rating || 3,
        room_category_name: item.room_category_name || "",
        meal_plan: item.meal_plan || "",
        selling_price_weekday: item.selling_price_weekday || 0,
        selling_price_weekend: item.selling_price_weekend || 0,
        supplier_name: item.supplier_name || "",
      });
    } else {
      setActivityForm({
        activity_name: item.activity_name || "",
        city: item.city || "",
        country: item.country || "",
        duration: item.duration || "",
        activity_type: item.activity_type || "",
        selling_price_adult: item.selling_price_adult || 0,
        selling_price_child: item.selling_price_child || 0,
        supplier_name: item.supplier_name || "",
      });
    }
    setShowDrawer(true);
  };

  const handleDelete = async (id: number) => {
    if (!canWrite) return;
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    
    try {
      if (activeTab === "hotels") {
        await inventoryApi.deleteHotel(id);
      } else {
        await inventoryApi.deleteActivity(id);
      }
      showToast({
        type: "success",
        message: "✓ Item deleted successfully",
        duration: 3000,
      });
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      showToast({
        type: "error",
        message: `✕ Failed to delete item: ${err.message}`,
        duration: 4000,
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setSaving(true);

    try {
      if (activeTab === "hotels") {
        if (!hotelForm.hotel_name || !hotelForm.city || !hotelForm.country) {
          throw new Error("Hotel Name, City, and Country are required.");
        }
        if (editingItem) {
          await inventoryApi.updateHotel(editingItem.id, hotelForm);
        } else {
          await inventoryApi.createHotel(hotelForm);
        }
      } else {
        if (!activityForm.activity_name || !activityForm.city || !activityForm.country) {
          throw new Error("Activity Name, City, and Country are required.");
        }
        if (editingItem) {
          await inventoryApi.updateActivity(editingItem.id, activityForm);
        } else {
          await inventoryApi.createActivity(activityForm);
        }
      }

      showToast({
        type: "success",
        message: `✓ Item ${editingItem ? "updated" : "created"} successfully`,
        duration: 3000,
      });
      setShowDrawer(false);
      fetchInventory();
    } catch (err: any) {
      console.error(err);
      showToast({
        type: "error",
        message: `✕ Save failed: ${err.message}`,
        duration: 4000,
      });
    } finally {
      setSaving(false);
    }
  };

  const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: "#4b5563", marginBottom: 6, display: "block" };

  return (
    <AppShell title="Inventory Manager">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 className="text-2xl font-bold text-gray-900" style={{ margin: 0 }}>Inventory Manager</h1>
          <p className="text-sm text-gray-500 mt-1" style={{ margin: 0 }}>Maintain catalog of standard supplier rates, hotels, and activities</p>
        </div>
        {canWrite && (
          <button
            onClick={openAddDrawer}
            className="btn btn-primary"
            style={{ background: BRAND, color: "white", padding: "10px 20px", borderRadius: "8px", fontWeight: 600, border: "none", cursor: "pointer" }}
          >
            ＋ Add {activeTab === "hotels" ? "Hotel" : "Activity"}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn${activeTab === "hotels" ? " active" : ""}`}
          onClick={() => handleTabChange("hotels")}
          style={{ cursor: "pointer" }}
        >
          🏨 Hotel Inventory
        </button>
        <button
          className={`tab-btn${activeTab === "activities" ? " active" : ""}`}
          onClick={() => handleTabChange("activities")}
          style={{ cursor: "pointer" }}
        >
          🎯 Activity Inventory
        </button>
      </div>

      {/* Filter / Search bar */}
      <div className="toolbar" style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <div className="input-wrapper" style={{ flex: 1, maxWidth: 360, position: "relative" }}>
          <span className="input-icon" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }}>🔍</span>
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder={`Search ${activeTab === "hotels" ? "hotels" : "activities"} by name...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab === "hotels") {
                setHotelPage(1);
              } else {
                setActPage(1);
              }
            }}
          />
        </div>
        <button className="btn btn-outline" onClick={fetchInventory}>Refresh</button>
      </div>

      {/* Data Container */}
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
              <table className="w-full text-left border-collapse" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Hotel & Stars</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>City & Country</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Room & Meal Plan</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Weekday / Weekend Rates</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Supplier</th>
                    {canWrite && <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right" style={{ padding: 14, textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {hotels.map(h => (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="p-4" style={{ padding: 14 }}>
                        <div className="font-bold text-gray-900" style={{ color: BRAND, fontWeight: 700 }}>{h.hotel_name}</div>
                        <div className="text-xs text-gray-500 mt-1">{h.star_rating ? `★`.repeat(h.star_rating) : "N/A"}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-800" style={{ padding: 14 }}>
                        {h.city}, {h.country}
                      </td>
                      <td className="p-4" style={{ padding: 14 }}>
                        <div className="text-sm text-gray-800">{h.room_category_name || "Standard Room"}</div>
                        <div className="text-xs text-gray-500">{h.meal_plan || "EP (Room Only)"}</div>
                      </td>
                      <td className="p-4" style={{ padding: 14 }}>
                        <div className="text-sm font-semibold text-gray-800">
                          Weekday: ₹{h.selling_price_weekday?.toLocaleString() || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Weekend: ₹{h.selling_price_weekend?.toLocaleString() || "—"}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600" style={{ padding: 14 }}>
                        {h.supplier_name || "—"}
                      </td>
                      {canWrite && (
                        <td className="p-4 text-right" style={{ padding: 14, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => openEditDrawer(h)}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50"
                              style={{ cursor: "pointer" }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(h.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              style={{ cursor: "pointer" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {hotelPages > 1 && (
                <div style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "--brand": BRAND
                } as React.CSSProperties}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Showing <strong style={{ color: "var(--text-primary)" }}>Page {hotelPage} of {hotelPages}</strong> • {hotelTotal} total hotels
                  </span>
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setHotelPage(1)} disabled={hotelPage === 1}>«</button>
                    <button className="page-btn" onClick={() => setHotelPage(p => Math.max(1, p - 1))} disabled={hotelPage === 1}>‹</button>
                    <span className="page-info" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {hotelPage} / {hotelPages}
                    </span>
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
              <p className="text-gray-500 max-w-md mx-auto mb-4">Store sightseeing, airport transfers, excursions, and ticketing rates to estimate and build pricing accurately.</p>
              {canWrite && <button className="btn btn-primary btn-sm" onClick={openAddDrawer} style={{ background: BRAND, border: "none" }}>＋ Add First Activity</button>}
            </div>
          ) : (
            <>
              <table className="w-full text-left border-collapse" style={{ width: "100%" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Activity & Type</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>City & Country</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Duration</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Adult / Child Rates</th>
                    <th className="p-4 text-xs font-bold text-gray-500 uppercase" style={{ padding: 14 }}>Supplier</th>
                    {canWrite && <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right" style={{ padding: 14, textAlign: "right" }}>Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.map(a => (
                    <tr key={a.id} className="hover:bg-slate-50 transition-colors" style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="p-4" style={{ padding: 14 }}>
                        <div className="font-bold text-gray-900" style={{ color: BRAND, fontWeight: 700 }}>{a.activity_name}</div>
                        <div className="text-xs text-gray-500 mt-1">{a.activity_type || "Excursion"}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-800" style={{ padding: 14 }}>
                        {a.city}, {a.country}
                      </td>
                      <td className="p-4 text-sm text-gray-800" style={{ padding: 14 }}>
                        {a.duration || "N/A"}
                      </td>
                      <td className="p-4" style={{ padding: 14 }}>
                        <div className="text-sm font-semibold text-gray-800">
                          Adult: ₹{a.selling_price_adult?.toLocaleString() || "—"}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          Child: ₹{a.selling_price_child?.toLocaleString() || "—"}
                        </div>
                      </td>
                      <td className="p-4 text-sm text-gray-600" style={{ padding: 14 }}>
                        {a.supplier_name || "—"}
                      </td>
                      {canWrite && (
                        <td className="p-4 text-right" style={{ padding: 14, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button
                              onClick={() => openEditDrawer(a)}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-gray-300 hover:bg-gray-50"
                              style={{ cursor: "pointer" }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                              style={{ cursor: "pointer" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Pagination */}
              {actPages > 1 && (
                <div style={{
                  padding: "20px 24px",
                  borderTop: "1px solid var(--border)",
                  background: "var(--brand-light)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  "--brand": BRAND
                } as React.CSSProperties}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
                    Showing <strong style={{ color: "var(--text-primary)" }}>Page {actPage} of {actPages}</strong> • {actTotal} total activities
                  </span>
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setActPage(1)} disabled={actPage === 1}>«</button>
                    <button className="page-btn" onClick={() => setActPage(p => Math.max(1, p - 1))} disabled={actPage === 1}>‹</button>
                    <span className="page-info" style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                      {actPage} / {actPages}
                    </span>
                    <button className="page-btn" onClick={() => setActPage(p => Math.min(actPages, p + 1))} disabled={actPage === actPages}>›</button>
                    <button className="page-btn" onClick={() => setActPage(actPages)} disabled={actPage === actPages}>»</button>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </div>

      {/* Slide Drawer (Addition & Modification Form) */}
      {showDrawer && (
        <div className="drawer-overlay" onClick={() => setShowDrawer(false)}>
          <div className="drawer" onClick={(e) => e.stopPropagation()} style={{ width: 440, padding: 0 }}>
            <div className="drawer-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "16px 24px", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#1e293b" }}>
                  {editingItem ? "Edit" : "Add"} {activeTab === "hotels" ? "Hotel" : "Activity"}
                </h3>
                <p style={{ fontSize: 12, color: "#64748b", margin: "4px 0 0" }}>
                  {editingItem ? "Update catalog resource rates" : "Add standard catalog item details"}
                </p>
              </div>
              <button onClick={() => setShowDrawer(false)} style={{ background: "transparent", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b" }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", height: "calc(100% - 66px)" }}>
              <div className="drawer-body" style={{ flex: 1, overflowY: "auto", padding: 24 }}>
                {activeTab === "hotels" ? (
                  // HOTEL FORM FIELDS
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Hotel Name <span style={{ color: "red" }}>*</span></label>
                      <input
                        className="input"
                        required
                        value={hotelForm.hotel_name}
                        onChange={(e) => setHotelForm({ ...hotelForm, hotel_name: e.target.value })}
                        placeholder="e.g. Radisson Blu"
                      />
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="input"
                          required
                          value={hotelForm.city}
                          onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                          placeholder="e.g. Goa"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Country <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="input"
                          required
                          value={hotelForm.country}
                          onChange={(e) => setHotelForm({ ...hotelForm, country: e.target.value })}
                          placeholder="e.g. India"
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Star Rating</label>
                        <select
                          className="input"
                          value={hotelForm.star_rating}
                          onChange={(e) => setHotelForm({ ...hotelForm, star_rating: Number(e.target.value) })}
                        >
                          <option value={1}>1 Star</option>
                          <option value={2}>2 Star</option>
                          <option value={3}>3 Star</option>
                          <option value={4}>4 Star</option>
                          <option value={5}>5 Star</option>
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Room Category</label>
                        <input
                          className="input"
                          value={hotelForm.room_category_name}
                          onChange={(e) => setHotelForm({ ...hotelForm, room_category_name: e.target.value })}
                          placeholder="e.g. Deluxe Room"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Meal Plan</label>
                      <input
                        className="input"
                        value={hotelForm.meal_plan}
                        onChange={(e) => setHotelForm({ ...hotelForm, meal_plan: e.target.value })}
                        placeholder="e.g. MAP (Breakfast & Dinner)"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Weekday Selling Price (₹)</label>
                        <input
                          className="input"
                          type="number"
                          value={hotelForm.selling_price_weekday || ""}
                          onChange={(e) => setHotelForm({ ...hotelForm, selling_price_weekday: Number(e.target.value) })}
                          placeholder="e.g. 4500"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Weekend Selling Price (₹)</label>
                        <input
                          className="input"
                          type="number"
                          value={hotelForm.selling_price_weekend || ""}
                          onChange={(e) => setHotelForm({ ...hotelForm, selling_price_weekend: Number(e.target.value) })}
                          placeholder="e.g. 5200"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Supplier Name</label>
                      <input
                        className="input"
                        value={hotelForm.supplier_name}
                        onChange={(e) => setHotelForm({ ...hotelForm, supplier_name: e.target.value })}
                        placeholder="e.g. TBO Holidays"
                      />
                    </div>
                  </div>
                ) : (
                  // ACTIVITY FORM FIELDS
                  <div style={{ display: "grid", gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Activity Name <span style={{ color: "red" }}>*</span></label>
                      <input
                        className="input"
                        required
                        value={activityForm.activity_name}
                        onChange={(e) => setActivityForm({ ...activityForm, activity_name: e.target.value })}
                        placeholder="e.g. Scuba Diving with Transfers"
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>City <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="input"
                          required
                          value={activityForm.city}
                          onChange={(e) => setActivityForm({ ...activityForm, city: e.target.value })}
                          placeholder="e.g. Bali"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Country <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="input"
                          required
                          value={activityForm.country}
                          onChange={(e) => setActivityForm({ ...activityForm, country: e.target.value })}
                          placeholder="e.g. Indonesia"
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Duration</label>
                        <input
                          className="input"
                          value={activityForm.duration}
                          onChange={(e) => setActivityForm({ ...activityForm, duration: e.target.value })}
                          placeholder="e.g. 4 Hours"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Activity Type</label>
                        <input
                          className="input"
                          value={activityForm.activity_type}
                          onChange={(e) => setActivityForm({ ...activityForm, activity_type: e.target.value })}
                          placeholder="e.g. Water Sports"
                        />
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={labelStyle}>Adult Selling Price (₹)</label>
                        <input
                          className="input"
                          type="number"
                          value={activityForm.selling_price_adult || ""}
                          onChange={(e) => setActivityForm({ ...activityForm, selling_price_adult: Number(e.target.value) })}
                          placeholder="e.g. 1800"
                        />
                      </div>
                      <div>
                        <label style={labelStyle}>Child Selling Price (₹)</label>
                        <input
                          className="input"
                          type="number"
                          value={activityForm.selling_price_child || ""}
                          onChange={(e) => setActivityForm({ ...activityForm, selling_price_child: Number(e.target.value) })}
                          placeholder="e.g. 1200"
                        />
                      </div>
                    </div>

                    <div>
                      <label style={labelStyle}>Supplier Name</label>
                      <input
                        className="input"
                        value={activityForm.supplier_name}
                        onChange={(e) => setActivityForm({ ...activityForm, supplier_name: e.target.value })}
                        placeholder="e.g. Klook"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="drawer-footer" style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowDrawer(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ background: BRAND, border: "none" }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
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
