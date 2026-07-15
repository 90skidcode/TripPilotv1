"use client";
import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Download, X, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/components/Toast";

interface Props {
  onClose: () => void;
  onImported: () => void;
}

const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const SAMPLE_CSV = `name,phone,email,whatsapp_number
Priya Sharma,9876543210,priya@example.com,9876543210
Rahul Verma,9123456789,rahul@example.com,9123456789
Anita Patel,9988776655,anita@example.com,
Vikram Singh,8765432109,,8765432109
Neha Gupta,9999999999,neha@gmail.com,9999999999
`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_customers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CustomerCsvImportModal({ onClose, onImported }: Props) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; message: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): string {
    if (!f.name.toLowerCase().endsWith(".csv") && f.type !== "text/csv") {
      return "Only CSV files are allowed.";
    }
    if (f.size > MAX_SIZE_BYTES) {
      return `File size exceeds ${MAX_SIZE_MB}MB limit. Please reduce the file size.`;
    }
    return "";
  }

  function pickFile(f: File) {
    const err = validateFile(f);
    setFileError(err);
    setFile(err ? null : f);
    setResult(null);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) pickFile(f);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setFileError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("trippilot_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/customers/import/csv`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to import CSV");
      }
      const data = await res.json();
      setResult(data);
      showToast({ type: "success", message: `✓ Imported ${data.created} customers successfully`, duration: 4000 });
      onImported();
    } catch (err: any) {
      setFileError(err.message || "Upload failed. Please try again.");
      showToast({ type: "error", message: `✕ ${err.message || "Upload failed"}`, duration: 5000 });
    } finally {
      setLoading(false);
    }
  }

  function clearFile() {
    setFile(null);
    setFileError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
        zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          backgroundColor: "white", borderRadius: "var(--radius, 8px)", width: "100%",
          maxWidth: 520, display: "flex", flexDirection: "column",
          boxShadow: "0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #e3eaef", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Import Customers from CSV</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} id="csv-modal-close">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Sample download */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "var(--radius, 8px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <FileText style={{ width: 18, height: 18, color: "#0284c7", flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#0c4a6e" }}>Download Sample CSV</p>
                <p style={{ fontSize: 12, color: "#0369a1", margin: 0 }}>Includes all fields: name, phone, email & WhatsApp</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={downloadSample}
              id="csv-download-sample"
              style={{ whiteSpace: "nowrap", marginLeft: 12 }}
            >
              <Download style={{ width: 14, height: 14, marginRight: 4 }} />
              Download
            </button>
          </div>

          {/* File picker area */}
          {!file && !result && (
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onClick={() => inputRef.current?.click()}
              style={{
                padding: "40px 24px", border: "2px dashed", borderColor: dragging ? "#3b82f6" : "#cbd5e1",
                borderRadius: "var(--radius, 8px)", background: dragging ? "#f0f9ff" : "#f8fafc",
                cursor: "pointer", transition: "all 0.2s", textAlign: "center",
              }}
            >
              <Upload style={{ width: 32, height: 32, color: "#64748b", marginBottom: 12 }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0", color: "#1e293b" }}>
                Drag & drop your CSV file
              </p>
              <p style={{ fontSize: 12, margin: "0 0 8px 0", color: "#64748b" }}>
                or click to select
              </p>
              <p style={{ fontSize: 11, margin: 0, color: "#94a3b8" }}>
                Max size: {MAX_SIZE_MB}MB
              </p>
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && pickFile(e.target.files[0])}
            style={{ display: "none" }}
          />

          {/* File selected state */}
          {file && !result && (
            <>
              <div style={{ padding: "16px", background: "#f8fafc", borderRadius: "var(--radius, 8px)", border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <FileText style={{ width: 18, height: 18, color: "#0284c7" }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: "#1e293b", wordBreak: "break-word" }}>{file.name}</p>
                      <p style={{ fontSize: 12, margin: "2px 0 0 0", color: "#64748b" }}>{formatSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearFile}
                    disabled={loading}
                    style={{ background: "none", border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1 }}
                  >
                    <X style={{ width: 16, height: 16, color: "#64748b" }} />
                  </button>
                </div>
              </div>

              {fileError && (
                <div style={{ padding: "12px 16px", background: "#fee2e2", borderRadius: "var(--radius, 8px)", display: "flex", alignItems: "flex-start", gap: 10 }}>
                  <AlertCircle style={{ width: 18, height: 18, color: "#dc2626", flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 13, margin: 0, color: "#991b1b" }}>{fileError}</p>
                </div>
              )}
            </>
          )}

          {/* Success state */}
          {result && (
            <div style={{ padding: "20px 16px", background: "#dcfce7", borderRadius: "var(--radius, 8px)", border: "1px solid #bbf7d0", textAlign: "center" }}>
              <CheckCircle style={{ width: 32, height: 32, color: "#16a34a", margin: "0 auto 8px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px 0", color: "#166534" }}>Import Successful!</p>
              <p style={{ fontSize: 13, margin: "0 0 12px 0", color: "#15803d" }}>
                {result.created} customer{result.created !== 1 ? "s" : ""} imported successfully
              </p>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                padding: "10px 20px", border: "1px solid #e2e8f0", borderRadius: "var(--radius, 8px)",
                background: "white", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1,
                fontSize: 13, fontWeight: 600,
              }}
            >
              Close
            </button>
            {!result && file && (
              <button
                onClick={handleUpload}
                disabled={loading || !file}
                style={{
                  padding: "10px 20px", border: "none", borderRadius: "var(--radius, 8px)",
                  background: loading || !file ? "#cbd5e1" : "#3b82f6", color: "white",
                  cursor: loading || !file ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 600,
                }}
              >
                {loading ? "Uploading..." : "Upload"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
