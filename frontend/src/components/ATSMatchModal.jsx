import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ChevronDown,
  Download,
  Filter,
  GraduationCap,
  Layers,
  Percent,
  RefreshCw,
  Search,
  Sparkles,
  UserCheck,
  Users,
  X,
  XCircle,
  Zap,
} from "lucide-react";
import api from "../api";
import ExportPrintModal from "./ExportPrintModal";

export default function ATSMatchModal({ isOpen, onClose, driveId, driveTitle, companyName, onCandidateShortlisted }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilterTab, setActiveFilterTab] = useState("ALL"); // ALL, ELIGIBLE, HIGH_MATCH, APPLIED
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());
  const [shortlisting, setShortlisting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (isOpen && driveId) {
      loadAtsMatches();
    }
  }, [isOpen, driveId]);

  const showToast = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadAtsMatches() {
    setLoading(true);
    setError(null);
    setSelectedStudentIds(new Set());
    try {
      const res = await api(`/api/drives/${driveId}/ats-match`);
      setData(res);
    } catch (err) {
      setError(err.message || "Failed to calculate ATS match scores.");
    } finally {
      setLoading(false);
    }
  }

  const allMatches = data?.matches || [];

  // Filter candidate matches
  const filteredMatches = useMemo(() => {
    const q = search.toLowerCase().trim();
    return allMatches.filter((m) => {
      const matchesSearch =
        !q ||
        m.student_name.toLowerCase().includes(q) ||
        m.registration_number.toLowerCase().includes(q) ||
        m.department.toLowerCase().includes(q) ||
        m.skills.some((s) => s.toLowerCase().includes(q));

      const matchesDept = deptFilter === "ALL" || m.department === deptFilter;

      let matchesTab = true;
      if (activeFilterTab === "ELIGIBLE") matchesTab = m.is_eligible;
      else if (activeFilterTab === "HIGH_MATCH") matchesTab = m.ats_score >= 70;
      else if (activeFilterTab === "APPLIED") matchesTab = m.has_applied;

      return matchesSearch && matchesDept && matchesTab;
    });
  }, [allMatches, search, deptFilter, activeFilterTab]);

  const departmentsList = useMemo(() => {
    const set = new Set(allMatches.map((m) => m.department).filter(Boolean));
    return Array.from(set).sort();
  }, [allMatches]);

  const toggleSelectStudent = (id) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredMatches.map((m) => m.student_id).filter(Boolean);
    const allSelected = visibleIds.every((id) => selectedStudentIds.has(id));

    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  async function handleShortlistSelected() {
    if (selectedStudentIds.size === 0) return;
    setShortlisting(true);
    try {
      const res = await api(`/api/drives/${driveId}/ats-shortlist`, {
        method: "POST",
        body: JSON.stringify({ student_ids: Array.from(selectedStudentIds) }),
      });
      showToast(res.message || `Successfully shortlisted ${selectedStudentIds.size} candidates!`);
      setSelectedStudentIds(new Set());
      await loadAtsMatches();
      if (onCandidateShortlisted) onCandidateShortlisted();
    } catch (err) {
      showToast(err.message || "Failed to shortlist candidates.", "error");
    } finally {
      setShortlisting(false);
    }
  }

  async function handleShortlistSingle(studentId, studentName) {
    setShortlisting(true);
    try {
      const res = await api(`/api/drives/${driveId}/ats-shortlist`, {
        method: "POST",
        body: JSON.stringify({ student_ids: [studentId] }),
      });
      showToast(`${studentName} shortlisted successfully!`);
      await loadAtsMatches();
      if (onCandidateShortlisted) onCandidateShortlisted();
    } catch (err) {
      showToast(err.message || "Failed to shortlist candidate.", "error");
    } finally {
      setShortlisting(false);
    }
  }

  const exportColumns = [
    { key: "registration_number", label: "REG NO" },
    { key: "student_name", label: "CANDIDATE NAME" },
    { key: "department", label: "DEPARTMENT" },
    { key: "cgpa", label: "CGPA", accessor: (item) => item.cgpa || "—" },
    { key: "ats_score", label: "ATS MATCH %", accessor: (item) => `${item.ats_score}%` },
    { key: "is_eligible", label: "ELIGIBILITY", accessor: (item) => item.is_eligible ? "ELIGIBLE" : "NOT ELIGIBLE" },
    { key: "skills_match_pct", label: "SKILLS MATCH", accessor: (item) => `${item.skills_match_pct}%` },
    { key: "matched_skills", label: "MATCHED SKILLS", accessor: (item) => item.matched_skills?.join(", ") || "None" },
    { key: "missing_skills", label: "MISSING SKILLS", accessor: (item) => item.missing_skills?.join(", ") || "None" },
    { key: "application_status", label: "STATUS", accessor: (item) => item.application_status || (item.has_applied ? "APPLIED" : "NOT APPLIED") },
  ];

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-wide" style={{ maxWidth: "1100px", width: "95vw" }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", color: "#fff", padding: "10px", borderRadius: "10px" }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "19px", color: "#0f172a" }}>ATS Student Matcher</h2>
                <span className="badge" style={{ background: "#e0e7ff", color: "#4338ca", fontWeight: 700 }}>
                  AI Scoring Engine
                </span>
              </div>
              <p style={{ margin: "2px 0 0", fontSize: "13px", color: "#64748b" }}>
                {driveTitle || data?.drive_title || "Placement Drive"} &bull; {companyName || data?.company_name || "Partner Company"}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              className="secondary-button small-button"
              onClick={() => setShowExportModal(true)}
              disabled={loading || !data}
            >
              <Download size={14} /> Export Report
            </button>
            <button type="button" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {notification && (
            <div className={`inline-alert ${notification.tone === "error" ? "error" : "success"}`}>
              {notification.message}
            </div>
          )}

          {loading ? (
            <div style={{ padding: "60px 0", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto 16px auto" }} />
              <p style={{ fontSize: "14px", color: "#64748b", fontWeight: 600 }}>
                Evaluating candidate resumes & academic profiles against Job Description requirements…
              </p>
            </div>
          ) : error ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "20px", textAlign: "center", color: "#991b1b" }}>
              <AlertCircle size={32} style={{ margin: "0 auto 10px auto", color: "#dc2626" }} />
              <h3 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>Unable to Run ATS Match</h3>
              <p style={{ margin: 0, fontSize: "13.5px" }}>{error}</p>
              <button type="button" className="secondary-button" style={{ marginTop: "14px" }} onClick={loadAtsMatches}>
                <RefreshCw size={14} /> Retry Matching
              </button>
            </div>
          ) : (
            <>
              {/* Drive Requirements Overview Ribbon */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Target Drive Criteria
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginTop: "4px", flexWrap: "wrap", fontSize: "13px" }}>
                      <span><strong>Min CGPA:</strong> {data?.min_cgpa ?? 6.0}</span>
                      <span>&bull;</span>
                      <span><strong>Max Backlogs:</strong> {data?.max_backlogs ?? 0}</span>
                      <span>&bull;</span>
                      <span><strong>Target Depts:</strong> {data?.eligible_departments?.join(", ") || "All Streams"}</span>
                    </div>
                  </div>

                  {/* Summary KPI Counters */}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Evaluated</span>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{data?.total_candidates ?? 0}</p>
                    </div>

                    <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: "10.5px", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>Eligible</span>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#15803d" }}>{data?.eligible_count ?? 0}</p>
                    </div>

                    <div style={{ background: "#eef2ff", border: "1px solid #c7d2fe", borderRadius: "8px", padding: "6px 12px", textAlign: "center" }}>
                      <span style={{ fontSize: "10.5px", color: "#4338ca", fontWeight: 700, textTransform: "uppercase" }}>High Match (≥70%)</span>
                      <p style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#4f46e5" }}>{data?.high_match_count ?? 0}</p>
                    </div>
                  </div>
                </div>

                {/* Required & Preferred Skills Badges */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", fontSize: "12px", paddingTop: "6px", borderTop: "1px solid #edf2f7" }}>
                  <strong style={{ color: "#475569" }}>Required Skills:</strong>
                  {data?.required_skills && data.required_skills.length > 0 ? (
                    data.required_skills.map((s, idx) => (
                      <span key={idx} className="badge" style={{ background: "#e0f2fe", color: "#0369a1", fontWeight: 600 }}>
                        {s}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#94a3b8" }}>None specified</span>
                  )}

                  {data?.preferred_skills && data.preferred_skills.length > 0 && (
                    <>
                      <strong style={{ color: "#475569", marginLeft: "10px" }}>Preferred:</strong>
                      {data.preferred_skills.map((s, idx) => (
                        <span key={idx} className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                          {s}
                        </span>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Filter Tabs & Search Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
                  <button
                    type="button"
                    className={`pipeline-tab-button ${activeFilterTab === "ALL" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("ALL")}
                    style={{ padding: "6px 14px", fontSize: "12.5px" }}
                  >
                    All Candidates ({allMatches.length})
                  </button>

                  <button
                    type="button"
                    className={`pipeline-tab-button tab-completed ${activeFilterTab === "ELIGIBLE" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("ELIGIBLE")}
                    style={{ padding: "6px 14px", fontSize: "12.5px" }}
                  >
                    🎯 Eligible Only ({data?.eligible_count ?? 0})
                  </button>

                  <button
                    type="button"
                    className={`pipeline-tab-button tab-warm ${activeFilterTab === "HIGH_MATCH" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("HIGH_MATCH")}
                    style={{ padding: "6px 14px", fontSize: "12.5px" }}
                  >
                    ⚡ High Match ({data?.high_match_count ?? 0})
                  </button>

                  <button
                    type="button"
                    className={`pipeline-tab-button ${activeFilterTab === "APPLIED" ? "active" : ""}`}
                    onClick={() => setActiveFilterTab("APPLIED")}
                    style={{ padding: "6px 14px", fontSize: "12.5px" }}
                  >
                    Applied Already
                  </button>
                </div>

                {/* Batch Shortlist Action */}
                {selectedStudentIds.size > 0 && (
                  <button
                    type="button"
                    className="primary-button small-button"
                    onClick={handleShortlistSelected}
                    disabled={shortlisting}
                    style={{ background: "#16a34a" }}
                  >
                    <CheckCircle2 size={14} /> Shortlist {selectedStudentIds.size} Selected Candidate{selectedStudentIds.size > 1 ? "s" : ""}
                  </button>
                )}
              </div>

              {/* Search & Department Selector */}
              <div className="toolbar" style={{ margin: 0, padding: 0 }}>
                <div className="search-box" style={{ flex: 1 }}>
                  <Search size={16} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search candidate name, reg no, or specific skills..."
                  />
                </div>

                <div className="toolbar-filters">
                  <div className="select-box">
                    <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                      <option value="ALL">All Departments</option>
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={14} />
                  </div>
                </div>
              </div>

              {/* Candidate Matches Table */}
              {filteredMatches.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", background: "#f8fafc", borderRadius: "10px", color: "#64748b" }}>
                  <Users size={32} style={{ margin: "0 auto 8px auto", color: "#94a3b8" }} />
                  <strong style={{ display: "block", color: "#0f172a", fontSize: "15px" }}>No matching candidates found</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px" }}>Try clearing search terms or selecting a different filter tab.</p>
                </div>
              ) : (
                <div className="table-wrap" style={{ maxHeight: "380px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: "36px" }}>
                          <input
                            type="checkbox"
                            checked={filteredMatches.length > 0 && filteredMatches.every((m) => selectedStudentIds.has(m.student_id))}
                            onChange={toggleSelectAllVisible}
                          />
                        </th>
                        <th>CANDIDATE</th>
                        <th>DEPARTMENT</th>
                        <th>CGPA</th>
                        <th style={{ width: "160px" }}>ATS MATCH SCORE</th>
                        <th>ELIGIBILITY</th>
                        <th>SKILLS BREAKDOWN</th>
                        <th>STATUS</th>
                        <th style={{ textAlign: "right" }}>ACTION</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredMatches.map((m) => {
                        const isHigh = m.ats_score >= 75;
                        const isMid = m.ats_score >= 50 && m.ats_score < 75;
                        const scoreColor = isHigh ? "#16a34a" : isMid ? "#2563eb" : "#64748b";
                        const isSelected = selectedStudentIds.has(m.student_id);

                        return (
                          <tr key={m.student_id || m.registration_number} style={{ background: isSelected ? "rgba(37,99,235,0.03)" : undefined }}>
                            <td>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectStudent(m.student_id)}
                              />
                            </td>

                            <td>
                              <strong>{m.student_name}</strong>
                              <div style={{ fontSize: "11px", color: "#64748b" }}>{m.registration_number}</div>
                            </td>

                            <td>
                              <span className="badge" style={{ background: "#f1f5f9", color: "#334155" }}>
                                {m.department || "—"}
                              </span>
                            </td>

                            <td style={{ fontWeight: 700, color: "#0f172a" }}>
                              {m.cgpa > 0 ? m.cgpa.toFixed(2) : "—"}
                            </td>

                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <div style={{ flex: 1, height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                                  <div
                                    style={{
                                      width: `${m.ats_score}%`,
                                      height: "100%",
                                      background: isHigh
                                        ? "linear-gradient(90deg, #10b981, #059669)"
                                        : isMid
                                        ? "linear-gradient(90deg, #3b82f6, #2563eb)"
                                        : "#94a3b8",
                                      borderRadius: "4px",
                                    }}
                                  />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: "13px", color: scoreColor, width: "38px", textAlign: "right" }}>
                                  {m.ats_score}%
                                </span>
                              </div>
                            </td>

                            <td>
                              {m.is_eligible ? (
                                <span className="badge" style={{ background: "#dcfce7", color: "#15803d", fontWeight: 700 }}>
                                  <CheckCircle2 size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Eligible
                                </span>
                              ) : (
                                <span className="badge" style={{ background: "#fef2f2", color: "#b91c1c", fontWeight: 700 }}>
                                  <XCircle size={11} style={{ verticalAlign: "middle", marginRight: "3px" }} /> Ineligible
                                </span>
                              )}
                            </td>

                            <td>
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "200px" }}>
                                {m.matched_skills && m.matched_skills.length > 0 ? (
                                  m.matched_skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className="badge" style={{ fontSize: "10.5px", background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" }}>
                                      ✓ {s}
                                    </span>
                                  ))
                                ) : (
                                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>No direct skill match</span>
                                )}
                                {m.missing_skills && m.missing_skills.length > 0 && (
                                  <span style={{ fontSize: "10.5px", color: "#dc2626" }}>
                                    +{m.missing_skills.length} missing
                                  </span>
                                )}
                              </div>
                            </td>

                            <td>
                              {m.application_status ? (
                                <span className="badge" style={{ background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                                  {m.application_status}
                                </span>
                              ) : m.has_applied ? (
                                <span className="badge" style={{ background: "#f1f5f9", color: "#475569" }}>
                                  Applied
                                </span>
                              ) : (
                                <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Not Applied</span>
                              )}
                            </td>

                            <td style={{ textAlign: "right" }}>
                              {m.application_status === "SHORTLISTED" ? (
                                <span style={{ fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>Shortlisted</span>
                              ) : (
                                <button
                                  type="button"
                                  className="secondary-button small-button"
                                  style={{ fontSize: "11.5px", padding: "4px 8px" }}
                                  disabled={shortlisting}
                                  onClick={() => handleShortlistSingle(m.student_id, m.student_name)}
                                >
                                  Shortlist
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
          {data && (
            <button
              type="button"
              className="primary-button"
              onClick={handleShortlistSelected}
              disabled={selectedStudentIds.size === 0 || shortlisting}
              style={{ background: "#16a34a" }}
            >
              <CheckCircle2 size={16} /> Shortlist {selectedStudentIds.size > 0 ? `${selectedStudentIds.size} Selected` : "Candidates"}
            </button>
          )}
        </div>

      </div>

      {/* Export Report Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title={`ATS Match Report - ${driveTitle || "Placement Drive"}`}
        filename={`ats_match_${driveId}`}
        columns={exportColumns}
        data={filteredMatches}
        filtersSummary={`Drive: ${driveTitle} | Min CGPA: ${data?.min_cgpa ?? 6.0} | Filter: ${activeFilterTab}`}
      />
    </div>
  );
}
