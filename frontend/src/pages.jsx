import React, { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileText,
  GraduationCap,
  Search,
  Users,
  BriefcaseBusiness,
  TrendingUp,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Filter,
  Download,
  Printer,
  X,
  Zap,
  Activity,
  RotateCcw,
  ExternalLink,
  Phone,
  Mail,
  Globe,
  Award,
  Sun,
  Moon,
  Laptop,
  Shield,
  Lock,
  BellRing,
  Sliders,
  LogOut,
  Settings as SettingsIcon,
  Info,
  UserCheck,
  ShieldAlert,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import ExportPrintModal from "./components/ExportPrintModal";
import StudentImportModal from "./components/StudentImportModal";

const API_BASE = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000")).replace(/\/$/, "");
const API = API_BASE;

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem("rportal_session"))?.user || null;
  } catch {
    return null;
  }
}

export function getUserRole() {
  return getUser()?.role || "LEAD";
}

export function isAdmin() {
  return getUserRole() === "ADMIN";
}

export function canManageStudents() {
  const role = getUserRole();
  return role === "ADMIN" || role === "MANAGER";
}

export function canManagePlacementTeam() {
  const role = getUserRole();
  return role === "ADMIN" || role === "LEAD";
}

export function canManageRecruiters() {
  return getUserRole() === "ADMIN";
}

export function canManageDrives() {
  return getUserRole() === "ADMIN";
}

export function canManageApplications() {
  return getUserRole() === "ADMIN";
}

export async function api(path, options = {}) {
  const token = localStorage.getItem("rportal_token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorDetail = `Request failed: ${response.status}`;
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorJson.message || errorDetail;
    } catch {
      const errorText = await response.text();
      if (errorText) errorDetail = errorText;
    }
    throw new Error(errorDetail);
  }

  if (response.status === 204) return null;
  return response.json();
}

