import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Globe,
  GraduationCap,
  History,
  Layers,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import api from "../api";
import StatusBadge from "./StatusBadge";

export default function CompanyDetailsModal({
  isOpen,
  onClose,
  companyId,
  canEdit,
  onStatusChange,
  onEditCompany,
  onAddRecruiter,
  onCreateDrive,
  onOpenATS,
  onOpenJDUpload,
  onViewRecruiter,
  onEditRecruiter,
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, recruiters, drives, jds, eligible_students, applications, placed_students, activity

  useEffect(() => {
    if (isOpen && companyId) {
      loadCompanyDetails();
    }
  }, [isOpen, companyId]);

  async function loadCompanyDetails() {
    setLoading(true);
    setError(null);
    try {
      const res = await api(`/api/companies/${companyId}/details`);
      setDetails(res);
    } catch (err) {
      setError(err.message || "Failed to load company details.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  function getCompanyInitials(name) {
    if (!name) return "CO";
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" style={{ maxWidth: "1050px", width: "95vw" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ paddingBottom: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              className="company-logo-container"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 800,
                fontSize: "17px",
              }}
            >
              {details?.logo_url ? (
                <img
                  src={details.logo_url}
                  alt={details.name}
                  className="company-logo-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = document.createElement('span');
                    fallback.innerText = getCompanyInitials(details?.name);
                    e.target.parentNode.appendChild(fallback);
                  }}
                />
              ) : (
                getCompanyInitials(details?.name)
              )}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2 style={{ margin: 0, fontSize: "19px", color: "#0f172a" }}>{details?.name || "Company Profile"}</h2>
                {details?.recruiter_status && (
                  <StatusBadge status={details.recruiter_status} />
                )}
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                {details?.industry || "Enterprise Partner"} &bull; {details?.location || "India"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {canEdit && (
              <button
                type="button"
                className="secondary-button small-button"
                onClick={() => {
                  if (onEditCompany) onEditCompany(details);
                }}
              >
                <Pencil size={13} /> Edit Company
              </button>
            )}
            <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* 8-Tab Navigation Bar */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            borderBottom: "1px solid #e2e8f0",
            padding: "0 24px",
            background: "#fafafa",
            overflowX: "auto",
          }}
        >
          {[
            ["overview", "1. Overview", Building2],
            ["recruiters", `2. Recruiters (${details?.recruiters?.length ?? 0})`, Users],
            ["drives", `3. Placement Drives (${details?.drives?.length ?? 0})`, BriefcaseBusiness],
            ["jds", `4. Job Descriptions (${details?.job_descriptions?.length ?? 0})`, FileText],
            ["eligible_students", `5. Eligible Students (${details?.eligible_students?.length ?? 0})`, UserCheck],
            ["applications", `6. Applications (${details?.applications?.length ?? 0})`, GraduationCap],
            ["placed_students", `7. Students Placed (${details?.placed_students_count ?? details?.placed_students?.length ?? 0})`, Award],
            ["activity", "8. History", History],
          ].map(([tabKey, label, Icon]) => (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveTab(tabKey)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 14px",
                border: "none",
                background: "none",
                borderBottom: activeTab === tabKey ? "3px solid #2563eb" : "3px solid transparent",
                color: activeTab === tabKey ? "#2563eb" : "#64748b",
                fontWeight: activeTab === tabKey ? 700 : 500,
                fontSize: "12.5px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="modal-body" style={{ minHeight: "360px" }}>
          {loading ? (
            <div style={{ padding: "50px 0", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 12px auto" }} />
              <p style={{ fontSize: "13.5px", color: "#64748b" }}>Loading complete company dossier…</p>
            </div>
          ) : error ? (
            <div style={{ padding: "20px", background: "#fef2f2", color: "#991b1b", borderRadius: "8px", textAlign: "center" }}>
              {error}
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Top Bar with Stage Updater & Website */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Relationship Stage:</span>
                      {canEdit ? (
                        <select
                          className={`company-status-dropdown status-${(details?.recruiter_status || "COLD").toLowerCase().replace("_", "-")}`}
                          value={details?.recruiter_status}
                          onChange={(e) => {
                            if (onStatusChange) onStatusChange(details.id, e.target.value);
                            setDetails({ ...details, recruiter_status: e.target.value });
                          }}
                        >
                          <option value="HOT">🔥 Hot (Active Recruitment Discussions)</option>
                          <option value="WARM">⚡ Warm (In Discussion / Engaged)</option>
                          <option value="COLD">❄️ Cold (Prospect)</option>
                          <option value="DRIVE_COMPLETED">✅ Drive Completed</option>
                        </select>
                      ) : (
                        <StatusBadge status={details?.recruiter_status} />
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {details?.website && (
                        <a
                          href={details.website.startsWith("http") ? details.website : `https://${details.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="secondary-button small-button"
                        >
                          <Globe size={13} /> {details.website.replace(/^https?:\/\//, "")}
                        </a>
                      )}
                    </div>
                  </div>

                  {/* 4 Stat Cards */}
                  <div className="stats-grid four">
                    <div className="stat-card">
                      <span className="stat-label">Total Recruiters</span>
                      <strong className="stat-value">{details?.total_recruiters ?? details?.recruiters?.length ?? 0}</strong>
                      <span className="stat-sub">Registered HR Contacts</span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Placement Drives</span>
                      <strong className="stat-value">{details?.total_drives ?? details?.drives?.length ?? 0}</strong>
                      <span className="stat-sub">{details?.active_drives ?? 0} Currently Active</span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Total Applications</span>
                      <strong className="stat-value">{details?.total_applications ?? 0}</strong>
                      <span className="stat-sub">Student Submissions</span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Students Placed</span>
                      <strong className="stat-value" style={{ color: "#16a34a" }}>
                        {details?.placed_students_count ?? details?.selected_students ?? 0}
                      </strong>
                      <span className="stat-sub">Final Selections / Offers</span>
                    </div>
                  </div>

                  {/* Company Description & Location */}
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px" }}>
                      <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#0f172a" }}>About {details?.name}</h4>
                      <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.6 }}>
                        {details?.description || "Enterprise partner engaged in campus placement drives and talent recruitment at Rathinam."}
                      </p>

                      {details?.notes && (
                        <div style={{ marginTop: "12px", padding: "10px 12px", background: "#f8fafc", borderRadius: "8px", fontSize: "12.5px", color: "#64748b" }}>
                          <strong>Engagement Notes:</strong> {details.notes}
                        </div>
                      )}
                    </div>

                    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <h4 style={{ margin: 0, fontSize: "14px", color: "#0f172a" }}>Office & Contact</h4>
                      
                      <div style={{ fontSize: "12.5px", color: "#475569" }}>
                        <strong style={{ display: "block", color: "#0f172a" }}>Location:</strong>
                        {details?.location || "Bengaluru, Karnataka"}
                      </div>

                      {details?.address && (
                        <div style={{ fontSize: "12.5px", color: "#475569" }}>
                          <strong style={{ display: "block", color: "#0f172a" }}>Address:</strong>
                          {details.address}
                        </div>
                      )}

                      <div style={{ fontSize: "12.5px", color: "#475569" }}>
                        <strong style={{ display: "block", color: "#0f172a" }}>Primary Contact:</strong>
                        {details?.contact_name || "Campus Hiring Team"} ({details?.contact_designation || "HR Lead"})
                        {details?.contact_email && (
                          <div style={{ marginTop: "2px" }}>
                            <a href={`mailto:${details.contact_email}`} style={{ color: "#2563eb", textDecoration: "none" }}>
                              {details.contact_email}
                            </a>
                          </div>
                        )}
                        {details?.contact_phone && (
                          <div style={{ marginTop: "2px" }}>
                            <a href={`tel:${details.contact_phone}`} style={{ color: "#475569", textDecoration: "none" }}>
                              {details.contact_phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  {canEdit && (
                    <div style={{ display: "flex", gap: "10px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          if (onAddRecruiter) onAddRecruiter(details.id);
                        }}
                      >
                        <Plus size={14} /> Add Recruiter
                      </button>

                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => {
                          if (onCreateDrive) onCreateDrive(details.id);
                        }}
                      >
                        <BriefcaseBusiness size={14} /> Create Placement Drive
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RECRUITERS */}
              {activeTab === "recruiters" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                      Recruiter Contacts ({details?.recruiters?.length ?? 0})
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        className="primary-button small-button"
                        onClick={() => {
                          if (onAddRecruiter) onAddRecruiter(details.id);
                        }}
                      >
                        <Plus size={14} /> Add Contact
                      </button>
                    )}
                  </div>

                  {!details?.recruiters || details.recruiters.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No recruiter contacts registered for this company yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {details.recruiters.map((rec) => (
                        <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", flexWrap: "wrap", gap: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className="recruiter-avatar-circle" style={{ width: "36px", height: "36px" }}>
                              {rec.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <strong style={{ fontSize: "14px", color: "#0f172a" }}>{rec.name}</strong>
                              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                                {rec.designation || "HR Lead"} &bull; {rec.department || "Talent Acquisition"}
                              </p>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12.5px", flexWrap: "wrap" }}>
                            {rec.last_contacted && (
                              <span style={{ color: "#64748b" }}>
                                Contacted: <strong>{new Date(rec.last_contacted).toLocaleDateString()}</strong>
                              </span>
                            )}
                            {rec.email && (
                              <a href={`mailto:${rec.email}`} style={{ color: "#2563eb", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Mail size={13} /> {rec.email}
                              </a>
                            )}
                            {rec.phone && (
                              <a href={`tel:${rec.phone}`} style={{ color: "#475569", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Phone size={13} /> {rec.phone}
                              </a>
                            )}
                            <span className="badge" style={{ background: rec.status === "ACTIVE" ? "#dcfce7" : "#f1f5f9", color: rec.status === "ACTIVE" ? "#15803d" : "#64748b" }}>
                              {rec.status}
                            </span>

                            <div style={{ display: "flex", gap: "6px" }}>
                              <button
                                type="button"
                                className="secondary-button small-button"
                                style={{ padding: "2px 6px", fontSize: "11.5px", height: "auto" }}
                                onClick={() => {
                                  if (onViewRecruiter) onViewRecruiter(rec);
                                }}
                              >
                                View
                              </button>
                              {canEdit && (
                                <button
                                  type="button"
                                  className="secondary-button small-button"
                                  style={{ padding: "2px 6px", fontSize: "11.5px", height: "auto" }}
                                  onClick={() => {
                                    if (onEditRecruiter) onEditRecruiter(rec);
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PLACEMENT DRIVES */}
              {activeTab === "drives" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                      Scheduled Placement Drives ({details?.drives?.length ?? 0})
                    </span>
                    {canEdit && (
                      <button
                        type="button"
                        className="primary-button small-button"
                        onClick={() => {
                          if (onCreateDrive) onCreateDrive(details.id);
                        }}
                      >
                        <Plus size={14} /> Create Drive
                      </button>
                    )}
                  </div>

                  {!details?.drives || details.drives.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No placement drives created for this company yet.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {details.drives.map((d) => (
                        <div key={d.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <strong style={{ fontSize: "15px", color: "#0f172a" }}>{d.title}</strong>
                              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                                Role: <strong>{d.job_role || d.title}</strong> &bull; CTC: <strong>{d.package_lpa}</strong> &bull; Mode: {d.work_mode}
                              </p>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <StatusBadge status={d.status} />
                              <button
                                type="button"
                                className="primary-button small-button"
                                style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)" }}
                                onClick={() => {
                                  if (onOpenATS) onOpenATS(d.id, d.title, details.name);
                                }}
                              >
                                <Sparkles size={13} /> ATS Match
                              </button>
                            </div>
                          </div>

                          {/* Drive Funnel Metrics */}
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", background: "#f8fafc", padding: "8px 12px", borderRadius: "8px", textAlign: "center", fontSize: "12px" }}>
                            <div>
                              <span style={{ color: "#64748b" }}>Applications</span>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>{d.applications_count ?? 0}</p>
                            </div>
                            <div>
                              <span style={{ color: "#64748b" }}>Shortlisted</span>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#2563eb" }}>{d.shortlisted_count ?? 0}</p>
                            </div>
                            <div>
                              <span style={{ color: "#64748b" }}>Interview</span>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#d97706" }}>{d.interview_count ?? 0}</p>
                            </div>
                            <div>
                              <span style={{ color: "#64748b" }}>Selected / Placed</span>
                              <p style={{ margin: 0, fontWeight: 800, fontSize: "14px", color: "#16a34a" }}>{d.offered_count ?? 0}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: JOB DESCRIPTIONS */}
              {activeTab === "jds" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                      Job Descriptions & Requirements ({details?.job_descriptions?.length ?? 0})
                    </span>
                  </div>

                  {!details?.job_descriptions || details.job_descriptions.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No Job Descriptions recorded for this company yet. Create a drive to add JDs.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {details.job_descriptions.map((jd) => (
                        <div key={jd.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                            <div>
                              <strong style={{ fontSize: "15px", color: "#0f172a" }}>{jd.job_title}</strong>
                              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                                Role: {jd.job_role} &bull; Min CGPA: <strong>{jd.min_cgpa}</strong> &bull; Max Backlogs: {jd.max_backlogs}
                              </p>
                            </div>

                            {canEdit && (
                              <button
                                type="button"
                                className="secondary-button small-button"
                                onClick={() => {
                                  if (onOpenJDUpload) onOpenJDUpload(jd.drive_id, jd.job_title);
                                }}
                              >
                                <FileText size={13} /> Upload / Parse JD File
                              </button>
                            )}
                          </div>

                          {/* Requirements Badges */}
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", fontSize: "12px" }}>
                            <strong style={{ color: "#475569" }}>Required Skills:</strong>
                            {jd.required_skills && jd.required_skills.length > 0 ? (
                              jd.required_skills.map((s, i) => (
                                <span key={i} className="badge" style={{ background: "#e0f2fe", color: "#0369a1" }}>
                                  {s}
                                </span>
                              ))
                            ) : (
                              <span style={{ color: "#94a3b8" }}>General / As per JD</span>
                            )}
                          </div>

                          {jd.description && (
                            <p style={{ margin: 0, fontSize: "12.5px", color: "#475569", background: "#f8fafc", padding: "10px 12px", borderRadius: "6px" }}>
                              {jd.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ELIGIBLE STUDENTS */}
              {activeTab === "eligible_students" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Eligible Candidates for {details?.name} Drives ({details?.eligible_students?.length ?? 0})
                  </span>

                  {!details?.eligible_students || details.eligible_students.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No eligible candidate records found.
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>REG NO</th>
                            <th>STUDENT NAME</th>
                            <th>DEPARTMENT</th>
                            <th>CGPA</th>
                            <th>SKILLS</th>
                            <th>STATUS</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.eligible_students.map((st) => (
                            <tr key={st.id}>
                              <td><strong>{st.registration_number}</strong></td>
                              <td>{st.name}</td>
                              <td><span className="badge" style={{ background: "#f1f5f9" }}>{st.department}</span></td>
                              <td><strong>{st.cgpa}</strong></td>
                              <td style={{ fontSize: "12px", color: "#475569", maxWidth: "200px" }}>{st.skills}</td>
                              <td><StatusBadge status={st.placement_status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: APPLICATIONS */}
              {activeTab === "applications" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Student Applications Submitted ({details?.applications?.length ?? 0})
                  </span>

                  {!details?.applications || details.applications.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No applications submitted for this company's drives yet.
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>CANDIDATE</th>
                            <th>DRIVE TITLE</th>
                            <th>DEPARTMENT</th>
                            <th>CGPA</th>
                            <th>STATUS</th>
                            <th>APPLIED AT</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.applications.map((app) => (
                            <tr key={app.id}>
                              <td>
                                <strong>{app.student_name}</strong>
                                <div style={{ fontSize: "11px", color: "#64748b" }}>{app.student_email}</div>
                              </td>
                              <td>{app.drive_title}</td>
                              <td><span className="badge" style={{ background: "#f1f5f9" }}>{app.department}</span></td>
                              <td><strong>{app.cgpa}</strong></td>
                              <td><StatusBadge status={app.status} /></td>
                              <td style={{ fontSize: "12px", color: "#64748b" }}>
                                {app.applied_at ? new Date(app.applied_at).toLocaleDateString() : "—"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: STUDENTS PLACED */}
              {activeTab === "placed_students" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#16a34a" }}>
                    🎉 Students Placed / Offered at {details?.name} ({details?.placed_students?.length ?? 0})
                  </span>

                  {!details?.placed_students || details.placed_students.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No placed student offers recorded for this company yet.
                    </div>
                  ) : (
                    <div className="table-wrap" style={{ maxHeight: "360px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>REG NO</th>
                            <th>STUDENT NAME</th>
                            <th>DEPARTMENT</th>
                            <th>CGPA</th>
                            <th>OFFER PACKAGE</th>
                            <th>DRIVE / DATE</th>
                          </tr>
                        </thead>
                        <tbody>
                          {details.placed_students.map((ps, i) => (
                            <tr key={i}>
                              <td><strong>{ps.registration_number}</strong></td>
                              <td><strong style={{ color: "#0f172a" }}>{ps.name}</strong></td>
                              <td><span className="badge" style={{ background: "#f1f5f9" }}>{ps.department}</span></td>
                              <td>{ps.cgpa}</td>
                              <td>
                                <span className="badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 800 }}>
                                  {ps.package_lpa}
                                </span>
                              </td>
                              <td style={{ fontSize: "12px", color: "#64748b" }}>
                                {ps.drive_title} {ps.placed_date && `(${new Date(ps.placed_date).toLocaleDateString()})`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 8: ACTIVITY / HISTORY */}
              {activeTab === "activity" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>
                    Company Activity & Audit Log
                  </span>

                  {!details?.activity_history || details.activity_history.length === 0 ? (
                    <div style={{ padding: "36px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                      No recent logged activities for this company.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "360px", overflowY: "auto" }}>
                      {details.activity_history.map((act) => (
                        <div key={act.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12.5px" }}>
                          <div>
                            <span className="badge" style={{ background: "#e2e8f0", color: "#334155", marginRight: "8px" }}>
                              {act.action}
                            </span>
                            <span style={{ color: "#0f172a", fontWeight: 600 }}>{act.entity_type}</span>
                            <span style={{ color: "#64748b", marginLeft: "6px" }}>
                              {JSON.stringify(act.details)}
                            </span>
                          </div>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
