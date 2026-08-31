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
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000")).replace(/\/$/, "");

export default function JDUploadModal({ isOpen, onClose, driveId, driveTitle, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;
    const isValid = /\.(pdf|docx|doc|txt)$/i.test(selectedFile.name);
    if (!isValid) {
      setError("Please upload a valid PDF, DOCX, DOC, or TXT file.");
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

  const handleUploadAndParse = async () => {
    if (!file || !driveId) {
      setError("Please select a Job Description document.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("rportal_token");
      const response = await fetch(`${API_BASE}/api/drives/${driveId}/jd-upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to upload and parse Job Description.");
      }

      setResult(data);
      if (onSuccess) onSuccess(data);
    } catch (err) {
      setError(err.message || "An unexpected error occurred during JD upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(37,99,235,0.1)", padding: "8px", borderRadius: "8px", color: "#2563eb" }}>
              <FileText size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Upload & Parse Job Description</h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                {driveTitle || "Placement Drive"} &bull; Auto-extract required skills, CGPA, and streams for ATS
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Instructions Box */}
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", fontSize: "13px" }}>
            <strong style={{ color: "#0f172a", display: "flex", alignItems: "center", gap: "6px" }}>
              <Sparkles size={16} color="#4f46e5" /> Smart JD Requirement Extraction:
            </strong>
            <p style={{ margin: "4px 0 0 0", color: "#475569" }}>
              Upload your company JD document (PDF, Word DOCX, or text file). The parser will automatically extract technical skills, minimum CGPA, eligible branches, and experience requirements to power the ATS student match engine.
            </p>
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
                accept=".pdf, .docx, .doc, .txt"
                style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                <div style={{ background: "#eff6ff", width: "54px", height: "54px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  <UploadCloud size={28} />
                </div>
                {file ? (
                  <div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>{file.name}</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      {(file.size / 1024).toFixed(1)} KB &bull; Click to choose a different file
                    </p>
                  </div>
                ) : (
                  <div>
                    <strong style={{ fontSize: "15px", color: "#0f172a" }}>Click to upload or drag & drop JD file</strong>
                    <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                      Supported formats: PDF, DOCX, DOC, and TXT
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", color: "#991b1b", fontSize: "13px" }}>
              <AlertCircle size={18} />
              <div><strong>Error:</strong> {error}</div>
            </div>
          )}

          {/* Parsed Extraction Result Display */}
          {result && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#166534" }}>
                <CheckCircle2 size={22} color="#16a34a" />
                <h3 style={{ margin: 0, fontSize: "16px" }}>{result.message}</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", textAlign: "center" }}>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Required Skills</span>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#15803d" }}>
                    {result.parsed_requirements?.required_skills?.length ?? 0} Detected
                  </p>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Min CGPA</span>
                  <p style={{ margin: "4px 0 0", fontSize: "16px", fontWeight: 800, color: "#2563eb" }}>
                    {result.parsed_requirements?.min_cgpa || "6.0"}
                  </p>
                </div>
                <div style={{ background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #dcfce7" }}>
                  <span style={{ fontSize: "11px", color: "#166534", textTransform: "uppercase", fontWeight: 700 }}>Target Streams</span>
                  <p style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: 700, color: "#475569" }}>
                    {result.parsed_requirements?.eligible_departments?.join(", ") || "All"}
                  </p>
                </div>
              </div>

              {result.parsed_requirements?.required_skills && result.parsed_requirements.required_skills.length > 0 && (
                <div style={{ background: "#fff", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "12.5px" }}>
                  <strong style={{ color: "#334155", display: "block", marginBottom: "6px" }}>Extracted Skills:</strong>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {result.parsed_requirements.required_skills.map((s, i) => (
                      <span key={i} className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {result ? (
            <button type="button" className="primary-button" onClick={onClose}>
              Done & View ATS Matches
            </button>
          ) : (
            <>
              <button type="button" className="secondary-button" onClick={onClose} disabled={uploading}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleUploadAndParse}
                disabled={!file || uploading}
              >
                {uploading ? "Extracting Requirements…" : "Upload & Parse JD"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