export function LoadingState({ message = "Loading operational data…" }) {
  return (
    <div className="state-card">
      <div className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export function EmptyState({ title = "No records found", message = "No data matches your criteria." }) {
  return (
    <div className="state-card">
      <FileText size={30} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

export function ErrorState({ message }) {
  return (
    <div className="state-card error-state">
      <AlertCircle size={30} />
      <strong>Unable to load data</strong>
      <span>{message}</span>
    </div>
  );
}

export function StatCard({ icon: Icon, title, value, subtitle, tone = "" }) {
  return (
    <div className={`stat-card ${tone}`}>
      <div className="stat-icon">
        <Icon size={20} />
      </div>
      <div className="stat-content">
        <span>{title}</span>
        <strong>{value ?? 0}</strong>
        {subtitle && <small>{subtitle}</small>}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const raw = String(status || "—");
  const formatted = raw.replaceAll("_", " ").toLowerCase();

  return (
    <span className={`status-badge status-${formatted.replaceAll(" ", "-")}`}>
      <span className="status-dot" />
      {raw.replaceAll("_", " ").toUpperCase()}
    </span>
  );
}

function SortHeader({ label, sortKey, currentSort, onSort }) {
  const isSorted = currentSort.key === sortKey;
  const isAsc = isSorted && currentSort.direction === "asc";

  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ cursor: "pointer", userSelect: "none" }}
      title={`Sort by ${label}`}
    >
      <div style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <span>{label}</span>
        {isSorted ? (
          isAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        ) : (
          <span style={{ opacity: 0.3 }}>⇅</span>
        )}
      </div>
    </th>
  );
}

/* =========================================================
   1. DASHBOARD / OVERVIEW
========================================================= */

export function Dashboard() {
  const [data, setData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [drives, setDrives] = useState([]);
  const [applications, setApplications] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const [dashboardData, companyData, driveData, appData, auditData] =
          await Promise.all([
            api("/api/dashboard"),
            api("/api/companies"),
            api("/api/drives"),
            api("/api/applications"),
            api("/api/audit"),
          ]);

        if (!active) return;
        setData(dashboardData);
        setCompanies(Array.isArray(companyData) ? companyData : []);
        setDrives(Array.isArray(driveData) ? driveData : []);
        setApplications(Array.isArray(appData) ? appData : []);
        setAudit(Array.isArray(auditData) ? auditData : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const stats = data || {};
  const totalStudents = stats.total_students ?? 0;
  const eligibleStudents = stats.eligible_students ?? 0;
  const placedStudents = stats.placed_students ?? 0;
  const placementPercentage = stats.placement_percentage ?? 0;
  const activeDrives = stats.active_drives ?? 0;
  const totalCompanies = stats.total_companies ?? companies.length;
  const totalApplications = stats.total_applications ?? applications.length;
  const offers = stats.offers ?? 0;
  const unplacedStudents = Math.max(Number(totalStudents) - Number(placedStudents), 0);

  const hotCount = companies.filter((c) => String(c.recruiter_status).toUpperCase() === "HOT").length;
  const warmCount = companies.filter((c) => String(c.recruiter_status).toUpperCase() === "WARM").length;
  const coldCount = companies.filter((c) => String(c.recruiter_status).toUpperCase() === "COLD").length;
  const driveCompletedCount = companies.filter((c) => ["DRIVE_COMPLETED", "DRIVE COMPLETED"].includes(String(c.recruiter_status).toUpperCase())).length;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLACEMENT OPERATIONS</span>
          <h1>Overview</h1>
          <p>Real-time placement intelligence and recruitment operations.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Users} title="Total Students" value={totalStudents} subtitle="In placement system" />
        <StatCard icon={CheckCircle2} title="Eligible Students" value={eligibleStudents} subtitle="Placement eligible" tone="blue" />
        <StatCard icon={GraduationCap} title="Placed Students" value={placedStudents} subtitle="Secured offers" tone="green" />
        <StatCard icon={TrendingUp} title="Placement %" value={`${Number(placementPercentage).toFixed(1)}%`} subtitle="Placement rate" tone="purple" />
        <StatCard icon={BriefcaseBusiness} title="Active Drives" value={activeDrives} subtitle="Open opportunities" />
        <StatCard icon={Building2} title="Companies" value={totalCompanies} subtitle="Registered partners" tone="blue" />
        <StatCard icon={FileText} title="Applications" value={totalApplications} subtitle="Student applications" />
        <StatCard icon={Award} title="Offers" value={offers} subtitle="Offer selections" tone="green" />
      </div>

      <div className="dashboard-grid">
        <section className="panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Placement Position</h2>
              <p>Placed vs unplaced student distribution</p>
            </div>
          </div>

          <div className="placement-overview">
            <div className="placement-circle">
              <div>
                <strong>{Number(placementPercentage).toFixed(0)}%</strong>
                <span>Placed</span>
              </div>
            </div>

            <div className="placement-legend">
              <div>
                <span className="legend-dot placed" />
                <div>
                  <strong>{placedStudents}</strong>
                  <span>Placed students</span>
                </div>
              </div>
              <div>
                <span className="legend-dot unplaced" />
                <div>
                  <strong>{unplacedStudents}</strong>
                  <span>Unplaced students</span>
                </div>
              </div>
              <div>
                <span className="legend-dot" style={{ background: "#3b82f6" }} />
                <div>
                  <strong>{eligibleStudents}</strong>
                  <span>Eligible pool</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recruiter Momentum</h2>
              <p>Company engagement classification</p>
            </div>
          </div>

          <div className="momentum-list">
            <div className="momentum-row">
              <StatusBadge status="HOT" />
              <strong>{hotCount}</strong>
            </div>
            <div className="momentum-row">
              <StatusBadge status="WARM" />
              <strong>{warmCount}</strong>
            </div>
            <div className="momentum-row">
              <StatusBadge status="COLD" />
              <strong>{coldCount}</strong>
            </div>
            <div className="momentum-row">
              <StatusBadge status="DRIVE COMPLETED" />
              <strong>{driveCompletedCount}</strong>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid bottom-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Placement Drives</h2>
              <p>Latest active recruitment drives</p>
            </div>
          </div>

          {drives.length === 0 ? (
            <EmptyState title="No drives available" message="Placement drives will appear here once registered." />
          ) : (
            <div className="compact-list">
              {drives.slice(0, 5).map((drive, index) => (
                <div className="compact-row" key={drive.id || index}>
                  <div>
                    <strong>{drive.title || "Placement Drive"}</strong>
                    <span>{drive.company?.name || drive.location || "Company location"}</span>
                  </div>
                  <StatusBadge status={drive.status || "DRAFT"} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Operational Activity</h2>
              <p>Audit trail of changes across R-PORTAL</p>
            </div>
          </div>

          {audit.length === 0 ? (
            <EmptyState title="No activity recorded" message="Recent platform operations will appear here." />
          ) : (
            <div className="compact-list">
              {audit.slice(0, 5).map((item, index) => (
                <div className="activity-row" key={item.id || index}>
                  <div className="activity-icon">
                    <Clock3 size={16} />
                  </div>
                  <div>
                    <strong>{item.action} &bull; {item.entity_type}</strong>
                    <span>{item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

/* =========================================================
   2. STUDENTS DETAILS
========================================================= */

export function Students() {
  const canEdit = canManageStudents();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "add", "edit", "view", "delete"
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    registration_number: "",
    name: "",
    email: "",
    phone: "",
    department: "",
    cgpa: "",
    placement_status: "SEEKING",
    is_eligible: true,
  });

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadStudents() {
    try {
      setLoading(true);
      const result = await api("/api/students");
      setStudents(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  async function handleAddStudent() {
    if (!formData.registration_number.trim() || !formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      showNotification("Please fill all required fields: Reg. No, Name, Email, Department.", "error");
      return;
    }
    try {
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      showNotification(`Student ${formData.name} added successfully!`);
      setModalMode(null);
      await loadStudents();
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  async function handleEditStudent() {
    if (!formData.registration_number.trim() || !formData.name.trim() || !formData.email.trim() || !formData.department.trim()) {
      showNotification("Please fill all required fields.", "error");
      return;
    }
    try {
      await api(`/api/students/${selectedStudent.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      showNotification(`Student ${formData.name} updated successfully!`);
      setModalMode(null);
      await loadStudents();
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  async function handleDeleteStudent() {
    try {
      await api(`/api/students/${selectedStudent.id}`, { method: "DELETE" });
      showNotification(`Student ${selectedStudent.name} deleted successfully!`);
      setModalMode(null);
      await loadStudents();
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const departments = useMemo(() => {
    return [...new Set(students.map((s) => s.department).filter(Boolean))].sort();
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = students.filter((student) => {
      const matchesSearch =
        !q ||
        String(student.name || "").toLowerCase().includes(q) ||
        String(student.registration_number || "").toLowerCase().includes(q) ||
        String(student.email || "").toLowerCase().includes(q) ||
        String(student.phone || "").toLowerCase().includes(q);

      const matchesDept =
        department === "ALL" ||
        String(student.department || "").toUpperCase() === department.toUpperCase();

      const studentStatus = String(student.placement_status || "SEEKING").toUpperCase();
      const matchesStatus = status === "ALL" || studentStatus === status;

      return matchesSearch && matchesDept && matchesStatus;
    });

    list.sort((a, b) => {
      let aVal = a[sort.key];
      let bVal = b[sort.key];
      if (sort.key === "cgpa") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [students, search, department, status, sort]);

  const exportColumns = [
    { key: "sno", label: "S.NO", accessor: (_, idx) => idx + 1 },
    { key: "registration_number", label: "REG. NUMBER" },
    { key: "name", label: "STUDENT NAME" },
    { key: "department", label: "DEPARTMENT" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE", accessor: (item) => item.phone || "—" },
    { key: "cgpa", label: "CGPA", accessor: (item) => item.cgpa || "—" },
    { key: "placement_status", label: "PLACEMENT STATUS", accessor: (item) => item.placement_status || "SEEKING" },
  ];

  if (loading) return <LoadingState />;
  if (error && students.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      {notification && (
        <div className={`inline-alert ${notification.tone === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="page-heading">
        <div>
          <span className="eyebrow">STUDENT MANAGEMENT</span>
          <h1>Student Details ({students.length})</h1>
          <p>Complete records of students participating in college placement operations.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>

          {canEdit ? (
            <>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setShowImportModal(true)}
              >
                <UploadCloud size={16} />
                Import Excel / CSV
              </button>

              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setFormData({
                    registration_number: "",
                    name: "",
                    email: "",
                    phone: "",
                    department: "",
                    cgpa: "",
                    placement_status: "SEEKING",
                    is_eligible: true,
                  });
                  setModalMode("add");
                }}
              >
                <Plus size={17} />
                Add Student
              </button>
            </>
          ) : (
            <span className="badge-pill lead-pill" title="View-only access for Lead role">
              VIEW ONLY (LEAD)
            </span>
          )}
        </div>
      </div>

      {!canEdit && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "10px 14px", borderRadius: "6px", fontSize: "0.85rem", color: "#64748b", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <Info size={16} style={{ color: "#3b82f6", flexShrink: 0 }} />
          <span><strong>Role Notice:</strong> You are viewing student records with <b>LEAD</b> permissions (View-Only). Manager or Admin privileges are required to add, edit, delete, or batch import students.</span>
        </div>
      )}

      <div className="inline-kpis">
        <div className="mini-kpi">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>
        <div className="mini-kpi">
          <span>Placed</span>
          <strong>{students.filter((s) => String(s.placement_status).toUpperCase() === "PLACED").length}</strong>
        </div>
        <div className="mini-kpi">
          <span>Seeking Placement</span>
          <strong>{students.filter((s) => String(s.placement_status).toUpperCase() === "SEEKING").length}</strong>
        </div>
        <div className="mini-kpi">
          <span>Matching Filters</span>
          <strong>{filteredStudents.length}</strong>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, registration number, email or phone..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <Filter size={16} />
              <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="ALL">All Departments ({departments.length})</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept.toUpperCase()}>
                    {dept}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>

            <div className="select-box">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="PLACED">Placed</option>
                <option value="SEEKING">Seeking</option>
                <option value="NOT_ELIGIBLE">Not Eligible</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {(search || department !== "ALL" || status !== "ALL") && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setDepartment("ALL");
                  setStatus("ALL");
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <EmptyState
            title="No matching students found"
            message="Adjust your search query or filters to find student records."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="S.NO" sortKey="id" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="REG. NO." sortKey="registration_number" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="NAME" sortKey="name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="DEPARTMENT" sortKey="department" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="EMAIL" sortKey="email" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="PHONE" sortKey="phone" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="CGPA" sortKey="cgpa" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="PLACEMENT" sortKey="placement_status" currentSort={sort} onSort={handleSort} />
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student.id || index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{student.registration_number || "—"}</strong>
                    </td>
                    <td>{student.name || "—"}</td>
                    <td>{student.department || "—"}</td>
                    <td>{student.email || "—"}</td>
                    <td>{student.phone || "—"}</td>
                    <td>{student.cgpa || "—"}</td>
                    <td>
                      <StatusBadge status={student.placement_status || "SEEKING"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => {
                            setSelectedStudent(student);
                            setFormData(student);
                            setModalMode("view");
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              title="Edit Student"
                              onClick={() => {
                                setSelectedStudent(student);
                                setFormData(student);
                                setModalMode("edit");
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete Student"
                              className="danger-icon"
                              onClick={() => {
                                setSelectedStudent(student);
                                setModalMode("delete");
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export & Print Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Student Details Report"
        filename="students_report"
        columns={exportColumns}
        data={filteredStudents}
        filtersSummary={`Dept: ${department} | Status: ${status} | Search: "${search || "None"}"`}
      />

      {/* View Modal */}
      {modalMode === "view" && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Information</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number</label>
                <p><strong>{selectedStudent.registration_number}</strong></p>
              </div>
              <div className="form-group">
                <label>Full Name</label>
                <p>{selectedStudent.name}</p>
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <p>{selectedStudent.email}</p>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <p>{selectedStudent.phone || "—"}</p>
              </div>
              <div className="form-group">
                <label>Department</label>
                <p>{selectedStudent.department}</p>
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <p>{selectedStudent.cgpa || "—"}</p>
              </div>
              <div className="form-group">
                <label>Placement Status</label>
                <p><StatusBadge status={selectedStudent.placement_status || "SEEKING"} /></p>
              </div>
              {selectedStudent.offer_package_lpa && (
                <div className="form-group">
                  <label>Package (LPA)</label>
                  <p>{selectedStudent.offer_package_lpa}</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {modalMode === "add" && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Student</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  placeholder="e.g., 2026-CSE-001"
                />
              </div>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 XXXXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="CSE / ECE / MECH / IT"
                />
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa || ""}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                  placeholder="8.5"
                />
              </div>
              <div className="form-group">
                <label>Placement Status</label>
                <select
                  value={formData.placement_status}
                  onChange={(e) => setFormData({ ...formData, placement_status: e.target.value })}
                >
                  <option value="SEEKING">Seeking</option>
                  <option value="PLACED">Placed</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleAddStudent}>
                Add Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalMode === "edit" && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Student</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Student Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={formData.cgpa || ""}
                  onChange={(e) => setFormData({ ...formData, cgpa: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Placement Status</label>
                <select
                  value={formData.placement_status}
                  onChange={(e) => setFormData({ ...formData, placement_status: e.target.value })}
                >
                  <option value="SEEKING">Seeking</option>
                  <option value="PLACED">Placed</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleEditStudent}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && canEdit && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Student Record</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{selectedStudent.name}</strong> ({selectedStudent.registration_number})?
              </p>
              <p style={{ color: "#ef4444", marginTop: "8px", fontSize: "13px" }}>
                This will remove the student record and related application entries from R-PORTAL.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" style={{ background: "#ef4444" }} onClick={handleDeleteStudent}>
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Import Modal */}
      <StudentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={(res) => {
          showNotification(res.message || "Students imported successfully!");
          loadStudents();
        }}
      />
    </div>
  );
}

/* =========================================================
   3. PLACEMENT TEAM
========================================================= */

export function PlacementTeam() {
  const canEdit = canManagePlacementTeam();
  const [members, setMembers] = useState([]);
  const [drives, setDrives] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "add", "edit", "view", "assign"
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [formData, setFormData] = useState({
    user_id: "",
    role: "Placement Officer",
    responsibility: "",
    department: "",
    phone: "",
    assignment: "",
    is_active: true,
    is_team_lead: false,
  });

  const teamFileInputRef = useRef(null);

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const [teamResult, driveResult, usersResult] = await Promise.all([
        api("/api/placement-team"),
        api("/api/drives"),
        api("/api/users"),
      ]);

      setMembers(Array.isArray(teamResult) ? teamResult : []);
      setDrives(Array.isArray(driveResult) ? driveResult : []);
      setUsers(Array.isArray(usersResult) ? usersResult : []);
    } catch (err) {
      setError(err.message || "Unable to load placement team data.");
      showNotification(err.message || "Unable to load placement team data.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleImportExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      setImportFeedback({ tone: "error", message: "Only .xlsx and .xls files are supported." });
      event.target.value = "";
      return;
    }
    setImporting(true);
    setImportFeedback(null);
    try {
      const upload = new FormData();
      upload.append("file", file);
      const token = localStorage.getItem("rportal_token");
      const response = await fetch(`${API_BASE}/api/placement-team/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: upload,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof payload.detail === "string" ? payload.detail : "The team file could not be imported.");
      setImportFeedback({ tone: "success", message: `Imported ${payload.imported ?? 0} team members. ${payload.duplicates ?? 0} duplicates skipped.` });
      showNotification(`Imported ${payload.imported ?? 0} team members.`);
      await loadAll();
    } catch (err) {
      setImportFeedback({ tone: "error", message: err.message || "Unable to import team file." });
      showNotification(err.message || "Unable to import team file.", "error");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const roleOptions = useMemo(
    () => [...new Set(members.map((m) => m.role).filter(Boolean))].sort(),
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase().trim();

    let list = members.filter((member) => {
      const name = member.user?.full_name || "";
      const email = member.user?.email || "";
      const roleVal = String(member.role || "");
      const resp = String(member.responsibility || "");
      const dept = String(member.department || "");

      const matchesSearch =
        !q ||
        `${name} ${email} ${roleVal} ${resp} ${dept}`.toLowerCase().includes(q);

      const matchesRole = roleFilter === "ALL" || roleVal === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && member.is_active) ||
        (statusFilter === "INACTIVE" && !member.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });

    list.sort((a, b) => {
      let aVal = a[sort.key] || (sort.key === "name" ? a.user?.full_name : "") || "";
      let bVal = b[sort.key] || (sort.key === "name" ? b.user?.full_name : "") || "";
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [members, search, roleFilter, statusFilter, sort]);

  const handleCreateMember = async () => {
    if (!formData.user_id || !formData.role || !formData.responsibility.trim()) {
      showNotification("Please select a user and specify role and responsibility.", "error");
      return;
    }

    setSaving(true);
    try {
      await api("/api/placement-team", {
        method: "POST",
        body: JSON.stringify({
          user_id: Number(formData.user_id),
          role: formData.role,
          responsibility: formData.responsibility,
          department: formData.department,
          phone: formData.phone,
          assignment: formData.assignment,
          is_active: formData.is_active,
          is_team_lead: formData.is_team_lead,
        }),
      });

      showNotification("Team member added successfully.");
      setModalMode(null);
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to add team member.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    if (!formData.role || !formData.responsibility.trim()) {
      showNotification("Role and responsibility are required.", "error");
      return;
    }

    setSaving(true);
    try {
      await api(`/api/placement-team/${selectedMember.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          role: formData.role,
          responsibility: formData.responsibility,
          department: formData.department,
          phone: formData.phone,
          assignment: formData.assignment,
          is_active: formData.is_active,
          is_team_lead: formData.is_team_lead,
        }),
      });

      showNotification("Team member updated successfully.");
      setModalMode(null);
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to update team member.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (member) => {
    setSaving(true);
    try {
      await api(`/api/placement-team/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !member.is_active }),
      });

      showNotification(
        member.is_active ? "Team member deactivated." : "Team member activated.",
        member.is_active ? "warning" : "success"
      );
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to update team member status.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAssignDrive = async () => {
    if (!selectedMember || !selectedDriveId) {
      showNotification("Select a placement drive to assign.", "error");
      return;
    }

    setSaving(true);
    try {
      await api(`/api/placement-team/${selectedMember.id}/drives`, {
        method: "POST",
        body: JSON.stringify({
          drive_id: Number(selectedDriveId),
          responsibility: formData.assignment || selectedMember.responsibility,
        }),
      });

      showNotification("Drive assigned successfully.");
      setModalMode(null);
      setSelectedDriveId("");
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to assign the drive.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment = async (memberId, driveId, driveTitle) => {
    if (!window.confirm(`Remove ${driveTitle || "this drive"} assignment from this team member?`)) {
      return;
    }

    setSaving(true);
    try {
      await api(`/api/placement-team/${memberId}/drives/${driveId}`, {
        method: "DELETE",
      });

      showNotification("Drive assignment removed.", "warning");
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to remove the assignment.", "error");
    } finally {
      setSaving(false);
    }
  };

  const exportColumns = [
    { key: "name", label: "NAME", accessor: (item) => item.user?.full_name || "—" },
    { key: "email", label: "EMAIL", accessor: (item) => item.user?.email || "—" },
    { key: "role", label: "ROLE" },
    { key: "responsibility", label: "RESPONSIBILITY" },
    { key: "department", label: "DEPARTMENT", accessor: (item) => item.department || "—" },
    { key: "status", label: "STATUS", accessor: (item) => (item.is_active ? "Active" : "Inactive") },
    {
      key: "assigned_drives",
      label: "ASSIGNED DRIVES",
      accessor: (item) =>
        (item.assigned_drives || []).map((d) => d.title).join(", ") || "None",
    },
  ];

  if (loading) return <LoadingState />;
  if (error && members.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      {notification && (
        <div className={`inline-alert ${notification.tone === "error" ? "error" : notification.tone === "warning" ? "warning" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERATIONAL COORDINATION</span>
          <h1>Placement Team ({members.length})</h1>
          <p>Coordinate placement responsibilities, faculty coordinators, and drive assignments.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>

          {canEdit && (
            <>
              <input ref={teamFileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportExcel} />
              <button
                className="secondary-button"
                type="button"
                onClick={() => teamFileInputRef.current?.click()}
                disabled={importing}
              >
                <Download size={16} />
                {importing ? "Importing..." : "Import Excel"}
              </button>
              <button
                className="primary-button"
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setFormData({
                    user_id: users[0]?.id ? String(users[0].id) : "",
                    role: "Placement Officer",
                    responsibility: "",
                    department: "",
                    phone: "",
                    assignment: "",
                    is_active: true,
                    is_team_lead: false,
                  });
                  setModalMode("add");
                }}
              >
                <Plus size={17} />
                Add Team Member
              </button>
            </>
          )}
        </div>
      </div>

      {importFeedback && (
        <div className={`inline-alert ${importFeedback.tone === "error" ? "error" : "success"}`}>
          {importFeedback.message}
        </div>
      )}

      <div className="inline-kpis">
        <StatCard icon={Users} title="Total Members" value={members.length} />
        <StatCard icon={CheckCircle2} title="Active Members" value={members.filter((m) => m.is_active).length} />
        <StatCard icon={TrendingUp} title="Team Leads" value={members.filter((m) => m.is_active && m.is_team_lead).length} />
        <StatCard
          icon={BriefcaseBusiness}
          title="Assigned Drives"
          value={new Set(members.flatMap((m) => (m.assigned_drives || []).map((d) => d.id))).size}
        />
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, role or responsibility..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="ALL">All Roles ({roleOptions.length})</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>

            <div className="select-box">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {(search || roleFilter !== "ALL" || statusFilter !== "ALL") && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setRoleFilter("ALL");
                  setStatusFilter("ALL");
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <EmptyState
            title="No placement team members found"
            message="Add team members to assign roles and manage drives."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="NAME" sortKey="name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="EMAIL" sortKey="email" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="ROLE" sortKey="role" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="RESPONSIBILITY" sortKey="responsibility" currentSort={sort} onSort={handleSort} />
                  <th>ASSIGNED DRIVES</th>
                  <SortHeader label="STATUS" sortKey="is_active" currentSort={sort} onSort={handleSort} />
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id || index}>
                    <td>
                      <strong>{member.user?.full_name || "—"}</strong>
                      {member.is_team_lead && <span className="badge-pill lead-pill">Lead</span>}
                    </td>
                    <td>{member.user?.email || "—"}</td>
                    <td>{member.role || "—"}</td>
                    <td>{member.responsibility || "—"}</td>
                    <td>
                      {(member.assigned_drives || []).length > 0 ? (
                        <div className="inline-tags">
                          {(member.assigned_drives || []).slice(0, 3).map((drive) => (
                            <span key={drive.id} className="tag-button">
                              {drive.title || "Drive"}
                            </span>
                          ))}
                          {(member.assigned_drives || []).length > 3 && (
                            <span className="tag-more">+{member.assigned_drives.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <StatusBadge status={member.is_active ? "active" : "inactive"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => {
                            setSelectedMember(member);
                            setModalMode("view");
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              title="Edit Member"
                              onClick={() => {
                                setSelectedMember(member);
                                setFormData({
                                  user_id: String(member.user_id),
                                  role: member.role || "Placement Officer",
                                  responsibility: member.responsibility || "",
                                  department: member.department || "",
                                  phone: member.phone || "",
                                  assignment: member.assignment || "",
                                  is_active: Boolean(member.is_active),
                                  is_team_lead: Boolean(member.is_team_lead),
                                });
                                setModalMode("edit");
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title={member.is_active ? "Deactivate" : "Activate"}
                              className="secondary-button small-button"
                              onClick={() => handleToggleActive(member)}
                              disabled={saving}
                            >
                              {member.is_active ? "Deactivate" : "Activate"}
                            </button>
                            <button
                              type="button"
                              title="Assign Placement Drive"
                              className="secondary-button small-button"
                              onClick={() => {
                                setSelectedMember(member);
                                setSelectedDriveId("");
                                setModalMode("assign");
                              }}
                            >
                              Assign
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export & Print Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Placement Team Directory"
        filename="placement_team"
        columns={exportColumns}
        data={filteredMembers}
        filtersSummary={`Role: ${roleFilter} | Status: ${statusFilter}`}
      />

      {/* View Modal */}
      {modalMode === "view" && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Team Member Details</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name</label>
                <p><strong>{selectedMember.user?.full_name || "—"}</strong></p>
              </div>
              <div className="form-group">
                <label>Email</label>
                <p>{selectedMember.user?.email || "—"}</p>
              </div>
              <div className="form-group">
                <label>Phone</label>
                <p>{selectedMember.phone || "—"}</p>
              </div>
              <div className="form-group">
                <label>Role</label>
                <p>{selectedMember.role || "—"}</p>
              </div>
              <div className="form-group">
                <label>Responsibility</label>
                <p>{selectedMember.responsibility || "—"}</p>
              </div>
              <div className="form-group">
                <label>Department</label>
                <p>{selectedMember.department || "—"}</p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p><StatusBadge status={selectedMember.is_active ? "active" : "inactive"} /></p>
              </div>
              <div className="form-group">
                <label>Assigned Drives ({selectedMember.assigned_drives?.length || 0})</label>
                <div className="inline-tags" style={{ marginTop: "6px" }}>
                  {(selectedMember.assigned_drives || []).length > 0 ? (
                    selectedMember.assigned_drives.map((d) => (
                      <span key={d.id} className="tag-button">
                        {d.title}
                        {canEdit && (
                          <button
                            type="button"
                            className="tag-remove-x"
                            onClick={() => handleRemoveAssignment(selectedMember.id, d.id, d.title)}
                            title="Remove assignment"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))
                  ) : (
                    <span>No drives currently assigned</span>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {modalMode === "add" && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Team Member</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>User Account *</label>
                  <select value={formData.user_id} onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}>
                    <option value="">Select registered user</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.full_name} ({u.email} - {u.role})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Team Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Placement Coordinator">Placement Coordinator</option>
                    <option value="Faculty Coordinator">Faculty Coordinator</option>
                    <option value="Student Coordinator">Student Coordinator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Responsibility Area *</label>
                  <input
                    type="text"
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    placeholder="e.g., Student Eligibility Verification"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Placement Cell / CSE"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 XXXXXXXXXX"
                  />
                </div>
                <div className="form-group">
                  <label>Drive Assignment (Optional)</label>
                  <input
                    type="text"
                    value={formData.assignment}
                    onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                    placeholder="Drive Lead / Coordinator"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group checkbox-row">
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active team member
                  </label>
                </div>
                <div className="form-group checkbox-row">
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_team_lead}
                      onChange={(e) => setFormData({ ...formData, is_team_lead: e.target.checked })}
                    />
                    Team Lead privilege
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleCreateMember} disabled={saving}>
                {saving ? "Saving..." : "Add Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modalMode === "edit" && canEdit && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Team Member</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Team Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Placement Coordinator">Placement Coordinator</option>
                    <option value="Faculty Coordinator">Faculty Coordinator</option>
                    <option value="Student Coordinator">Student Coordinator</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Responsibility *</label>
                  <input
                    type="text"
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group checkbox-row">
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active
                  </label>
                </div>
                <div className="form-group checkbox-row">
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_team_lead}
                      onChange={(e) => setFormData({ ...formData, is_team_lead: e.target.checked })}
                    />
                    Team Lead
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleUpdateMember} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Drive Modal */}
      {modalMode === "assign" && canEdit && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Placement Drive</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Team Member</label>
                <p><strong>{selectedMember.user?.full_name}</strong> ({selectedMember.role})</p>
              </div>

              <div className="form-group">
                <label>Select Placement Drive *</label>
                <select value={selectedDriveId} onChange={(e) => setSelectedDriveId(e.target.value)}>
                  <option value="">Choose a drive to assign</option>
                  {drives.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.company?.name || "Company"} - {d.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Specific Responsibility</label>
                <input
                  type="text"
                  value={formData.assignment}
                  onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                  placeholder="e.g., Campus Drive Coordinator"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleAssignDrive} disabled={saving}>
                {saving ? "Assigning..." : "Assign Drive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   4. RECRUITERS & COMPANY PIPELINE
========================================================= */

export function Recruiters() {
  const canEdit = canManageRecruiters();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState("ALL");
  const [onlyActive, setOnlyActive] = useState(false);
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "add", "edit", "view", "delete"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    contact_name: "",
    contact_email: "",
    recruiter_status: "COLD",
  });

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadRecruiters() {
    try {
      setLoading(true);
      setError("");
      const result = await api("/api/recruiters");
      setCompanies(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message || "Unable to load recruiter records.");
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecruiters();
  }, []);

  async function openViewDetails(company) {
    setSelectedCompany(company);
    setModalMode("view");
    setDetailsLoading(true);
    try {
      const details = await api(`/api/recruiters/${company.id}`);
      setCompanyDetails(details);
    } catch {
      setCompanyDetails(company);
    } finally {
      setDetailsLoading(false);
    }
  }

  async function handleSaveCompany() {
    if (!formData.name.trim()) {
      showNotification("Company name is required.", "error");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "edit" && selectedCompany) {
        await api(`/api/recruiters/${selectedCompany.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        showNotification(`Recruiter ${formData.name} updated successfully!`);
      } else {
        await api("/api/recruiters", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        showNotification(`Recruiter ${formData.name} added successfully!`);
      }
      setModalMode(null);
      await loadRecruiters();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteCompany() {
    if (!selectedCompany) return;
    setSaving(true);
    try {
      await api(`/api/recruiters/${selectedCompany.id}`, { method: "DELETE" });
      showNotification(`Recruiter ${selectedCompany.name} removed successfully.`);
      setModalMode(null);
      await loadRecruiters();
    } catch (err) {
      showNotification(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let list = companies.filter((c) => {
      const statusStr = String(c.recruiter_status || "COLD").toUpperCase();

      const matchesSearch =
        !q ||
        String(c.name || "").toLowerCase().includes(q) ||
        String(c.contact_name || "").toLowerCase().includes(q) ||
        String(c.contact_email || "").toLowerCase().includes(q) ||
        String(c.industry || "").toLowerCase().includes(q) ||
        String(c.website || "").toLowerCase().includes(q);

      const matchesTemp = temperature === "ALL" || statusStr === temperature.toUpperCase();

      const matchesActiveOnly = !onlyActive || statusStr !== "COLD";

      return matchesSearch && matchesTemp && matchesActiveOnly;
    });

    list.sort((a, b) => {
      let aVal = String(a[sort.key] || "").toLowerCase();
      let bVal = String(b[sort.key] || "").toLowerCase();
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [companies, search, temperature, onlyActive, sort]);

  const stats = useMemo(() => {
    return {
      total: companies.length,
      hot: companies.filter((c) => String(c.recruiter_status).toUpperCase() === "HOT").length,
      warm: companies.filter((c) => String(c.recruiter_status).toUpperCase() === "WARM").length,
      cold: companies.filter((c) => String(c.recruiter_status).toUpperCase() === "COLD").length,
      driveCompleted: companies.filter((c) => ["DRIVE_COMPLETED", "DRIVE COMPLETED"].includes(String(c.recruiter_status).toUpperCase())).length,
    };
  }, [companies]);

  const exportColumns = [
    { key: "name", label: "COMPANY NAME" },
    { key: "contact_name", label: "CONTACT PERSON", accessor: (item) => item.contact_name || "—" },
    { key: "contact_email", label: "EMAIL", accessor: (item) => item.contact_email || "—" },
    { key: "industry", label: "INDUSTRY", accessor: (item) => item.industry || "—" },
    { key: "recruiter_status", label: "ENGAGEMENT STATUS", accessor: (item) => item.recruiter_status || "COLD" },
    { key: "website", label: "WEBSITE", accessor: (item) => item.website || "—" },
  ];

  if (loading) return <LoadingState />;
  if (error && companies.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      {notification && (
        <div className={`inline-alert ${notification.tone === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="page-heading">
        <div>
          <span className="eyebrow">RECRUITMENT PIPELINE</span>
          <h1>Recruiters & Companies ({companies.length})</h1>
          <p>Track recruiter relationships, company engagement status, and hiring outcomes.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>

          {canEdit && (
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setSelectedCompany(null);
                setFormData({
                  name: "",
                  website: "",
                  industry: "",
                  contact_name: "",
                  contact_email: "",
                  recruiter_status: "COLD",
                });
                setModalMode("add");
              }}
            >
              <Plus size={17} />
              Add Recruiter
            </button>
          )}
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon={Building2} title="Total Companies" value={stats.total} subtitle="Registered partners" />
        <StatCard icon={Zap} title="Hot" value={stats.hot} subtitle="Active hiring pipeline" tone="purple" />
        <StatCard icon={TrendingUp} title="Warm" value={stats.warm} subtitle="In discussion" tone="blue" />
        <StatCard icon={CheckCircle2} title="Drive Completed" value={stats.driveCompleted} subtitle="Finished drives" tone="green" />
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, contact person, email, or industry..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <select value={temperature} onChange={(e) => setTemperature(e.target.value)}>
                <option value="ALL">All Status ({companies.length})</option>
                <option value="HOT">Hot ({stats.hot})</option>
                <option value="WARM">Warm ({stats.warm})</option>
                <option value="DRIVE_COMPLETED">Drive Completed ({stats.driveCompleted})</option>
                <option value="COLD">Cold ({stats.cold})</option>
              </select>
              <ChevronDown size={15} />
            </div>

            <label className="checkbox-toggle-label">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
              />
              <span>Exclude Cold</span>
            </label>

            {(search || temperature !== "ALL" || onlyActive) && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setTemperature("ALL");
                  setOnlyActive(false);
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No recruiters found"
            message="Add companies or adjust your search filters to find recruiter records."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="COMPANY NAME" sortKey="name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="CONTACT PERSON" sortKey="contact_name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="EMAIL" sortKey="contact_email" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="INDUSTRY" sortKey="industry" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="TEMPERATURE" sortKey="recruiter_status" currentSort={sort} onSort={handleSort} />
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((company, index) => (
                  <tr key={company.id || index}>
                    <td>
                      <strong>{company.name || "—"}</strong>
                      {company.website && (
                        <a
                          href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noreferrer"
                          className="external-site-link"
                          title="Visit website"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </td>
                    <td>{company.contact_name || "—"}</td>
                    <td>{company.contact_email || "—"}</td>
                    <td>{company.industry || "—"}</td>
                    <td>
                      <StatusBadge status={company.recruiter_status || "COLD"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View Recruiter & Company Details"
                          onClick={() => openViewDetails(company)}
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              title="Edit Recruiter"
                              onClick={() => {
                                setSelectedCompany(company);
                                setFormData({
                                  name: company.name,
                                  website: company.website || "",
                                  industry: company.industry || "",
                                  contact_name: company.contact_name || "",
                                  contact_email: company.contact_email || "",
                                  recruiter_status: company.recruiter_status || "COLD",
                                });
                                setModalMode("edit");
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete Recruiter"
                              className="danger-icon"
                              onClick={() => {
                                setSelectedCompany(company);
                                setModalMode("delete");
                              }}
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export & Print Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Recruiters & Companies Directory"
        filename="recruiters_directory"
        columns={exportColumns}
        data={filtered}
        filtersSummary={`Status: ${temperature} | Exclude Cold: ${onlyActive ? "Yes" : "No"}`}
      />

      {/* View Details Modal */}
      {modalMode === "view" && selectedCompany && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Company & Recruiter Profile</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              {detailsLoading ? (
                <LoadingState message="Loading recruiter engagement details…" />
              ) : (
                <>
                  <div className="detail-hero-box">
                    <div>
                      <h3 style={{ margin: 0, fontSize: "18px" }}>{selectedCompany.name}</h3>
                      <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                        {selectedCompany.industry || "Industry unspecified"} &bull; Status:{" "}
                        <StatusBadge status={selectedCompany.recruiter_status} />
                      </p>
                    </div>
                    {selectedCompany.website && (
                      <a
                        href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary-button small-button"
                      >
                        <Globe size={14} />
                        Website
                      </a>
                    )}
                  </div>

                  <div className="stats-grid four" style={{ marginTop: "16px" }}>
                    <StatCard icon={BriefcaseBusiness} title="Total Drives" value={companyDetails?.total_drives ?? 0} />
                    <StatCard icon={CheckCircle2} title="Active Drives" value={companyDetails?.active_drives ?? 0} />
                    <StatCard icon={FileText} title="Applications" value={companyDetails?.total_applications ?? 0} />
                    <StatCard icon={Award} title="Selections" value={companyDetails?.selected_students ?? 0} tone="green" />
                  </div>

                  <div className="form-row two-col" style={{ marginTop: "16px" }}>
                    <div className="form-group">
                      <label><Phone size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Contact Person</label>
                      <p>{selectedCompany.contact_name || "Not recorded"}</p>
                    </div>
                    <div className="form-group">
                      <label><Mail size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Contact Email</label>
                      <p>{selectedCompany.contact_email || "Not recorded"}</p>
                    </div>
                  </div>

                  {companyDetails?.last_engagement && (
                    <div className="form-group" style={{ marginTop: "8px" }}>
                      <label>Last Engagement / Drive</label>
                      <p>{new Date(companyDetails.last_engagement).toLocaleDateString()}</p>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modalMode === "add" || modalMode === "edit") && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === "edit" ? "Edit Recruiter" : "Add Recruiter"}</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Infosys"
                />
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="HR / Campus Recruiter Name"
                />
              </div>

              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  placeholder="recruiter@company.com"
                />
              </div>

              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                  placeholder="e.g., Information Technology, Finance, Core"
                />
              </div>

              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>

              <div className="form-group">
                <label>Engagement Status</label>
                <select
                  value={formData.recruiter_status}
                  onChange={(e) => setFormData({ ...formData, recruiter_status: e.target.value })}
                >
                  <option value="COLD">Cold (Initial outreach)</option>
                  <option value="WARM">Warm (In discussion)</option>
                  <option value="HOT">Hot (Active recruitment drive)</option>
                  <option value="DRIVE_COMPLETED">Drive Completed</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveCompany} disabled={saving}>
                {saving ? "Saving..." : modalMode === "edit" ? "Save Changes" : "Add Recruiter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {modalMode === "delete" && canEdit && selectedCompany && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Recruiter</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{selectedCompany.name}</strong>?
              </p>
              <p style={{ color: "#ef4444", marginTop: "8px", fontSize: "13px" }}>
                This will delete the company profile and its associated recruitment data.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" style={{ background: "#ef4444" }} onClick={handleDeleteCompany} disabled={saving}>
                {saving ? "Deleting..." : "Delete Recruiter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   5. PLACEMENT DRIVES
========================================================= */

export function Drives() {
  const canEdit = canManageDrives();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "title", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "add", "edit", "view"
  const [selectedDrive, setSelectedDrive] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    company_id: "",
    location: "",
    package_lpa: "",
    eligibility: "",
    status: "OPEN",
    work_mode: "On-site",
  });

  async function loadDrives() {
    try {
      setLoading(true);
      const [driveList, compList] = await Promise.all([
        api("/api/drives"),
        api("/api/companies"),
      ]);
      setDrives(Array.isArray(driveList) ? driveList : []);
      setCompanies(Array.isArray(compList) ? compList : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDrives();
  }, []);

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let list = drives.filter((drive) => {
      const title = String(drive.title || "").toLowerCase();
      const comp = String(drive.company?.name || "").toLowerCase();
      const loc = String(drive.location || "").toLowerCase();

      const matchesSearch = !q || title.includes(q) || comp.includes(q) || loc.includes(q);
      const matchesStatus = status === "ALL" || String(drive.status || "").toUpperCase() === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      let aVal = String(a[sort.key] || (sort.key === "company" ? a.company?.name : "") || "").toLowerCase();
      let bVal = String(b[sort.key] || (sort.key === "company" ? b.company?.name : "") || "").toLowerCase();
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [drives, search, status, sort]);

  const handleSaveDrive = async () => {
    if (!formData.title.trim() || !formData.company_id || !formData.location.trim()) {
      alert("Please fill title, company and location.");
      return;
    }
    try {
      if (modalMode === "edit" && selectedDrive) {
        await api(`/api/drives/${selectedDrive.id}`, {
          method: "PUT",
          body: JSON.stringify({ ...formData, company_id: Number(formData.company_id) }),
        });
      } else {
        await api("/api/drives", {
          method: "POST",
          body: JSON.stringify({ ...formData, company_id: Number(formData.company_id), eligibility: formData.eligibility || "Eligible students" }),
        });
      }
      setModalMode(null);
      await loadDrives();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const exportColumns = [
    { key: "title", label: "DRIVE TITLE" },
    { key: "company", label: "COMPANY", accessor: (item) => item.company?.name || "—" },
    { key: "location", label: "LOCATION" },
    { key: "package_lpa", label: "CTC PACKAGE", accessor: (item) => item.package_lpa || "—" },
    { key: "status", label: "STATUS", accessor: (item) => item.status || "—" },
  ];

  if (loading) return <LoadingState />;
  if (error && drives.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECRUITMENT DRIVES</span>
          <h1>Placement Drives ({drives.length})</h1>
          <p>Manage upcoming, active, and completed placement drives.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>

          {canEdit && (
            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setSelectedDrive(null);
                setFormData({
                  title: "",
                  company_id: companies[0]?.id ? String(companies[0].id) : "",
                  location: "Campus",
                  package_lpa: "6.0 LPA",
                  eligibility: "All eligible final year students",
                  status: "OPEN",
                  work_mode: "On-site",
                });
                setModalMode("add");
              }}
            >
              <Plus size={17} />
              Create Drive
            </button>
          )}
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by drive title, company, or location..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="OPEN">Open / Active</option>
                <option value="DRAFT">Draft</option>
                <option value="CLOSED">Closed</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {(search || status !== "ALL") && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No placement drives found"
            message="Create a drive to begin managing campus recruitment activity."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="DRIVE TITLE" sortKey="title" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="COMPANY" sortKey="company" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="LOCATION" sortKey="location" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="PACKAGE" sortKey="package_lpa" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="STATUS" sortKey="status" currentSort={sort} onSort={handleSort} />
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((drive, index) => (
                  <tr key={drive.id || index}>
                    <td>
                      <strong>{drive.title || "—"}</strong>
                    </td>
                    <td>{drive.company?.name || "—"}</td>
                    <td>{drive.location || "—"}</td>
                    <td>{drive.package_lpa || "—"}</td>
                    <td>
                      <StatusBadge status={drive.status || "OPEN"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View Details"
                          onClick={() => {
                            setSelectedDrive(drive);
                            setModalMode("view");
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <button
                            type="button"
                            title="Edit Drive"
                            onClick={() => {
                              setSelectedDrive(drive);
                              setFormData({
                                title: drive.title,
                                company_id: String(drive.company_id),
                                location: drive.location,
                                package_lpa: drive.package_lpa || "",
                                eligibility: drive.eligibility || "",
                                status: drive.status || "OPEN",
                                work_mode: drive.work_mode || "On-site",
                              });
                              setModalMode("edit");
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Placement Drives Report"
        filename="placement_drives"
        columns={exportColumns}
        data={filtered}
        filtersSummary={`Status: ${status}`}
      />

      {/* View Modal */}
      {modalMode === "view" && selectedDrive && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Placement Drive Information</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Drive Title</label>
                <p><strong>{selectedDrive.title}</strong></p>
              </div>
              <div className="form-group">
                <label>Company</label>
                <p>{selectedDrive.company?.name || "—"}</p>
              </div>
              <div className="form-group">
                <label>Location</label>
                <p>{selectedDrive.location || "—"}</p>
              </div>
              <div className="form-group">
                <label>Package (LPA)</label>
                <p>{selectedDrive.package_lpa || "—"}</p>
              </div>
              <div className="form-group">
                <label>Status</label>
                <p><StatusBadge status={selectedDrive.status} /></p>
              </div>
              <div className="form-group">
                <label>Eligibility Criteria</label>
                <p>{selectedDrive.eligibility || "Not specified"}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modalMode === "add" || modalMode === "edit") && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === "edit" ? "Edit Drive" : "Create Placement Drive"}</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Drive Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Software Development Engineer Campus Drive"
                />
              </div>

              <div className="form-group">
                <label>Company *</label>
                <select
                  value={formData.company_id}
                  onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                >
                  <option value="">Select Company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Location *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Auditorium / Hybrid"
                />
              </div>

              <div className="form-group">
                <label>CTC Package</label>
                <input
                  type="text"
                  value={formData.package_lpa}
                  onChange={(e) => setFormData({ ...formData, package_lpa: e.target.value })}
                  placeholder="e.g., 8.5 LPA"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="OPEN">Open</option>
                  <option value="DRAFT">Draft</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Eligibility</label>
                <textarea
                  rows={3}
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  placeholder="Eligibility criteria description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleSaveDrive}>
                {modalMode === "edit" ? "Save Changes" : "Create Drive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   6. APPLICATIONS
========================================================= */

export function Applications() {
  const canEdit = canManageApplications();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "student_name", direction: "asc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  async function loadApplications() {
    try {
      setLoading(true);
      const result = await api("/api/applications");
      setApplications(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApplications();
  }, []);

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api(`/api/applications/${appId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      await loadApplications();
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();

    let list = applications.filter((app) => {
      const student = String(app.student_name || "").toLowerCase();
      const comp = String(app.drive?.company?.name || "").toLowerCase();
      const drive = String(app.drive?.title || "").toLowerCase();
      const email = String(app.student_email || "").toLowerCase();

      const matchesSearch = !q || student.includes(q) || comp.includes(q) || drive.includes(q) || email.includes(q);
      const matchesStatus = status === "ALL" || String(app.status || "").toUpperCase() === status.toUpperCase();

      return matchesSearch && matchesStatus;
    });

    list.sort((a, b) => {
      let aVal = String(a[sort.key] || (sort.key === "company" ? a.drive?.company?.name : "") || "").toLowerCase();
      let bVal = String(b[sort.key] || (sort.key === "company" ? b.drive?.company?.name : "") || "").toLowerCase();
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [applications, search, status, sort]);

  const exportColumns = [
    { key: "student_name", label: "STUDENT NAME" },
    { key: "student_email", label: "EMAIL" },
    { key: "company", label: "COMPANY", accessor: (item) => item.drive?.company?.name || "—" },
    { key: "drive", label: "DRIVE", accessor: (item) => item.drive?.title || "—" },
    { key: "status", label: "STATUS", accessor: (item) => item.status || "—" },
    { key: "applied_at", label: "APPLIED DATE", accessor: (item) => (item.created_at ? new Date(item.created_at).toLocaleDateString() : "—") },
  ];

  if (loading) return <LoadingState />;
  if (error && applications.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">APPLICATION PIPELINE</span>
          <h1>Applications ({applications.length})</h1>
          <p>Monitor candidate progression across placement drives.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, email, company, or drive..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="ALL">All Status</option>
                <option value="APPLIED">Applied</option>
                <option value="SHORTLISTED">Shortlisted</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFERED">Offered / Selected</option>
                <option value="REJECTED">Rejected</option>
                <option value="WITHDRAWN">Withdrawn</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {(search || status !== "ALL") && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setStatus("ALL");
                }}
              >
                <RotateCcw size={14} />
                Reset
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No applications found"
            message="Student applications will appear here as drives accept submissions."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="STUDENT" sortKey="student_name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="COMPANY" sortKey="company" currentSort={sort} onSort={handleSort} />
                  <th>DRIVE</th>
                  <th>APPLIED DATE</th>
                  <SortHeader label="STATUS" sortKey="status" currentSort={sort} onSort={handleSort} />
                  {canEdit && <th>UPDATE STATUS</th>}
                </tr>
              </thead>

              <tbody>
                {filtered.map((application, index) => (
                  <tr key={application.id || index}>
                    <td>
                      <strong>{application.student_name || "—"}</strong>
                      <div style={{ fontSize: "11px", color: "#64748b" }}>{application.student_email}</div>
                    </td>
                    <td>{application.drive?.company?.name || "—"}</td>
                    <td>{application.drive?.title || "—"}</td>
                    <td>
                      {application.created_at ? new Date(application.created_at).toLocaleDateString() : "—"}
                    </td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    {canEdit && (
                      <td>
                        <select
                          className="table-status-select"
                          value={application.status}
                          onChange={(e) => handleStatusChange(application.id, e.target.value)}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SHORTLISTED">Shortlisted</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="OFFERED">Offered</option>
                          <option value="REJECTED">Rejected</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Export Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Student Applications Report"
        filename="student_applications"
        columns={exportColumns}
        data={filtered}
        filtersSummary={`Status: ${status}`}
      />
    </div>
  );
}

/* =========================================================
   7. REPORTS
========================================================= */

export function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Report Filters
  const [search, setSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("ALL");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [studentStatus, setStudentStatus] = useState("ALL");
  const [companyStatus, setCompanyStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "student_name", direction: "asc" });

  const [showExportModal, setShowExportModal] = useState(false);

  async function loadReport() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      if (search) params.append("query", search);
      if (selectedCompany !== "ALL") params.append("company", selectedCompany);
      if (selectedDept !== "ALL") params.append("department", selectedDept);
      if (studentStatus !== "ALL") params.append("student_status", studentStatus);
      if (companyStatus !== "ALL") params.append("company_status", companyStatus);

      const [repResult, compList] = await Promise.all([
        api(`/api/reports?${params.toString()}`),
        api("/api/companies"),
      ]);

      setReportsData(repResult);
      setCompanies(Array.isArray(compList) ? compList : []);
    } catch (err) {
      setError(err.message || "Failed to load report data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, [selectedCompany, selectedDept, studentStatus, companyStatus, search]);

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleResetFilters = () => {
    setSearch("");
    setSelectedCompany("ALL");
    setSelectedDept("ALL");
    setStudentStatus("ALL");
    setCompanyStatus("ALL");
  };

  const sortedRecords = useMemo(() => {
    if (!reportsData?.records) return [];
    const list = [...reportsData.records];
    list.sort((a, b) => {
      let aVal = a[sort.key] || "";
      let bVal = b[sort.key] || "";
      if (sort.key === "cgpa") {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [reportsData, sort]);

  const departmentsList = useMemo(() => {
    return (reportsData?.department_placements || []).map((d) => d.department).filter(Boolean);
  }, [reportsData]);

  const exportColumns = [
    { key: "registration_number", label: "REG. NUMBER" },
    { key: "student_name", label: "STUDENT NAME" },
    { key: "department", label: "DEPARTMENT" },
    { key: "cgpa", label: "CGPA" },
    { key: "student_status", label: "PLACEMENT STATUS" },
    { key: "company_name", label: "PLACED COMPANY" },
    { key: "company_status", label: "COMPANY STATUS" },
    { key: "package_lpa", label: "CTC (LPA)" },
    { key: "applied_drives_count", label: "APPLIED DRIVES" },
  ];

  if (loading && !reportsData) return <LoadingState message="Generating live report data…" />;
  if (error && !reportsData) return <ErrorState message={error} />;

  const stats = reportsData || {};
  const matchingRecordsCount = sortedRecords.length;

  const filtersSummaryText = `Company: ${selectedCompany} | Dept: ${selectedDept} | Student Status: ${studentStatus} | Company Status: ${companyStatus} | Search: "${search || "None"}"`;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLACEMENT INTELLIGENCE</span>
          <h1>Placement Reports ({matchingRecordsCount} records)</h1>
          <p>Real-time outcome metrics, multi-criteria filtering, and institutional reporting.</p>
        </div>

        <div className="page-heading-actions">
          <button className="primary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print Report
          </button>
        </div>
      </div>

      {/* Aggregate KPI Summary Grid */}
      <div className="stats-grid">
        <StatCard icon={Users} title="Total Students" value={stats.total_students ?? 0} subtitle="Registered pool" />
        <StatCard icon={GraduationCap} title="Placed Students" value={stats.placed_students ?? 0} subtitle="Successfully hired" tone="green" />
        <StatCard icon={CheckCircle2} title="Placement %" value={`${stats.placement_percentage ?? 0}%`} subtitle="Overall rate" tone="purple" />
        <StatCard icon={Building2} title="Companies" value={stats.total_companies ?? 0} subtitle="Total registered" tone="blue" />
        <StatCard icon={BriefcaseBusiness} title="Active Drives" value={stats.active_drives ?? 0} subtitle="Open opportunities" />
        <StatCard icon={Zap} title="Hot Recruiters" value={stats.hot_recruiters ?? 0} subtitle="Active pipeline" tone="purple" />
        <StatCard icon={FileText} title="Applications" value={stats.applications ?? 0} subtitle="Total submitted" />
        <StatCard icon={Award} title="Offers" value={stats.offers ?? 0} subtitle="Offer selections" tone="green" />
      </div>

      {/* Multi-Criteria Filters Panel */}
      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Report Filters & Query Controls</h2>
            <p>Combine multiple parameters to filter live student and recruiter records</p>
          </div>
        </div>

        <div className="toolbar" style={{ flexWrap: "wrap", gap: "12px" }}>
          <div className="search-box" style={{ minWidth: "240px", flex: "1 1 240px" }}>
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by student name, reg no, or email..."
            />
          </div>

          <div className="select-box">
            <label style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Company</label>
            <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}>
              <option value="ALL">All Companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="select-box">
            <label style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Department</label>
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
              <option value="ALL">All Departments</option>
              {departmentsList.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="select-box">
            <label style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Student Status</label>
            <select value={studentStatus} onChange={(e) => setStudentStatus(e.target.value)}>
              <option value="ALL">All Student Status</option>
              <option value="PLACED">Placed</option>
              <option value="SEEKING">Unplaced / Seeking</option>
              <option value="NOT_ELIGIBLE">Not Eligible</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <div className="select-box">
            <label style={{ fontSize: "11px", color: "#64748b", display: "block" }}>Company Status</label>
            <select value={companyStatus} onChange={(e) => setCompanyStatus(e.target.value)}>
              <option value="ALL">All Company Status</option>
              <option value="HOT">Hot</option>
              <option value="WARM">Warm</option>
              <option value="COLD">Cold</option>
              <option value="DRIVE_COMPLETED">Drive Completed</option>
            </select>
            <ChevronDown size={15} />
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={handleResetFilters}
            title="Clear all filters"
          >
            <RotateCcw size={15} />
            Clear Filters
          </button>
        </div>

        {/* Filtered Detailed Report Records Table */}
        <div style={{ marginTop: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <h3 style={{ margin: 0, fontSize: "15px" }}>Filtered Student Placement Records ({sortedRecords.length})</h3>
            <small style={{ color: "#64748b" }}>Live query matching applied filters</small>
          </div>

          {sortedRecords.length === 0 ? (
            <EmptyState
              title="No records match this combination"
              message="Try clearing or adjusting filters to expand the report dataset."
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <SortHeader label="REG. NO" sortKey="registration_number" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="STUDENT NAME" sortKey="student_name" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="DEPT" sortKey="department" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="CGPA" sortKey="cgpa" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="STUDENT STATUS" sortKey="student_status" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="COMPANY" sortKey="company_name" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="COMPANY STATUS" sortKey="company_status" currentSort={sort} onSort={handleSort} />
                    <SortHeader label="PACKAGE (LPA)" sortKey="package_lpa" currentSort={sort} onSort={handleSort} />
                    <th>APPLIED</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((record, index) => (
                    <tr key={record.id || index}>
                      <td><strong>{record.registration_number || "—"}</strong></td>
                      <td>{record.student_name || "—"}</td>
                      <td>{record.department || "—"}</td>
                      <td>{record.cgpa || "—"}</td>
                      <td>
                        <StatusBadge status={record.student_status} />
                      </td>
                      <td>{record.company_name || "—"}</td>
                      <td>
                        {record.company_status !== "—" ? (
                          <StatusBadge status={record.company_status} />
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{record.package_lpa || "—"}</td>
                      <td>{record.applied_drives_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Recruiter Metrics Breakdown */}
      {(stats.recruiter_metrics || []).length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Company & Recruiter Hiring Performance</h2>
              <p>Drives, student applications, and selection outcomes per company</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>COMPANY NAME</th>
                  <th>STATUS</th>
                  <th>TOTAL DRIVES</th>
                  <th>ACTIVE DRIVES</th>
                  <th>APPLICATIONS</th>
                  <th>SELECTIONS</th>
                  <th>LAST ENGAGEMENT</th>
                </tr>
              </thead>
              <tbody>
                {stats.recruiter_metrics.map((rec, index) => (
                  <tr key={rec.company_id || index}>
                    <td><strong>{rec.company_name}</strong></td>
                    <td><StatusBadge status={rec.status} /></td>
                    <td>{rec.total_drives}</td>
                    <td>{rec.active_drives}</td>
                    <td>{rec.total_applications}</td>
                    <td><strong style={{ color: "#16a34a" }}>{rec.selected_count}</strong></td>
                    <td>{rec.last_engagement ? new Date(rec.last_engagement).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Department Breakdown & Application Funnel */}
      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Department-wise Placements</h2>
              <p>Placed student count across academic departments</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEPARTMENT</th>
                  <th>PLACED STUDENTS</th>
                </tr>
              </thead>
              <tbody>
                {(stats.department_placements || []).length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: "center", color: "#64748b" }}>No department placement data.</td></tr>
                ) : (
                  stats.department_placements.map((dept, index) => (
                    <tr key={index}>
                      <td><strong>{dept.department || "—"}</strong></td>
                      <td>{dept.placed ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Application Pipeline Funnel</h2>
              <p>Distribution of candidate application stages</p>
            </div>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>APPLICATION STAGE</th>
                  <th>COUNT</th>
                </tr>
              </thead>
              <tbody>
                {(stats.application_funnel || []).length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: "center", color: "#64748b" }}>No application data.</td></tr>
                ) : (
                  stats.application_funnel.map((item, index) => (
                    <tr key={index}>
                      <td><StatusBadge status={item.status} /></td>
                      <td><strong>{item.count ?? 0}</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Export & Print Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Placement Operations Intelligence Report"
        filename="placement_report"
        columns={exportColumns}
        data={sortedRecords}
        filtersSummary={filtersSummaryText}
      />
    </div>
  );
}

/* =========================================================
   8. AUDIT LOG
========================================================= */

export function AuditLog() {
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    api("/api/audit")
      .then((result) => setAudit(Array.isArray(result) ? result : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return audit.filter((item) => {
      return (
        !q ||
        String(item.action || "").toLowerCase().includes(q) ||
        String(item.entity_type || "").toLowerCase().includes(q) ||
        JSON.stringify(item.details || {}).toLowerCase().includes(q)
      );
    });
  }, [audit, search]);

  const exportColumns = [
    { key: "action", label: "ACTION" },
    { key: "entity_type", label: "ENTITY TYPE" },
    { key: "entity_id", label: "ENTITY ID" },
    { key: "details", label: "DETAILS", accessor: (item) => JSON.stringify(item.details || {}) },
    { key: "created_at", label: "TIMESTAMP", accessor: (item) => (item.created_at ? new Date(item.created_at).toLocaleString() : "—") },
  ];

  if (loading) return <LoadingState message="Loading audit trail…" />;
  if (error && audit.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM GOVERNANCE</span>
          <h1>Audit Log ({audit.length})</h1>
          <p>Trace operational changes and compliance records across R-PORTAL.</p>
        </div>

        <div className="page-heading-actions">
          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export / Print
          </button>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit actions, entity types, or details..."
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No audit records"
            message="System operations will be logged here in chronological order."
          />
        ) : (
          <div className="audit-list">
            {filtered.map((item, index) => (
              <div className="audit-item" key={item.id || index}>
                <div className="audit-marker" />
                <div className="audit-content">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{item.action} &bull; {item.entity_type} (ID: {item.entity_id || "—"})</strong>
                    <small>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</small>
                  </div>
                  <span style={{ marginTop: "4px", display: "block", color: "#475569" }}>
                    {item.details && Object.keys(item.details).length > 0
                      ? Object.entries(item.details).map(([k, v]) => `${k}: ${v}`).join(" | ")
                      : `Action on ${item.entity_type}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Export Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Audit Log Report"
        filename="audit_log"
        columns={exportColumns}
        data={filtered}
        filtersSummary={`Search: "${search || "None"}"`}
      />
    </div>
  );
}

/* =========================================================
   9. NOTIFICATIONS
========================================================= */

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const [listResult, countResult] = await Promise.all([
        api("/api/notifications"),
        api("/api/notifications/unread-count"),
      ]);

      setNotifications(Array.isArray(listResult) ? listResult : []);
      setUnreadCount(countResult?.unread_count || 0);
    } catch (err) {
      setError(err.message || "Unable to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const filtered = useMemo(() => {
    if (filter === "UNREAD") return notifications.filter((n) => !n.is_read);
    if (filter === "READ") return notifications.filter((n) => n.is_read);
    return notifications;
  }, [notifications, filter]);

  async function handleMarkAsRead(id) {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      await loadNotifications();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
      await loadNotifications();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  if (loading && notifications.length === 0) return <LoadingState message="Loading notifications…" />;
  if (error && notifications.length === 0) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">OPERATIONAL NOTIFICATIONS</span>
          <h1>Notifications</h1>
          <p>Real platform events, recruiter updates, student changes, and action items.</p>
        </div>

        {unreadCount > 0 && (
          <button className="secondary-button" type="button" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} />
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="filter-tabs">
            <button
              className={filter === "ALL" ? "active" : ""}
              onClick={() => setFilter("ALL")}
            >
              All ({notifications.length})
            </button>
            <button
              className={filter === "UNREAD" ? "active" : ""}
              onClick={() => setFilter("UNREAD")}
            >
              Unread ({unreadCount})
            </button>
            <button
              className={filter === "READ" ? "active" : ""}
              onClick={() => setFilter("READ")}
            >
              Read ({notifications.filter((n) => n.is_read).length})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            message="No notifications match the selected filter."
          />
        ) : (
          <div className="notification-list">
            {filtered.map((notification, index) => (
              <div
                className={`notification-item ${notification.is_read ? "read" : "unread"}`}
                key={notification.id || index}
              >
                <div className="notification-icon">
                  {notification.is_read ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>

                <div className="notification-content">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <strong>{notification.title || "Platform Update"}</strong>
                      {notification.notification_type && (
                        <span className="notification-type">{notification.notification_type}</span>
                      )}
                    </div>
                    <small>
                      {notification.created_at
                        ? new Date(notification.created_at).toLocaleString()
                        : ""}
                    </small>
                  </div>

                  <p style={{ marginTop: "6px" }}>{notification.message}</p>
                </div>

                {!notification.is_read && (
                  <button
                    className="notification-action"
                    type="button"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   10. SETTINGS
========================================================= */

export function Settings() {
  const outletCtx = useOutletContext() || {};
  const currentCtxUser = outletCtx.user || getUser();
  const onUserUpdated = outletCtx.onUserUpdated || (() => {});
  const onSignOut = outletCtx.onSignOut || (() => {});

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState("");

  // Profile
  const [userProfile, setUserProfile] = useState(currentCtxUser);
  const [fullName, setFullName] = useState(currentCtxUser?.full_name || "");
  const [isEditingName, setIsEditingName] = useState(false);

  // Security / Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Appearance & Preferences
  const [theme, setTheme] = useState(
    currentCtxUser?.preferences?.theme || localStorage.getItem("rportal_theme") || "system"
  );
  const [tableDensity, setTableDensity] = useState(
    currentCtxUser?.preferences?.table_density || localStorage.getItem("rportal_density") || "comfortable"
  );
  const [defaultPage, setDefaultPage] = useState(
    currentCtxUser?.preferences?.default_page || "/dashboard"
  );
  const [defaultExportFormat, setDefaultExportFormat] = useState(
    currentCtxUser?.preferences?.default_export_format || "CSV"
  );
  const [defaultPrintOrientation, setDefaultPrintOrientation] = useState(
    currentCtxUser?.preferences?.default_print_orientation || "portrait"
  );

  // Notifications
  const [notifPrefs, setNotifPrefs] = useState({
    application_updates: true,
    drive_updates: true,
    recruiter_updates: true,
    student_updates: true,
    system_updates: true,
  });

  // Admin User Management
  const [adminUsers, setAdminUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userLoading, setUserLoading] = useState(false);

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadSettings() {
    try {
      setLoading(true);
      setError("");
      const result = await api("/api/settings");
      const u = result.user || currentCtxUser;
      const p = result.preferences || {};

      setUserProfile(u);
      setFullName(u.full_name || "");
      setTheme(p.theme || "system");
      setTableDensity(p.table_density || "comfortable");
      setDefaultPage(p.default_page || "/dashboard");
      setDefaultExportFormat(p.default_export_format || "CSV");
      setDefaultPrintOrientation(p.default_print_orientation || "portrait");
      if (p.notifications) {
        setNotifPrefs((prev) => ({ ...prev, ...p.notifications }));
      }

      if (u.role === "ADMIN") {
        loadAdminUsers();
      }
    } catch (err) {
      setError(err.message || "Failed to load settings.");
    } finally {
      setLoading(false);
    }
  }

  async function loadAdminUsers() {
    try {
      setUserLoading(true);
      const userList = await api("/api/users?include_inactive=true");
      setAdminUsers(Array.isArray(userList) ? userList : []);
    } catch (err) {
      console.error("Failed to load user list:", err);
    } finally {
      setUserLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  // 1. Profile Update
  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length < 2) {
      showNotification("Full name must be at least 2 characters.", "error");
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await api("/api/profile", {
        method: "PATCH",
        body: JSON.stringify({ full_name: fullName.trim() }),
      });
      setUserProfile(updated);
      setIsEditingName(false);
      onUserUpdated(updated);
      showNotification("Profile updated successfully!");
    } catch (err) {
      showNotification(err.message || "Failed to update profile.", "error");
    } finally {
      setSavingProfile(false);
    }
  }

  // 2. Change Password
  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await api("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess(res.message || "Password changed successfully!");
      showNotification("Password changed successfully!");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password.");
    } finally {
      setSavingPassword(false);
    }
  }

  // 3. Theme Appearance
  async function handleThemeChange(selectedTheme) {
    setTheme(selectedTheme);
    localStorage.setItem("rportal_theme", selectedTheme);
    const root = document.documentElement;
    if (selectedTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      root.setAttribute("data-theme", selectedTheme);
    }

    try {
      const updated = await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ theme: selectedTheme }),
      });
      onUserUpdated(updated);
      showNotification(`Theme set to ${selectedTheme.toUpperCase()}.`);
    } catch (err) {
      console.error("Theme sync error:", err);
    }
  }

  // 4. Notification Toggles
  async function handleToggleNotif(category) {
    const updated = {
      ...notifPrefs,
      [category]: !notifPrefs[category],
    };
    setNotifPrefs(updated);
    try {
      const res = await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({ notifications: { [category]: updated[category] } }),
      });
      onUserUpdated(res);
      showNotification(
        `Notification preference updated for ${category.replace("_", " ")}.`
      );
    } catch (err) {
      showNotification("Failed to update notification settings.", "error");
      setNotifPrefs(notifPrefs); // rollback
    }
  }

  // 5. Application Preferences
  async function handleSaveAppPreferences(e) {
    if (e) e.preventDefault();
    setSavingPrefs(true);
    try {
      const updated = await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify({
          table_density: tableDensity,
          default_page: defaultPage,
          default_export_format: defaultExportFormat,
          default_print_orientation: defaultPrintOrientation,
        }),
      });
      localStorage.setItem("rportal_density", tableDensity);
      document.documentElement.setAttribute("data-density", tableDensity);
      onUserUpdated(updated);
      showNotification("Application preferences saved successfully!");
    } catch (err) {
      showNotification(err.message || "Failed to save preferences.", "error");
    } finally {
      setSavingPrefs(false);
    }
  }

  async function handleResetDefaults() {
    if (!window.confirm("Reset all appearance and application preferences to defaults?")) {
      return;
    }
    setSavingPrefs(true);
    try {
      const defaults = {
        theme: "system",
        table_density: "comfortable",
        default_page: "/dashboard",
        default_export_format: "CSV",
        default_print_orientation: "portrait",
        notifications: {
          application_updates: true,
          drive_updates: true,
          recruiter_updates: true,
          student_updates: true,
          system_updates: true,
        },
      };
      const updated = await api("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(defaults),
      });

      setTheme("system");
      setTableDensity("comfortable");
      setDefaultPage("/dashboard");
      setDefaultExportFormat("CSV");
      setDefaultPrintOrientation("portrait");
      setNotifPrefs(defaults.notifications);

      localStorage.setItem("rportal_theme", "system");
      localStorage.setItem("rportal_density", "comfortable");
      document.documentElement.setAttribute("data-density", "comfortable");
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");

      onUserUpdated(updated);
      showNotification("Preferences restored to defined defaults.");
    } catch (err) {
      showNotification(err.message || "Failed to reset preferences.", "error");
    } finally {
      setSavingPrefs(false);
    }
  }

  // 6. Admin User Management Toggle
  async function handleToggleUserStatus(targetUser) {
    if (targetUser.id === userProfile.id) {
      showNotification("You cannot deactivate your own account.", "error");
      return;
    }
    const nextStatus = !targetUser.is_active;
    const actionName = nextStatus ? "activate" : "deactivate";

    if (!window.confirm(`Are you sure you want to ${actionName} ${targetUser.full_name}?`)) {
      return;
    }

    try {
      await api(`/api/users/${targetUser.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: nextStatus }),
      });
      showNotification(`User ${targetUser.full_name} is now ${nextStatus ? "Active" : "Inactive"}.`);
      await loadAdminUsers();
    } catch (err) {
      showNotification(err.message || `Failed to ${actionName} user.`, "error");
    }
  }

  const filteredAdminUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return adminUsers.filter((u) => {
      const matchSearch =
        !q ||
        (u.full_name || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q);
      const matchRole = userRoleFilter === "ALL" || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [adminUsers, userSearch, userRoleFilter]);

  if (loading && !userProfile) return <LoadingState message="Loading settings and user preferences…" />;
  if (error && !userProfile) return <ErrorState message={error} />;

  const isUserAdmin = userProfile?.role === "ADMIN";

  return (
    <div className="page settings-page">
      {notification && (
        <div className={`inline-alert ${notification.tone === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      <div className="page-heading">
        <div>
          <span className="eyebrow">CONFIGURATION & GOVERNANCE</span>
          <h1>Settings & Preferences</h1>
          <p>Personalize your experience, manage account credentials, and configure system preferences.</p>
        </div>
      </div>

      {/* Settings Tab Navigation */}
      <div className="settings-tab-bar">
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "profile" ? "active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          <Users size={16} />
          Profile
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "security" ? "active" : ""}`}
          onClick={() => setActiveTab("security")}
        >
          <Lock size={16} />
          Account & Security
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "appearance" ? "active" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          <Sun size={16} />
          Appearance
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          <BellRing size={16} />
          Notifications
        </button>
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
        >
          <Sliders size={16} />
          Preferences
        </button>
        {isUserAdmin && (
          <button
            type="button"
            className={`settings-nav-btn ${activeTab === "admin" ? "active" : ""}`}
            onClick={() => setActiveTab("admin")}
          >
            <Shield size={16} />
            User Governance
          </button>
        )}
        <button
          type="button"
          className={`settings-nav-btn ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
        >
          <Info size={16} />
          About
        </button>
      </div>

      {/* 1. PROFILE SECTION */}
      {(activeTab === "profile" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Profile Information</h2>
              <p>Your authenticated user account details</p>
            </div>
            <StatusBadge status={userProfile?.role || "LEAD"} />
          </div>

          <div className="profile-hero">
            <div className="profile-avatar-large">
              {userProfile?.full_name?.slice(0, 1).toUpperCase() || "U"}
            </div>
            <div className="profile-details-text">
              <h3 style={{ margin: 0, fontSize: "18px" }}>{userProfile?.full_name || "User"}</h3>
              <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
                {userProfile?.email} &bull; Account status:{" "}
                <span className="badge-pill active-pill" style={{ display: "inline-block" }}>
                  {userProfile?.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ marginTop: "20px" }}>
            <div className="form-row two-col">
              <div className="form-group">
                <label>Full Name *</label>
                {isEditingName ? (
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="primary-button small-button"
                      disabled={savingProfile}
                    >
                      {savingProfile ? "Saving..." : "Save"}
                    </button>
                    <button
                      type="button"
                      className="secondary-button small-button"
                      onClick={() => {
                        setFullName(userProfile?.full_name || "");
                        setIsEditingName(false);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                    <strong>{userProfile?.full_name || "—"}</strong>
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Pencil size={14} style={{ marginRight: "4px", verticalAlign: "middle" }} />
                      Edit Name
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Email Address (Read-only)</label>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span>{userProfile?.email || "—"}</span>
                </div>
                <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                  Email identity is managed by institutional authentication.
                </small>
              </div>
            </div>

            <div className="form-row two-col" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Assigned Role (Read-only)</label>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <strong>{userProfile?.role || "LEAD"}</strong>
                </div>
                <small style={{ color: "#64748b", marginTop: "4px", display: "block" }}>
                  Role privileges are strictly governed by System Administration.
                </small>
              </div>

              <div className="form-group">
                <label>Member Since</label>
                <div style={{ background: "#f8fafc", padding: "10px 14px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <span>{userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString(undefined, { dateStyle: "long" }) : "—"}</span>
                </div>
              </div>
            </div>
          </form>
        </section>
      )}

      {/* 2. ACCOUNT & SECURITY SECTION */}
      {(activeTab === "security" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Account & Security</h2>
              <p>Update your password and manage login credentials</p>
            </div>
          </div>

          {passwordError && (
            <div className="inline-alert error" style={{ marginBottom: "16px" }}>
              {passwordError}
            </div>
          )}
          {passwordSuccess && (
            <div className="inline-alert success" style={{ marginBottom: "16px" }}>
              {passwordSuccess}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ maxWidth: "580px" }}>
            <div className="form-group">
              <label>Current Password *</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter existing password"
                autoComplete="current-password"
              />
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label>New Password (min. 8 characters) *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </div>

            <div className="form-group" style={{ marginTop: "12px" }}>
              <label>Confirm New Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>

            <div style={{ marginTop: "18px" }}>
              <button
                type="submit"
                className="primary-button"
                disabled={savingPassword}
              >
                <Lock size={16} />
                {savingPassword ? "Updating Password..." : "Change Password"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 3. APPEARANCE SECTION */}
      {(activeTab === "appearance" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Appearance & Theme</h2>
              <p>Customize the visual interface of R-PORTAL</p>
            </div>
          </div>

          <div className="theme-options-grid">
            <div
              className={`theme-card ${theme === "light" ? "selected" : ""}`}
              onClick={() => handleThemeChange("light")}
            >
              <div className="theme-icon light">
                <Sun size={24} />
              </div>
              <div>
                <strong>Light Mode</strong>
                <p>Clean, crisp high-contrast daylight theme</p>
              </div>
              {theme === "light" && <CheckCircle2 size={20} className="theme-check" />}
            </div>

            <div
              className={`theme-card ${theme === "dark" ? "selected" : ""}`}
              onClick={() => handleThemeChange("dark")}
            >
              <div className="theme-icon dark">
                <Moon size={24} />
              </div>
              <div>
                <strong>Dark Mode</strong>
                <p>Sleek, low-light optimized slate theme</p>
              </div>
              {theme === "dark" && <CheckCircle2 size={20} className="theme-check" />}
            </div>

            <div
              className={`theme-card ${theme === "system" ? "selected" : ""}`}
              onClick={() => handleThemeChange("system")}
            >
              <div className="theme-icon system">
                <Laptop size={24} />
              </div>
              <div>
                <strong>System Default</strong>
                <p>Automatically synchronize with your OS settings</p>
              </div>
              {theme === "system" && <CheckCircle2 size={20} className="theme-check" />}
            </div>
          </div>
        </section>
      )}

      {/* 4. NOTIFICATION PREFERENCES SECTION */}
      {(activeTab === "notifications" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Notification Preferences</h2>
              <p>Control which categories of platform events generate notifications</p>
            </div>
          </div>

          <div className="settings-toggles-list">
            <div className="settings-toggle-row">
              <div>
                <strong>Application Updates</strong>
                <p>Notifications when students submit or update recruitment drive applications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(notifPrefs.application_updates)}
                  onChange={() => handleToggleNotif("application_updates")}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <strong>Placement Drive Schedules</strong>
                <p>Alerts on new placement drives, deadline updates, and coordinator assignments</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(notifPrefs.drive_updates)}
                  onChange={() => handleToggleNotif("drive_updates")}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <strong>Recruiter & Company Engagement</strong>
                <p>Updates when new companies are registered or recruiter temperature changes</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(notifPrefs.recruiter_updates)}
                  onChange={() => handleToggleNotif("recruiter_updates")}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <strong>Student Records & Imports</strong>
                <p>Notifications for new student enrollments, batch imports, and eligibility updates</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(notifPrefs.student_updates)}
                  onChange={() => handleToggleNotif("student_updates")}
                />
                <span className="slider" />
              </label>
            </div>

            <div className="settings-toggle-row">
              <div>
                <strong>System & Governance Updates</strong>
                <p>Account registrations, team coordinator additions, and system notifications</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={Boolean(notifPrefs.system_updates)}
                  onChange={() => handleToggleNotif("system_updates")}
                />
                <span className="slider" />
              </label>
            </div>
          </div>
        </section>
      )}

      {/* 5. APPLICATION PREFERENCES SECTION */}
      {(activeTab === "preferences" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>Application Preferences</h2>
              <p>Configure table density, default landing page, and export preferences</p>
            </div>
          </div>

          <form onSubmit={handleSaveAppPreferences}>
            <div className="form-row two-col">
              <div className="form-group">
                <label>Default Page After Login</label>
                <select
                  value={defaultPage}
                  onChange={(e) => setDefaultPage(e.target.value)}
                >
                  <option value="/dashboard">Dashboard / Overview</option>
                  <option value="/students">Student Details</option>
                  <option value="/placement-team">Placement Team</option>
                  <option value="/recruiters">Recruiters</option>
                  <option value="/drives">Placement Drives</option>
                  <option value="/applications">Applications</option>
                  <option value="/reports">Placement Reports</option>
                  <option value="/notifications">Notifications</option>
                </select>
              </div>

              <div className="form-group">
                <label>Data Table Density</label>
                <select
                  value={tableDensity}
                  onChange={(e) => {
                    setTableDensity(e.target.value);
                    document.documentElement.setAttribute("data-density", e.target.value);
                  }}
                >
                  <option value="comfortable">Comfortable (Standard spacing)</option>
                  <option value="compact">Compact (Condensed rows for high data volume)</option>
                </select>
              </div>
            </div>

            <div className="form-row two-col" style={{ marginTop: "12px" }}>
              <div className="form-group">
                <label>Default Export Format</label>
                <select
                  value={defaultExportFormat}
                  onChange={(e) => setDefaultExportFormat(e.target.value)}
                >
                  <option value="CSV">CSV (Comma Separated Values)</option>
                  <option value="XLSX">Excel Spreadsheet (.XLSX / .XLS)</option>
                  <option value="PDF">Print / PDF Document</option>
                </select>
              </div>

              <div className="form-group">
                <label>Default Print Orientation</label>
                <select
                  value={defaultPrintOrientation}
                  onChange={(e) => setDefaultPrintOrientation(e.target.value)}
                >
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                type="submit"
                className="primary-button"
                disabled={savingPrefs}
              >
                <Sliders size={16} />
                {savingPrefs ? "Saving..." : "Save Preferences"}
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleResetDefaults}
                disabled={savingPrefs}
              >
                <RotateCcw size={15} />
                Reset to Defaults
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 6. ADMIN USER GOVERNANCE (ONLY ADMIN) */}
      {isUserAdmin && (activeTab === "admin" || activeTab === "all") && (
        <section className="panel settings-card">
          <div className="panel-header">
            <div>
              <h2>System User Governance (Admin Only)</h2>
              <p>Manage registered accounts and operational status</p>
            </div>
            <span className="badge-pill lead-pill">ADMIN ONLY</span>
          </div>

          <div className="toolbar" style={{ marginTop: "12px" }}>
            <div className="search-box">
              <Search size={18} />
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name or email..."
              />
            </div>

            <div className="toolbar-filters">
              <div className="select-box">
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)}>
                  <option value="ALL">All Roles ({adminUsers.length})</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="LEAD">LEAD</option>
                </select>
                <ChevronDown size={15} />
              </div>
            </div>
          </div>

          {userLoading ? (
            <LoadingState message="Loading system users…" />
          ) : filteredAdminUsers.length === 0 ? (
            <EmptyState title="No users found" message="No user accounts match your search filter." />
          ) : (
            <div className="table-wrap" style={{ marginTop: "12px" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>USER</th>
                    <th>EMAIL</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>MEMBER SINCE</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <strong>{u.full_name}</strong>
                        {u.id === userProfile.id && (
                          <span className="badge-pill active-pill" style={{ marginLeft: "6px" }}>You</span>
                        )}
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <StatusBadge status={u.role} />
                      </td>
                      <td>
                        <span className={`badge-pill ${u.is_active ? "active-pill" : "inactive-pill"}`}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                      <td>
                        {u.id === userProfile.id ? (
                          <small style={{ color: "#64748b" }}>Current user</small>
                        ) : (
                          <button
                            type="button"
                            className={`secondary-button small-button ${u.is_active ? "danger-btn" : ""}`}
                            onClick={() => handleToggleUserStatus(u)}
                          >
                            {u.is_active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* 7. SESSION & SIGN OUT SECTION */}
      <section className="panel settings-card">
        <div className="panel-header">
          <div>
            <h2>Active Session</h2>
            <p>Authentication and session management</p>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          <div>
            <strong>Signed in as: {userProfile?.email}</strong>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "13px" }}>
              Role: <b>{userProfile?.role}</b> &bull; Security token is currently active.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            style={{ color: "#ef4444", borderColor: "#fecaca" }}
            onClick={onSignOut}
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </section>

      {/* 8. ABOUT R-PORTAL */}
      <section className="panel settings-card">
        <div className="panel-header">
          <div>
            <h2>About R-PORTAL</h2>
            <p>College Placement Operations Platform information</p>
          </div>
        </div>

        <div className="about-info-grid">
          <div className="about-info-item">
            <small>Platform</small>
            <strong>R-PORTAL</strong>
          </div>
          <div className="about-info-item">
            <small>Version</small>
            <strong>v2.4.0 (Enterprise)</strong>
          </div>
          <div className="about-info-item">
            <small>Stack</small>
            <strong>FastAPI &bull; React 19 &bull; SQLite/PostgreSQL</strong>
          </div>
          <div className="about-info-item">
            <small>Engine Status</small>
            <strong style={{ color: "#16a34a", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <span className="status-dot" style={{ background: "#16a34a" }} />
              Operational
            </strong>
          </div>
        </div>
      </section>
    </div>
  );
}

/* Compatibility export for App.jsx */
export { Applications as ApplicationsPage };
export { AuditLog as AuditPage };
export { Dashboard as DashboardPage };
export { Drives as DrivesPage };
export { Notifications as NotificationsPage };
export { PlacementTeam as PlacementTeamPage };
export { Recruiters as RecruitersPage };
export { Reports as ReportsPage };
export { Settings as SettingsPage };
export { Students as StudentsPage };