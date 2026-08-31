import React, { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  HelpCircle,
  Info,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000")).replace(/\/$/, "");

export default function RecruiterImportModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("skip"); // "skip" or "upsert"
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isValid = /\.(xlsx|xls|csv)$/i.test(selectedFile.name);
    if (!isValid) {
      setError("Please select a valid Excel (.xlsx, .xls) or CSV (.csv) file.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please choose a file to upload.");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("rportal_token");
      const response = await fetch(`${API_BASE}/api/recruiters/import?mode=${mode}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        let msg = "The file could not be imported.";
        if (typeof data.detail === "string") {
          msg = data.detail;
        } else if (typeof data.detail === "object" && data.detail?.message) {
          msg = data.detail.message;
        } else if (data.message) {
          msg = data.message;
        }
        throw new Error(msg);
      }

      setResult(data);
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred during import.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = (format = "xlsx") => {
    const token = localStorage.getItem("rportal_token");
    const url = `${API_BASE}/api/recruiters/sample-template?format=${format}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `recruiters_sample_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetModal = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(37,99,235,0.1)", padding: "8px", borderRadius: "8px", color: "#2563eb" }}>
              <UploadCloud size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "19px" }}>Import Recruiters & Companies</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
                Upload recruiter contacts and partner companies via Excel or CSV spreadsheet
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Instructions Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
              <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info size={16} color="#2563eb" /> Required Columns & Instructions:
              </strong>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  className="secondary-button small-button"
                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                >
                  <Download size={13} />
                  Download Excel Template
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate("csv")}
                  className="secondary-button small-button"
                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                >
                  <Download size={13} />
                  CSV Template
                </button>
              </div>
            </div>
            <p style={{ margin: "0 0 6px 0", color: "#475569" }}>
              The file must include <strong>Name</strong>, <strong>Company</strong>, and <strong>Email</strong>. Optional fields: <code>Designation</code>, <code>Phone</code>, <code>Status</code>, <code>Last Contacted</code>, and <code>Notes</code>.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "11.5px" }}>
              <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>Name *</span>
              <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>Company *</span>
              <span className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>Email *</span>
              <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>Designation</span>
              <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>Phone</span>
              <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>Status (ACTIVE / INACTIVE)</span>
              <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>Notes</span>
            </div>
          </div>

          {/* Drag & Drop File Zone */}
          {!result && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#2563eb" : "#cbd5e1"}`,
                borderRadius: "12px",
                padding: "36px 20px",
                textAlign: "center",
                background: dragOver ? "rgba(37,99,235,0.04)" : "#fafafa",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#eff6ff", width: "54px", height: "54px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  <FileSpreadsheet size={28} />
                </div>
                {file ? (
                  <div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{file.name}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      {(file.size / 1024).toFixed(1)} KB &bull; Click or drag to choose another file
                    </p>
                  </div>
                ) : (
                  <div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>Click to upload or drag & drop</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Supports .xlsx, .xls and .csv formats
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Mode Radio Group */}
          {!result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>
                Duplicate Email Handling:
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${mode === "skip" ? "#2563eb" : "#e2e8f0"}`,
                    background: mode === "skip" ? "rgba(37,99,235,0.04)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="recruiterImportMode"
                    value="skip"
                    checked={mode === "skip"}
                    onChange={() => setMode("skip")}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>Skip Duplicates (Safe)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Leave existing recruiter contacts unchanged.
                    </p>
                  </div>
                </label>

                <label
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    border: `1px solid ${mode === "upsert" ? "#2563eb" : "#e2e8f0"}`,
                    background: mode === "upsert" ? "rgba(37,99,235,0.04)" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="recruiterImportMode"
                    value="upsert"
                    checked={mode === "upsert"}
                    onChange={() => setMode("upsert")}
                    style={{ marginTop: "3px" }}
                  />
                  <div>
                    <strong style={{ fontSize: "13px", color: "#0f172a" }}>Update Existing (Upsert)</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                      Overwrite details for matching recruiter emails.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Error Message Display */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "flex-start", gap: "10px", color: "#991b1b", fontSize: "13px" }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
              <div>
                <strong>Import Error:</strong> {error}
              </div>
            </div>
          )}

          {/* Success Result Summary */}
          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#166534", marginBottom: "12px" }}>
                <CheckCircle2 size={24} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: "16px" }}>{result.message}</h3>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginTop: "12px", textAlign: "center" }}>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Imported</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 800, color: "#15803d" }}>{result.imported ?? 0}</p>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Updated</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 800, color: "#2563eb" }}>{result.updated ?? 0}</p>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Duplicates</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 800, color: "#d97706" }}>{result.duplicates ?? 0}</p>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Invalid</span>
                  <p style={{ margin: "4px 0 0", fontSize: "20px", fontWeight: 800, color: "#dc2626" }}>{result.invalid ?? 0}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{ marginTop: "14px", background: "#fff", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0", maxHeight: "140px", overflowY: "auto", fontSize: "12px" }}>
                  <strong style={{ color: "#64748b", textTransform: "uppercase", fontSize: "11px", display: "block", marginBottom: "6px" }}>
                    Import Notes / Warnings ({result.errors.length}):
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "18px", color: "#475569" }}>
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {result ? (
            <>
              <button type="button" className="secondary-button" onClick={resetModal}>
                <RefreshCw size={15} /> Import Another File
              </button>
              <button type="button" className="primary-button" onClick={onClose}>
                Done
              </button>
            </>
          ) : (
            <>
              <button type="button" className="secondary-button" onClick={onClose} disabled={importing}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleImport} disabled={!file || importing}>
                {importing ? "Importing Data…" : "Start Import"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
