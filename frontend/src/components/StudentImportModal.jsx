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

export default function StudentImportModal({ isOpen, onClose, onSuccess }) {
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
      const response = await fetch(`${API_BASE}/api/students/import?mode=${mode}`, {
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
    const url = `${API_BASE}/api/students/sample-template?format=${format}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_sample_template.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal import-modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileSpreadsheet className="modal-header-icon" size={24} style={{ color: "#2563eb" }} />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem" }}>Import Student Records</h2>
              <p style={{ margin: 0, color: "#64748b", fontSize: "0.85rem" }}>
                Upload .xlsx, .xls, or .csv spreadsheets to batch register students
              </p>
            </div>
          </div>
          <button type="button" className="close-button" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Sample Template Section */}
          <div className="import-template-box" style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Info size={18} style={{ color: "#3b82f6" }} />
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1e293b" }}>Need a reference template?</span>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="secondary-button small-button"
                  onClick={() => handleDownloadTemplate("xlsx")}
                  title="Download sample Excel template"
                >
                  <Download size={14} />
                  Excel (.xlsx)
                </button>
                <button
                  type="button"
                  className="secondary-button small-button"
                  onClick={() => handleDownloadTemplate("csv")}
                  title="Download sample CSV template"
                >
                  <Download size={14} />
                  CSV (.csv)
                </button>
              </div>
            </div>
            <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "#64748b" }}>
              Supported columns: <b>Registration Number</b>, <b>Student Name</b>, <b>Department</b>, <b>Email</b>, <b>Phone</b>, <b>CGPA</b>, <b>Placement Status</b>, <b>Skills</b>.
            </p>
          </div>

          {/* Import Mode Selector */}
          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontWeight: 600, fontSize: "0.875rem", marginBottom: "6px", display: "block" }}>
              Duplicate Handling Policy:
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px",
                  border: mode === "skip" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: mode === "skip" ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="import_mode"
                  checked={mode === "skip"}
                  onChange={() => setMode("skip")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <strong style={{ fontSize: "0.85rem", display: "block", color: "#1e293b" }}>Skip Existing</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Keep existing student records untouched</span>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "10px",
                  border: mode === "upsert" ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  borderRadius: "6px",
                  background: mode === "upsert" ? "#eff6ff" : "#fff",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="import_mode"
                  checked={mode === "upsert"}
                  onChange={() => setMode("upsert")}
                  style={{ marginTop: "3px" }}
                />
                <div>
                  <strong style={{ fontSize: "0.85rem", display: "block", color: "#1e293b" }}>Update Existing (Upsert)</strong>
                  <span style={{ fontSize: "0.75rem", color: "#64748b" }}>Overwrite details if Reg. No already exists</span>
                </div>
              </label>
            </div>
          </div>

          {/* File Dropzone */}
          {!result && (
            <div
              className={`file-dropzone ${dragOver ? "dragover" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed " + (dragOver ? "#2563eb" : file ? "#16a34a" : "#cbd5e1"),
                borderRadius: "8px",
                padding: "24px 16px",
                textAlign: "center",
                background: dragOver ? "#eff6ff" : file ? "#f0fdf4" : "#fafafa",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {file ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <CheckCircle2 size={32} style={{ color: "#16a34a" }} />
                  <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>{file.name}</strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    {(file.size / 1024).toFixed(1)} KB &bull; Click or drag to replace
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <UploadCloud size={36} style={{ color: "#64748b" }} />
                  <strong style={{ fontSize: "0.95rem", color: "#1e293b" }}>
                    Click to browse or drag and drop your spreadsheet
                  </strong>
                  <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                    Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="inline-alert error" style={{ margin: 0 }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Success / Result Feedback */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  padding: "16px",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#166534" }}>
                  <CheckCircle2 size={20} />
                  <strong style={{ fontSize: "1rem" }}>{result.message}</strong>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "4px" }}>
                  <div style={{ background: "#fff", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #dcfce7" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Added</span>
                    <strong style={{ fontSize: "1.1rem", color: "#16a34a" }}>{result.imported ?? 0}</strong>
                  </div>
                  <div style={{ background: "#fff", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #dcfce7" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Updated</span>
                    <strong style={{ fontSize: "1.1rem", color: "#2563eb" }}>{result.updated ?? 0}</strong>
                  </div>
                  <div style={{ background: "#fff", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #dcfce7" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Skipped</span>
                    <strong style={{ fontSize: "1.1rem", color: "#d97706" }}>{result.duplicates ?? 0}</strong>
                  </div>
                  <div style={{ background: "#fff", padding: "8px", borderRadius: "6px", textAlign: "center", border: "1px solid #dcfce7" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>Invalid</span>
                    <strong style={{ fontSize: "1.1rem", color: "#dc2626" }}>{result.invalid ?? 0}</strong>
                  </div>
                </div>
              </div>

              {/* Warning / Error logs if any */}
              {result.errors && result.errors.length > 0 && (
                <div style={{ background: "#fffbeb", border: "1px solid #fef3c7", padding: "12px", borderRadius: "6px", maxHeight: "150px", overflowY: "auto" }}>
                  <strong style={{ fontSize: "0.8rem", color: "#92400e", display: "block", marginBottom: "4px" }}>
                    Row Processing Notes ({result.errors.length}):
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "0.75rem", color: "#b45309" }}>
                    {result.errors.map((errItem, idx) => (
                      <li key={idx}>{errItem}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            {result && (
              <button type="button" className="secondary-button small-button" onClick={handleReset}>
                <RefreshCw size={14} />
                Import Another File
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="secondary-button" onClick={onClose} disabled={importing}>
              {result ? "Done" : "Cancel"}
            </button>

            {!result && (
              <button
                type="button"
                className="primary-button"
                onClick={handleImport}
                disabled={!file || importing}
              >
                <UploadCloud size={16} />
                {importing ? "Processing Import..." : "Start Import"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
