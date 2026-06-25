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

const SAMPLE_CSV = `name,phone,email,whatsapp_number,source,stage,destination,trip_type,budget,num_adults,num_children,num_infants,notes
Priya Sharma,9876543210,priya@example.com,9876543210,whatsapp,fresh,Maldives,Honeymoon,150000,2,0,0,Interested in beach resorts
Rahul Verma,9123456789,rahul@example.com,,instagram,qualified_hot,Bali,Family,200000,2,2,0,Looking for budget packages
Anita Patel,9988776655,,,referral,fresh,Dubai,Group tour,500000,5,1,1,
`;

function downloadSample() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_leads.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImportModal({ onClose, onImported }: Props) {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leads/import/csv`, {
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
      showToast({ type: "success", message: `✓ Imported ${data.created} leads successfully`, duration: 4000 });
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
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0 }}>Import Leads from CSV</h2>
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
                <p style={{ fontSize: 12, color: "#0369a1", margin: 0 }}>Includes all fields: customer info, source, stage, trip details & more</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={downloadSample}
              id="csv-download-sample"
              style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
            >
              <Download style={{ width: 14, height: 14 }} /> Sample CSV
            </button>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => !file && inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? "#7c3aed" : file ? "#16a34a" : "#d1d5db"}`,
              borderRadius: "var(--radius, 8px)",
              padding: "32px 24px",
              textAlign: "center",
              cursor: file ? "default" : "pointer",
              background: dragging ? "#f5f3ff" : file ? "#f0fdf4" : "#fafafa",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            {file ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                <CheckCircle style={{ width: 24, height: 24, color: "#16a34a", flexShrink: 0 }} />
                <div style={{ textAlign: "left", minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#15803d", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: 12, color: "#4b7a5a", margin: 0 }}>{formatSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearFile(); }}
                  style={{ marginLeft: "auto", padding: 4, border: "none", background: "none", cursor: "pointer", color: "#6b7280", flexShrink: 0 }}
                  title="Remove file"
                >
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
            ) : (
              <>
                <Upload style={{ width: 32, height: 32, color: "#9ca3af", margin: "0 auto 12px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#374151", margin: "0 0 4px" }}>
                  {dragging ? "Drop your CSV here" : "Drag & drop your CSV file here"}
                </p>
                <p style={{ fontSize: 12, color: "#6b7280", margin: "0 0 12px" }}>or click to browse</p>
                <span style={{ fontSize: 11, color: "#9ca3af", background: "#f3f4f6", padding: "3px 10px", borderRadius: 99 }}>
                  CSV only · Max {MAX_SIZE_MB}MB
                </span>
              </>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            id="csv-file-input"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) pickFile(f);
            }}
          />

          {/* File error */}
          {fileError && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fee2e2", color: "#dc2626", padding: "10px 14px", borderRadius: "var(--radius, 8px)", fontSize: 13 }}>
              <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {fileError}
            </div>
          )}

          {/* Success result */}
          {result && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#dcfce7", color: "#16a34a", padding: "10px 14px", borderRadius: "var(--radius, 8px)", fontSize: 13, fontWeight: 600 }}>
              <CheckCircle style={{ width: 16, height: 16, flexShrink: 0 }} />
              {result.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #e3eaef", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#f9fafb" }}>
          <button type="button" className="btn btn-outline" onClick={onClose} id="csv-modal-cancel">
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || loading}
              id="csv-modal-upload"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <Upload style={{ width: 15, height: 15 }} />
              {loading ? "Importing…" : "Import Leads"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
