"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SuperAdminAPI } from "@/lib/api";
import { DataTable, DataTableColumn } from "@/components/DataTable";
import { usePagination } from "@/components/DataTable/usePagination";
import { Edit2, Trash2 } from "lucide-react";

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
  const { pagination, handlers } = usePagination(0);
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
      {(() => {
        const columns: DataTableColumn<MasterDataItem>[] = [
          {
            key: "key",
            header: "Key",
            render: (value) => <code className="font-mono text-sm">{value}</code>,
          },
          {
            key: "label",
            header: "Label",
          },
          {
            key: "description",
            header: "Description",
            render: (value) => value || "—",
          },
          {
            key: "order",
            header: "Order",
            align: "center",
          },
        ];

        const actions = [
          {
            id: "edit",
            icon: <Edit2 className="w-4 h-4" />,
            label: "Edit",
            onClick: (item: MasterDataItem) => handleOpenEdit(item),
          },
          {
            id: "delete",
            icon: <Trash2 className="w-4 h-4" />,
            label: "Delete",
            variant: "danger" as const,
            onClick: (item: MasterDataItem) => handleDelete(item.id),
          },
        ];

        return (
          <div style={{ marginBottom: "24px" }}>
            <DataTable<MasterDataItem>
              columns={columns}
              data={data}
              actions={actions}
              pagination={{ ...pagination, total: data.length }}
              onPaginationChange={handlers.onPaginationChange}
              isLoading={loading}
              emptyMessage="Create your first master data entry to get started."
              emptyIcon="📋"
              compact={false}
              striped={true}
              hoverable={true}
            />
          </div>
        );
      })()}

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
