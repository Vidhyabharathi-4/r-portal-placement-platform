import React, { useEffect, useState } from "react";
import { Building2, Globe, Mail, MapPin, Phone, User, X } from "lucide-react";
import api from "../api";

export default function AddCompanyModal({ isOpen, onClose, companyToEdit, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    industry: "",
    website: "",
    logo_url: "",
    location: "Bengaluru, Karnataka",
    address: "",
    description: "",
    recruiter_status: "COLD",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    contact_designation: "HR Manager",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (companyToEdit) {
      setFormData({
        name: companyToEdit.name || "",
        industry: companyToEdit.industry || "",
        website: companyToEdit.website || "",
        logo_url: companyToEdit.logo_url || "",
        location: companyToEdit.location || "Bengaluru, Karnataka",
        address: companyToEdit.address || "",
        description: companyToEdit.description || "",
        recruiter_status: companyToEdit.recruiter_status || "COLD",
        contact_name: companyToEdit.contact_name || companyToEdit.primary_contact || "",
        contact_email: companyToEdit.contact_email || companyToEdit.primary_email || "",
        contact_phone: companyToEdit.contact_phone || companyToEdit.primary_phone || "",
        contact_designation: companyToEdit.contact_designation || "HR Manager",
        notes: companyToEdit.notes || "",
      });
    } else {
      setFormData({
        name: "",
        industry: "Information Technology",
        website: "",
        logo_url: "",
        location: "Bengaluru, Karnataka",
        address: "",
        description: "",
        recruiter_status: "COLD",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        contact_designation: "HR Manager",
        notes: "",
      });
    }
    setError(null);
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!formData.name.trim()) {
      setError("Company Name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (companyToEdit && companyToEdit.id) {
        await api(`/api/companies/${companyToEdit.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await api("/api/companies", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save company profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" style={{ maxWidth: "780px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ background: "rgba(37,99,235,0.1)", padding: "8px", borderRadius: "8px", color: "#2563eb" }}>
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px" }}>
                {companyToEdit ? `Edit Company: ${companyToEdit.name}` : "Add New Recruitment Partner"}
              </h2>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                Register company profile, relationship stage, and campus hiring coordinates
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
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px", color: "#991b1b", fontSize: "13px" }}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Row 1: Company Name & Industry */}
            <div className="form-row two-col">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Tata Consultancy Services, Infosys, Amazon"
                />
              </div>

              <div className="form-group">
                <label>Industry / Sector</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Information Technology, FinTech, Core Engineering"
                />
              </div>
            </div>

            {/* Row 2: Website & Logo URL */}
            <div className="form-row two-col">
              <div className="form-group">
                <label><Globe size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Website URL</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div className="form-group">
                <label>Logo / Image URL</label>
                <input
                  type="text"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://logo.clearbit.com/company.com"
                />
              </div>
            </div>

            {/* Row 3: Location & Relationship Status */}
            <div className="form-row two-col">
              <div className="form-group">
                <label><MapPin size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Bengaluru, Coimbatore, Chennai, Hyderabad"
                />
              </div>

              <div className="form-group">
                <label>Relationship / Engagement Stage</label>
                <select
                  value={formData.recruiter_status}
                  onChange={(e) => setFormData({ ...formData, recruiter_status: e.target.value })}
                >
                  <option value="COLD">❄️ Cold (Initial outreach)</option>
                  <option value="WARM">⚡ Warm (In discussion / engaged)</option>
                  <option value="HOT">🔥 Hot (Active recruitment discussions)</option>
                  <option value="DRIVE_COMPLETED">✅ Drive Completed</option>
                </select>
              </div>
            </div>

            {/* Primary Contact Section */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Primary Recruiter / HR Contact
              </span>

              <div className="form-row two-col">
                <div className="form-group">
                  <label><User size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="e.g., Priya Sharma"
                  />
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input
                    type="text"
                    value={formData.contact_designation}
                    onChange={(e) => setFormData({ ...formData, contact_designation: e.target.value })}
                    placeholder="Campus HR Lead / University Relations"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label><Mail size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Contact Email</label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                    placeholder="recruiter@company.com"
                  />
                </div>

                <div className="form-group">
                  <label><Phone size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            {/* Company Description & Address */}
            <div className="form-group">
              <label>Company Description / Overview</label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Key business domains, global operations, and hiring profile..."
              />
            </div>

            <div className="form-group">
              <label>Notes & Follow-up History</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Interaction notes, drive schedules, or special requirements..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving}>
              {saving ? "Saving…" : companyToEdit ? "Save Changes" : "Create Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
