"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";

interface MasterDataItem {
  id: number;
  category: string;
  key: string;
  label: string;
  description?: string;
  order: number;
  is_active: boolean;
}

export default function MasterDataPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [data, setData] = useState<MasterDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    key: "",
    label: "",
    description: "",
    order: 0,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    isOpen: boolean;
  } | null>(null);

  useEffect(() => {
    const token = SuperAdminAPI.getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadData();
    }
  }, [selectedCategory]);

  async function loadCategories() {
    try {
      const cats = await SuperAdminAPI.getMasterDataCategories();
      setCategories(cats || []);
      if ((cats || []).length > 0) {
        setSelectedCategory(cats[0]);
      }
    } catch (error) {
      showToast("Failed to load categories", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadData() {
    if (!selectedCategory) return;
    try {
      const result = await SuperAdminAPI.getMasterData(selectedCategory);
      setData(result || []);
    } catch (error) {
      showToast("Failed to load data", "error");
    }
  }

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type, isOpen: true });
    setTimeout(() => {
      setToast((current) => {
        if (current && current.message === message) {
          return { ...current, isOpen: false };
        }
        return current;
      });
    }, 4000);
  }

  function handleOpenCreate() {
    setEditingId(null);
    setFormData({
      category: selectedCategory || "",
      key: "",
      label: "",
      description: "",
      order: data.length,
    });
    setShowForm(true);
  }

  function handleOpenEdit(item: MasterDataItem) {
    setEditingId(item.id);
    setFormData({
      category: item.category,
      key: item.key,
      label: item.label,
      description: item.description || "",
      order: item.order,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.key || !formData.label) {
      showToast("Key and Label are required", "error");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await SuperAdminAPI.updateMasterData(editingId, {
          label: formData.label,
          description: formData.description || null,
          order: formData.order,
        });
        showToast("Master data updated successfully", "success");
      } else {
        await SuperAdminAPI.createMasterData({
          category: formData.category,
          key: formData.key,
          label: formData.label,
          description: formData.description || null,
          order: formData.order,
        });
        showToast("Master data created successfully", "success");
      }
      setShowForm(false);
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this item?")) return;

    setSaving(true);
    try {
      await SuperAdminAPI.deleteMasterData(id);
      showToast("Master data deleted successfully", "success");
      loadData();
    } catch (error: any) {
      showToast(error.message || "Failed to delete", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "28px", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px", color: "var(--text-secondary)" }}>
        <div style={{ fontSize: "16px", fontWeight: 600 }}>Loading master data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: "28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "8px", color: "var(--text-primary)" }}>
            Master Data
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
            Manage dropdown options and system-wide master data
          </p>
        </div>
        <Link href="/pricing-plans" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          ← Back to Pricing Plans
        </Link>
      </div>

      {/* Toast */}
      {toast && toast.isOpen && (
        <div
          style={{
            padding: "12px 16px",
            margin: "12px 0 20px 0",
            borderRadius: "8px",
            background: toast.type === "error" ? "#fee2e2" : "#dcfce7",
            color: toast.type === "error" ? "#991b1b" : "#166534",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Category Selector */}
      <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "10px 16px",
              borderRadius: "6px",
              border: selectedCategory === cat ? "2px solid var(--brand)" : "1px solid var(--border)",
              background: selectedCategory === cat ? "var(--brand)" : "white",
              color: selectedCategory === cat ? "white" : "var(--text-primary)",
              cursor: "pointer",
              fontWeight: 500,
              fontSize: "13px",
              transition: "all 0.2s ease",
            }}
          >
            {cat.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* Data Table */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.07)",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        {data.length === 0 ? (
          <div style={{ padding: "48px 20px", textAlign: "center", color: "var(--text-secondary)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
            <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>No data found</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              Create your first master data entry to get started.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", margin: 0 }}>
              <thead>
                <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Key
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Label
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "left", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Description
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "center", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Order
                  </th>
                  <th style={{ padding: "16px 20px", textAlign: "right", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      transition: "background 0.2s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-hover)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "16px 20px", fontWeight: 600, color: "var(--text-primary)", fontFamily: "monospace", fontSize: "12px" }}>
                      {item.key}
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--text-primary)" }}>
                      {item.label}
                    </td>
                    <td style={{ padding: "16px 20px", color: "var(--text-secondary)", fontSize: "13px" }}>
                      {item.description || "—"}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                      {item.order}
                    </td>
                    <td style={{ padding: "16px 20px", textAlign: "right", display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        style={{
                          padding: "6px 12px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        style={{
                          padding: "6px 12px",
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "12px",
                          fontWeight: 500,
                        }}
                        disabled={saving}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
          onClick={() => !saving && setShowForm(false)}
        >
          <div
            style={{
              background: "white",
              borderRadius: "12px",
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 20px 60px rgba(15, 23, 42, 0.2)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                {editingId ? "Edit Master Data" : "Create Master Data"}
              </h2>
              <button
                onClick={() => !saving && setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "24px",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  disabled
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: "#f1f5f9",
                    color: "#64748b",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Key {!editingId && <span style={{ color: "red" }}>*</span>}
                </label>
                <input
                  type="text"
                  value={formData.key}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  disabled={!!editingId}
                  placeholder="e.g., cash, upi, won"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    background: editingId ? "#f1f5f9" : "white",
                    color: editingId ? "#64748b" : "black",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Label <span style={{ color: "red" }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="e.g., Cash Payment"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                    minHeight: "60px",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "6px",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#e2e8f0",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "10px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "13px",
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={handleOpenCreate}
          style={{
            padding: "12px 20px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "14px",
          }}
        >
          + Add Master Data
        </button>
      )}
    </div>
  );
}
