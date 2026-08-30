import React, { useEffect, useState } from "react";
import { BriefcaseBusiness, MapPin, Sparkles, X } from "lucide-react";
import api from "../api";

export default function AddDriveModal({ isOpen, onClose, companyId, companies, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    company_id: "",
    job_role: "",
    location: "Campus",
    package_lpa: "6.0 LPA",
    min_cgpa: "6.0",
    max_backlogs: 0,
    required_skills: "",
    preferred_skills: "",
    departments: "CSE, IT, ECE, AIDS",
    experience_requirement: "Fresher / Final Year (2026 Batch)",
    certifications: "",
    eligibility: "B.E / B.Tech all eligible streams with CGPA >= 6.0",
    description: "",
    status: "OPEN",
    work_mode: "On-site",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: "",
        company_id: companyId || "",
        job_role: "",
        location: "Campus",
        package_lpa: "6.0 LPA",
        min_cgpa: "6.0",
        max_backlogs: 0,
        required_skills: "",
        preferred_skills: "",
        departments: "CSE, IT, ECE, AIDS",
        experience_requirement: "Fresher / Final Year (2026 Batch)",
        certifications: "",
        eligibility: "B.E / B.Tech all eligible streams with CGPA >= 6.0",
        description: "",
        status: "OPEN",
        work_mode: "On-site",
      });
      setError(null);
    }
  }, [isOpen, companyId]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.title.trim() || !formData.company_id || !formData.location.trim()) {
      setError("Please fill all required fields: Title, Company, and Location.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        company_id: Number(formData.company_id),
        max_backlogs: Number(formData.max_backlogs) || 0,
        job_role: formData.job_role || formData.title,
        eligibility: formData.eligibility || `Min CGPA: ${formData.min_cgpa}, Streams: ${formData.departments}`,
      };

      await api("/api/drives", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create placement drive.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" style={{ maxWidth: "800px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(37,99,235,0.1)", padding: "8px", borderRadius: "8px", color: "#2563eb" }}>
              <BriefcaseBusiness size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>Create Placement Drive</h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                Configure company, job role, academic cut-offs, and skills for ATS evaluation
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 14px", color: "#991b1b", borderRadius: "8px", fontSize: "13px" }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Row 1: Drive Title & Company */}
            <div className="form-row two-col">
              <div className="form-group">
                <label>Drive Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Software Engineer 2026 Campus Drive"
                />
              </div>

              <div className="form-group">
                <label>Company *</label>
                <select
                  required
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Job Role & Work Mode */}
            <div className="form-row two-col">
              <div className="form-group">
                <label>Job Role</label>
                <input
                  type="text"
                  value={formData.job_role}
                  onChange={(e) => setFormData({ ...formData, job_role: e.target.value })}
                  placeholder="e.g., Full Stack Engineer / Cloud Specialist"
                />
              </div>

              <div className="form-group">
                <label>Work Mode</label>
                <select
                  value={formData.work_mode}
                  onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                >
                  <option value="On-site">On-site</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Row 3: Location & CTC Package */}
            <div className="form-row two-col">
              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Campus Auditorium / Bengaluru"
                />
              </div>

              <div className="form-group">
                <label>CTC Package (LPA)</label>
                <input
                  type="text"
                  value={formData.package_lpa}
                  onChange={(e) => setFormData({ ...formData, package_lpa: e.target.value })}
                  placeholder="e.g., 8.5 LPA or 6-10 LPA"
                />
              </div>
            </div>

            {/* ATS Criteria Box */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles size={14} /> ATS Eligibility & Matching Criteria
              </span>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>Min CGPA Cut-off</label>
                  <input
                    type="text"
                    value={formData.min_cgpa}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                    placeholder="6.5"
                  />
                </div>

                <div className="form-group">
                  <label>Max Backlogs Allowed</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.max_backlogs}
                    onChange={(e) => setFormData({ ...formData, max_backlogs: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label>Drive Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="OPEN">Open / Active</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Eligible Departments / Streams (comma separated)</label>
                <input
                  type="text"
                  value={formData.departments}
                  onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                  placeholder="CSE, IT, ECE, AIDS"
                />
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Required Technical Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.required_skills}
                    onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                    placeholder="Python, FastAPI, SQL, Git"
                  />
                </div>

                <div className="form-group">
                  <label>Preferred / Elective Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.preferred_skills}
                    onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
                    placeholder="AWS, Docker, Kubernetes"
                  />
                </div>
              </div>
            </div>

            {/* Additional details */}
            <div className="form-group">
              <label>Eligibility Description & Mode Details</label>
              <textarea
                rows={2}
                value={formData.eligibility}
                onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                placeholder="Specific academic eligibility rules, package breaks, or onboarding dates..."
              />
            </div>

            <div className="form-group">
              <label>Job Description / Key Tasks</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Day to day responsibilities, reporting structure, and product domains..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Creating..." : "Create Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
