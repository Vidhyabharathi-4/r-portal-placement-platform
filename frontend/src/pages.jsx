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
import RecruiterImportModal from "./components/RecruiterImportModal";

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

const memoryCache = new Map();
const inflightRequests = new Map();

export function getCached(key) {
  const item = memoryCache.get(key);
  if (!item) return undefined;
  if (Date.now() - item.timestamp > 180000) return undefined; // 3 min cache TTL
  return item.data;
}

export function setCached(key, data) {
  memoryCache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(prefix = "") {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
      }
    }
  }
}

export async function api(path, options = {}) {
  const isGet = !options.method || options.method.toUpperCase() === "GET";
  const token = localStorage.getItem("rportal_token");

  if (!isGet) {
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

    invalidateCache();
    if (response.status === 204) return null;
    return response.json();
  }

  // Deduplicate concurrent GET requests
  if (inflightRequests.has(path)) {
    return inflightRequests.get(path);
  }

  const reqPromise = (async () => {
    try {
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
      const data = await response.json();
      setCached(path, data);
      return data;
    } finally {
      inflightRequests.delete(path);
    }
  })();

  inflightRequests.set(path, reqPromise);
  return reqPromise;
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
  const [data, setData] = useState(() => getCached("/api/dashboard") || null);
  const [companies, setCompanies] = useState(() => getCached("/api/companies") || []);
  const [drives, setDrives] = useState(() => getCached("/api/drives") || []);
  const [applications, setApplications] = useState(() => getCached("/api/applications") || []);
  const [audit, setAudit] = useState(() => getCached("/api/audit") || []);
  const [loading, setLoading] = useState(() => !getCached("/api/dashboard"));
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        if (!getCached("/api/dashboard")) setLoading(true);
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
        if (active && !data) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;

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
  const [students, setStudents] = useState(() => getCached("/api/students") || []);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(() => !(getCached("/api/students")?.length > 0));
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
      if (!getCached("/api/students")?.length) setLoading(true);
      const result = await api("/api/students");
      setStudents(Array.isArray(result) ? result : []);
    } catch (err) {
      if (!students.length) setError(err.message);
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
  const [members, setMembers] = useState(() => getCached("/api/placement-team") || []);
  const [drives, setDrives] = useState(() => getCached("/api/drives") || []);
  const [users, setUsers] = useState(() => getCached("/api/users") || []);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(() => !(getCached("/api/placement-team")?.length > 0));
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
      if (!getCached("/api/placement-team")?.length) setLoading(true);
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
      if (!members.length) setError(err.message || "Unable to load placement team data.");
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

export function getCompanyInitials(name) {
  if (!name) return "CO";
  const clean = name.trim();
  const known = {
    "tata consultancy services": "TCS",
    "infosys limited": "INFY",
    "infosys": "INFY",
    "amazon web services": "AWS",
    "amazon": "AMZN",
    "microsoft corporation": "MSFT",
    "microsoft": "MSFT",
    "cognizant technology solutions": "CTS",
    "cognizant": "CTS",
    "zoho corporation": "ZOHO",
    "zoho": "ZOHO",
    "accenture": "ACN",
    "wipro limited": "WIPRO",
    "wipro": "WIPRO",
    "bosch global software": "BGS",
    "bosch": "BGS",
    "qualcomm india": "QCOM",
    "qualcomm": "QCOM",
    "goldman sachs": "GS",
    "morgan stanley": "MS",
    "samsung r&d": "SAMS",
    "samsung": "SAMS",
    "paypal india": "PYPL",
    "paypal": "PYPL",
    "cisco systems": "CSCO",
    "cisco": "CSCO",
    "capgemini": "CAP",
    "oracle india": "ORCL",
    "oracle": "ORCL",
    "ibm india": "IBM",
    "ibm": "IBM",
  };
  const lower = clean.toLowerCase();
  if (known[lower]) return known[lower];

  const words = clean.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

export function getCompanyLogoGradient(name) {
  const palettes = [
    "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)", // indigo-violet
    "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)", // sky-blue
    "linear-gradient(135deg, #059669 0%, #10b981 100%)", // emerald-teal
    "linear-gradient(135deg, #d97706 0%, #ea580c 100%)", // amber-orange
    "linear-gradient(135deg, #dc2626 0%, #e11d48 100%)", // red-rose
    "linear-gradient(135deg, #0891b2 0%, #0d9488 100%)", // cyan-teal
    "linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)", // warm bronze
    "linear-gradient(135deg, #581c87 0%, #7e22ce 100%)", // deep purple
  ];
  if (!name) return palettes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palettes[Math.abs(hash) % palettes.length];
}

export function Recruiters() {
  const canEdit = canManageRecruiters();
  const cachedData = getCached("/api/recruiters/overview");

  const [overview, setOverview] = useState(() => cachedData || {
    summary: { total_recruiters: 0, active_recruiters: 0, connected_companies: 0, placement_drives: 0, active_drives: 0, completed_drives: 0 },
    engagement_distribution: { cold: 0, warm: 0, hot: 0, drive_completed: 0 },
    companies: [],
    recruiters: []
  });

  const [activeStageTab, setActiveStageTab] = useState("ALL"); // ALL, HOT, WARM, COLD, DRIVE_COMPLETED
  const [search, setSearch] = useState("");
  const [recruiterStatusFilter, setRecruiterStatusFilter] = useState("ALL"); // ALL, ACTIVE, INACTIVE
  const [companyFilter, setCompanyFilter] = useState("ALL");
  const [driveFilter, setDriveFilter] = useState("ALL"); // ALL, WITH_DRIVES, NO_DRIVES

  const [sort, setSort] = useState({ key: "name", direction: "asc" });
  const [loading, setLoading] = useState(() => !(cachedData?.companies?.length > 0));
  const [saving, setSaving] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);

  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const [modalMode, setModalMode] = useState(null); // "view_company", "view_recruiter", "add_recruiter", "edit_recruiter", "delete_recruiter"
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedRecruiter, setSelectedRecruiter] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [companyModalTab, setCompanyModalTab] = useState("contacts"); // "contacts" or "drives"

  const [recruiterForm, setRecruiterForm] = useState({
    name: "",
    company_id: "",
    company_name: "",
    designation: "HR Manager",
    email: "",
    phone: "",
    alternate_phone: "",
    department: "Talent Acquisition",
    linkedin_url: "",
    status: "ACTIVE",
    notes: ""
  });

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadRecruitersData() {
    try {
      if (!overview?.companies?.length) setLoading(true);
      setError("");
      const result = await api("/api/recruiters/overview");
      if (result && result.companies) {
        setOverview(result);
        setCached("/api/recruiters/overview", result);
      }
    } catch (err) {
      if (!overview?.companies?.length) setError(err.message || "Unable to load recruiter pipeline data.");
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecruitersData();
  }, []);

  async function handleCompanyStatusChange(companyId, newStatus) {
    if (!canEdit) return;
    setStatusUpdatingId(companyId);
    try {
      await api(`/api/companies/${companyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      // Update state optimistically
      setOverview((prev) => {
        const nextCompanies = prev.companies.map((c) =>
          c.id === companyId ? { ...c, recruiter_status: newStatus, last_contacted_at: new Date().toISOString() } : c
        );
        const nextRecruiters = prev.recruiters.map((r) =>
          r.company_id === companyId ? { ...r, company_status: newStatus } : r
        );

        const cold = nextCompanies.filter((c) => c.recruiter_status === "COLD").length;
        const warm = nextCompanies.filter((c) => c.recruiter_status === "WARM").length;
        const hot = nextCompanies.filter((c) => c.recruiter_status === "HOT").length;
        const drive_completed = nextCompanies.filter((c) => c.recruiter_status === "DRIVE_COMPLETED").length;

        const updated = {
          ...prev,
          companies: nextCompanies,
          recruiters: nextRecruiters,
          engagement_distribution: { cold, warm, hot, drive_completed },
        };
        setCached("/api/recruiters/overview", updated);
        return updated;
      });

      invalidateCache("/api/companies");
      invalidateCache("/api/reports");
      invalidateCache("/api/dashboard");

      const compName = overview.companies.find((c) => c.id === companyId)?.name || "Company";
      showNotification(`${compName} engagement status updated to ${newStatus.replace("_", " ")}.`);
    } catch (err) {
      showNotification(err.message || "Failed to update company engagement status.", "error");
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function openCompanyDetails(company) {
    setSelectedCompany(company);
    setCompanyModalTab("contacts");
    setModalMode("view_company");
    setDetailsLoading(true);
    try {
      const details = await api(`/api/companies/${company.id}/details`);
      setCompanyDetails(details);
    } catch {
      setCompanyDetails(company);
    } finally {
      setDetailsLoading(false);
    }
  }

  function openRecruiterDetails(recruiter) {
    setSelectedRecruiter(recruiter);
    setModalMode("view_recruiter");
  }

  function openAddRecruiterModal(defaultCompanyId = null) {
    const targetComp = defaultCompanyId ? overview.companies.find((c) => c.id === defaultCompanyId) : null;
    setRecruiterForm({
      name: "",
      company_id: defaultCompanyId || (overview.companies[0]?.id || ""),
      company_name: targetComp?.name || "",
      designation: "HR Manager",
      email: "",
      phone: "",
      alternate_phone: "",
      department: "University Relations / Talent Acquisition",
      linkedin_url: "",
      status: "ACTIVE",
      notes: ""
    });
    setModalMode("add_recruiter");
  }

  function openEditRecruiterModal(recruiter) {
    setSelectedRecruiter(recruiter);
    setRecruiterForm({
      name: recruiter.name || "",
      company_id: recruiter.company_id || "",
      company_name: recruiter.company_name || "",
      designation: recruiter.designation || "HR Manager",
      email: recruiter.email || "",
      phone: recruiter.phone === "—" ? "" : (recruiter.phone || ""),
      alternate_phone: recruiter.alternate_phone === "—" ? "" : (recruiter.alternate_phone || ""),
      department: recruiter.department || "",
      linkedin_url: recruiter.linkedin_url || "",
      status: recruiter.status || "ACTIVE",
      notes: recruiter.notes || ""
    });
    setModalMode("edit_recruiter");
  }

  function openDeleteRecruiterModal(recruiter) {
    setSelectedRecruiter(recruiter);
    setModalMode("delete_recruiter");
  }

  async function handleSaveRecruiter(e) {
    e?.preventDefault();
    if (!recruiterForm.name.trim() || !recruiterForm.email.trim()) {
      showNotification("Please provide recruiter name and a valid email.", "error");
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "edit_recruiter" && selectedRecruiter) {
        await api(`/api/recruiters/contacts/${selectedRecruiter.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: recruiterForm.name.trim(),
            designation: recruiterForm.designation.trim(),
            email: recruiterForm.email.trim().toLowerCase(),
            phone: recruiterForm.phone.trim() || null,
            alternate_phone: recruiterForm.alternate_phone.trim() || null,
            department: recruiterForm.department.trim() || null,
            linkedin_url: recruiterForm.linkedin_url.trim() || null,
            status: recruiterForm.status,
            notes: recruiterForm.notes.trim() || null,
          }),
        });
        showNotification(`Recruiter contact ${recruiterForm.name} updated successfully!`);
      } else {
        await api("/api/recruiters/contacts", {
          method: "POST",
          body: JSON.stringify({
            company_id: Number(recruiterForm.company_id) || overview.companies[0]?.id,
            name: recruiterForm.name.trim(),
            designation: recruiterForm.designation.trim(),
            email: recruiterForm.email.trim().toLowerCase(),
            phone: recruiterForm.phone.trim() || null,
            alternate_phone: recruiterForm.alternate_phone.trim() || null,
            department: recruiterForm.department.trim() || null,
            linkedin_url: recruiterForm.linkedin_url.trim() || null,
            status: recruiterForm.status,
            notes: recruiterForm.notes.trim() || null,
          }),
        });
        showNotification(`Recruiter contact ${recruiterForm.name} added successfully!`);
      }

      setModalMode(null);
      invalidateCache("/api/recruiters/overview");
      await loadRecruitersData();
    } catch (err) {
      showNotification(err.message || "Failed to save recruiter contact.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRecruiter() {
    if (!selectedRecruiter) return;
    setSaving(true);
    try {
      await api(`/api/recruiters/contacts/${selectedRecruiter.id}`, { method: "DELETE" });
      showNotification(`Recruiter contact ${selectedRecruiter.name} deleted successfully.`);
      setModalMode(null);
      invalidateCache("/api/recruiters/overview");
      await loadRecruitersData();
    } catch (err) {
      showNotification(err.message || "Failed to delete recruiter contact.", "error");
    } finally {
      setSaving(false);
    }
  }

  const companiesList = overview.companies || [];
  const recruitersList = overview.recruiters || [];

  const stats = useMemo(() => {
    return {
      totalRecruiters: overview.summary?.total_recruiters ?? recruitersList.length,
      activeRecruiters: overview.summary?.active_recruiters ?? recruitersList.filter((r) => r.status === "ACTIVE").length,
      connectedCompanies: overview.summary?.connected_companies ?? companiesList.length,
      placementDrives: overview.summary?.placement_drives ?? 0,
      activeDrives: overview.summary?.active_drives ?? 0,
      hot: overview.engagement_distribution?.hot ?? companiesList.filter((c) => c.recruiter_status === "HOT").length,
      warm: overview.engagement_distribution?.warm ?? companiesList.filter((c) => c.recruiter_status === "WARM").length,
      cold: overview.engagement_distribution?.cold ?? companiesList.filter((c) => c.recruiter_status === "COLD").length,
      driveCompleted: overview.engagement_distribution?.drive_completed ?? companiesList.filter((c) => ["DRIVE_COMPLETED", "DRIVE COMPLETED"].includes(c.recruiter_status)).length,
    };
  }, [overview, companiesList, recruitersList]);

  // Filtered companies for Stage Cards
  const filteredCompanies = useMemo(() => {
    const q = search.toLowerCase().trim();
    return companiesList.filter((c) => {
      const matchesSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        (c.industry && c.industry.toLowerCase().includes(q)) ||
        (c.primary_contact && c.primary_contact.toLowerCase().includes(q)) ||
        (c.primary_email && c.primary_email.toLowerCase().includes(q)) ||
        (c.primary_phone && c.primary_phone.toLowerCase().includes(q));

      const matchesStage = activeStageTab === "ALL" || c.recruiter_status === activeStageTab;
      const matchesCompany = companyFilter === "ALL" || String(c.id) === String(companyFilter);
      const matchesDrives =
        driveFilter === "ALL" ||
        (driveFilter === "WITH_DRIVES" && c.total_drives > 0) ||
        (driveFilter === "NO_DRIVES" && c.total_drives === 0);

      return matchesSearch && matchesStage && matchesCompany && matchesDrives;
    });
  }, [companiesList, search, activeStageTab, companyFilter, driveFilter]);

  // Stage categorizations
  const hotCompanies = filteredCompanies.filter((c) => c.recruiter_status === "HOT");
  const warmCompanies = filteredCompanies.filter((c) => c.recruiter_status === "WARM");
  const coldCompanies = filteredCompanies.filter((c) => c.recruiter_status === "COLD");
  const completedCompanies = filteredCompanies.filter((c) => ["DRIVE_COMPLETED", "DRIVE COMPLETED"].includes(c.recruiter_status));

  // Filtered recruiters for Table View
  const filteredRecruiters = useMemo(() => {
    const q = search.toLowerCase().trim();
    let list = recruitersList.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.company_name && r.company_name.toLowerCase().includes(q)) ||
        (r.designation && r.designation.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.department && r.department.toLowerCase().includes(q));

      const matchesStage = activeStageTab === "ALL" || r.company_status === activeStageTab;
      const matchesRecruiterStatus = recruiterStatusFilter === "ALL" || r.status === recruiterStatusFilter;
      const matchesCompany = companyFilter === "ALL" || String(r.company_id) === String(companyFilter);

      return matchesSearch && matchesStage && matchesRecruiterStatus && matchesCompany;
    });

    list.sort((a, b) => {
      let aVal = String(a[sort.key] || "").toLowerCase();
      let bVal = String(b[sort.key] || "").toLowerCase();
      if (aVal < bVal) return sort.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [recruitersList, search, activeStageTab, recruiterStatusFilter, companyFilter, sort]);

  const handleSort = (key) => {
    setSort((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const exportColumns = [
    { key: "name", label: "RECRUITER NAME" },
    { key: "company_name", label: "COMPANY NAME" },
    { key: "designation", label: "DESIGNATION", accessor: (item) => item.designation || "—" },
    { key: "email", label: "EMAIL" },
    { key: "phone", label: "PHONE", accessor: (item) => item.phone || "—" },
    { key: "company_status", label: "COMPANY STAGE", accessor: (item) => item.company_status || "COLD" },
    { key: "status", label: "CONTACT STATUS", accessor: (item) => item.status || "ACTIVE" },
    { key: "total_drives", label: "DRIVES", accessor: (item) => item.total_drives ?? 0 },
    { key: "last_contacted", label: "LAST CONTACTED", accessor: (item) => item.last_contacted ? new Date(item.last_contacted).toLocaleDateString() : "—" },
  ];

  if (loading && !overview?.companies?.length) return <LoadingState message="Loading recruiter engagement pipeline…" />;
  if (error && !overview?.companies?.length) return <ErrorState message={error} onRetry={loadRecruitersData} />;

  const totalStagesCount = (stats.hot + stats.warm + stats.cold + stats.driveCompleted) || 1;
  const hotPct = (stats.hot / totalStagesCount) * 100;
  const warmPct = (stats.warm / totalStagesCount) * 100;
  const coldPct = (stats.cold / totalStagesCount) * 100;
  const compPct = (stats.driveCompleted / totalStagesCount) * 100;

  return (
    <div className="page">
      {notification && (
        <div className={`inline-alert ${notification.tone === "error" ? "error" : "success"}`}>
          {notification.message}
        </div>
      )}

      {/* 1. PAGE HEADER */}
      <div className="page-heading">
        <div>
          <span className="eyebrow">COMPANY RELATIONSHIP & RECRUITMENT PIPELINE</span>
          <h1>Recruiters</h1>
          <p>Manage company recruitment contacts and engagement</p>
        </div>

        <div className="page-heading-actions">
          {canEdit && (
            <button className="secondary-button" type="button" onClick={() => setShowImportModal(true)}>
              <UploadCloud size={16} />
              Import
            </button>
          )}

          <button className="secondary-button" type="button" onClick={() => setShowExportModal(true)}>
            <Download size={16} />
            Export
          </button>

          {canEdit && (
            <button className="primary-button" type="button" onClick={() => openAddRecruiterModal()}>
              <Plus size={17} />
              Add Recruiter
            </button>
          )}
        </div>
      </div>

      {/* 2. SUMMARY CARDS */}
      <div className="stats-grid">
        <div style={{ cursor: "pointer" }} onClick={() => { setActiveStageTab("ALL"); setRecruiterStatusFilter("ALL"); setCompanyFilter("ALL"); }}>
          <StatCard
            icon={Users}
            title="Total Recruiters"
            value={stats.totalRecruiters}
            subtitle="Campus talent coordinators"
          />
        </div>

        <div style={{ cursor: "pointer" }} onClick={() => setRecruiterStatusFilter(recruiterStatusFilter === "ACTIVE" ? "ALL" : "ACTIVE")}>
          <StatCard
            icon={UserCheck}
            title="Active Recruiters"
            value={stats.activeRecruiters}
            subtitle={recruiterStatusFilter === "ACTIVE" ? "Filtered: Active only" : "Click to filter active"}
            tone="blue"
          />
        </div>

        <div style={{ cursor: "pointer" }} onClick={() => { setActiveStageTab("ALL"); setCompanyFilter("ALL"); }}>
          <StatCard
            icon={Building2}
            title="Companies Connected"
            value={stats.connectedCompanies}
            subtitle="Registered recruitment partners"
            tone="purple"
          />
        </div>

        <div style={{ cursor: "pointer" }} onClick={() => setDriveFilter(driveFilter === "WITH_DRIVES" ? "ALL" : "WITH_DRIVES")}>
          <StatCard
            icon={BriefcaseBusiness}
            title="Placement Drives"
            value={`${stats.activeDrives} / ${stats.placementDrives}`}
            subtitle="Active / Total drives scheduled"
            tone="green"
          />
        </div>
      </div>

      {/* 3. QUICK STATUS TABS & ENGAGEMENT DISTRIBUTION BAR */}
      <div className="pipeline-status-tabs">
        <button
          type="button"
          className={`pipeline-tab-button ${activeStageTab === "ALL" ? "active" : ""}`}
          onClick={() => setActiveStageTab("ALL")}
        >
          <span>All Stages</span>
          <span className="tab-badge">{companiesList.length}</span>
        </button>

        <button
          type="button"
          className={`pipeline-tab-button tab-hot ${activeStageTab === "HOT" ? "active" : ""}`}
          onClick={() => setActiveStageTab("HOT")}
        >
          <span>🔥 Hot</span>
          <span className="tab-badge">{stats.hot}</span>
        </button>

        <button
          type="button"
          className={`pipeline-tab-button tab-warm ${activeStageTab === "WARM" ? "active" : ""}`}
          onClick={() => setActiveStageTab("WARM")}
        >
          <span>⚡ Warm</span>
          <span className="tab-badge">{stats.warm}</span>
        </button>

        <button
          type="button"
          className={`pipeline-tab-button tab-cold ${activeStageTab === "COLD" ? "active" : ""}`}
          onClick={() => setActiveStageTab("COLD")}
        >
          <span>❄️ Cold</span>
          <span className="tab-badge">{stats.cold}</span>
        </button>

        <button
          type="button"
          className={`pipeline-tab-button tab-completed ${activeStageTab === "DRIVE_COMPLETED" ? "active" : ""}`}
          onClick={() => setActiveStageTab("DRIVE_COMPLETED")}
        >
          <span>✅ Drive Completed</span>
          <span className="tab-badge">{stats.driveCompleted}</span>
        </button>
      </div>

      {/* Visual Pipeline Ratio Bar */}
      <div className="pipeline-distribution-bar" title={`Hot: ${stats.hot} | Warm: ${stats.warm} | Cold: ${stats.cold} | Completed: ${stats.driveCompleted}`}>
        <div className="distribution-segment hot" style={{ width: `${hotPct}%` }} />
        <div className="distribution-segment warm" style={{ width: `${warmPct}%` }} />
        <div className="distribution-segment cold" style={{ width: `${coldPct}%` }} />
        <div className="distribution-segment completed" style={{ width: `${compPct}%` }} />
      </div>

      {/* 4. COMPANY ENGAGEMENT STAGE SECTIONS */}
      <div className="pipeline-stages-container">

        {/* SECTION A: HOT PIPELINE */}
        {(activeStageTab === "ALL" || activeStageTab === "HOT") && (
          <section className="engagement-stage-card stage-hot">
            <div className="stage-header">
              <div className="stage-header-title">
                <div className="stage-icon-badge">🔥</div>
                <div className="stage-info">
                  <h3>HOT</h3>
                  <p>Companies actively discussing or preparing recruitment</p>
                </div>
              </div>
              <div className="stage-counts">
                <span className="stage-count-pill">{hotCompanies.length} Companies</span>
              </div>
            </div>

            {hotCompanies.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13.5px", background: "#f8fafc", borderRadius: "10px" }}>
                No companies in this category yet.
              </div>
            ) : (
              <div className="company-cards-grid">
                {hotCompanies.map((comp) => (
                  <CompanyCard
                    key={comp.id}
                    company={comp}
                    canEdit={canEdit}
                    isUpdating={statusUpdatingId === comp.id}
                    onStatusChange={handleCompanyStatusChange}
                    onViewCompany={openCompanyDetails}
                    onAddRecruiter={openAddRecruiterModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION B: WARM ENGAGEMENT */}
        {(activeStageTab === "ALL" || activeStageTab === "WARM") && (
          <section className="engagement-stage-card stage-warm">
            <div className="stage-header">
              <div className="stage-header-title">
                <div className="stage-icon-badge">⚡</div>
                <div className="stage-info">
                  <h3>WARM</h3>
                  <p>Companies currently engaged with the placement team</p>
                </div>
              </div>
              <div className="stage-counts">
                <span className="stage-count-pill">{warmCompanies.length} Companies</span>
              </div>
            </div>

            {warmCompanies.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13.5px", background: "#f8fafc", borderRadius: "10px" }}>
                No companies in this category yet.
              </div>
            ) : (
              <div className="company-cards-grid">
                {warmCompanies.map((comp) => (
                  <CompanyCard
                    key={comp.id}
                    company={comp}
                    canEdit={canEdit}
                    isUpdating={statusUpdatingId === comp.id}
                    onStatusChange={handleCompanyStatusChange}
                    onViewCompany={openCompanyDetails}
                    onAddRecruiter={openAddRecruiterModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION C: COLD PROSPECTS */}
        {(activeStageTab === "ALL" || activeStageTab === "COLD") && (
          <section className="engagement-stage-card stage-cold">
            <div className="stage-header">
              <div className="stage-header-title">
                <div className="stage-icon-badge">❄️</div>
                <div className="stage-info">
                  <h3>COLD</h3>
                  <p>Companies with limited or no recent engagement</p>
                </div>
              </div>
              <div className="stage-counts">
                <span className="stage-count-pill">{coldCompanies.length} Companies</span>
              </div>
            </div>

            {coldCompanies.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13.5px", background: "#f8fafc", borderRadius: "10px" }}>
                No companies in this category yet.
              </div>
            ) : (
              <div className="company-cards-grid">
                {coldCompanies.map((comp) => (
                  <CompanyCard
                    key={comp.id}
                    company={comp}
                    canEdit={canEdit}
                    isUpdating={statusUpdatingId === comp.id}
                    onStatusChange={handleCompanyStatusChange}
                    onViewCompany={openCompanyDetails}
                    onAddRecruiter={openAddRecruiterModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION D: DRIVE COMPLETED */}
        {(activeStageTab === "ALL" || activeStageTab === "DRIVE_COMPLETED") && (
          <section className="engagement-stage-card stage-completed">
            <div className="stage-header">
              <div className="stage-header-title">
                <div className="stage-icon-badge">✅</div>
                <div className="stage-info">
                  <h3>DRIVE COMPLETED</h3>
                  <p>Companies that have completed a placement drive</p>
                </div>
              </div>
              <div className="stage-counts">
                <span className="stage-count-pill">{completedCompanies.length} Companies</span>
              </div>
            </div>

            {completedCompanies.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "#94a3b8", fontSize: "13.5px", background: "#f8fafc", borderRadius: "10px" }}>
                No companies in this category yet.
              </div>
            ) : (
              <div className="company-cards-grid">
                {completedCompanies.map((comp) => (
                  <CompanyCard
                    key={comp.id}
                    company={comp}
                    canEdit={canEdit}
                    isUpdating={statusUpdatingId === comp.id}
                    onStatusChange={handleCompanyStatusChange}
                    onViewCompany={openCompanyDetails}
                    onAddRecruiter={openAddRecruiterModal}
                  />
                ))}
              </div>
            )}
          </section>
        )}

      </div>

      {/* 5. RECRUITER CONTACTS TABLE / DIRECTORY */}
      <section className="panel" style={{ marginTop: "12px" }}>
        <div style={{ padding: "18px 20px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>Recruiter Contacts Directory</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "#64748b" }}>
              Direct contact coordinates for campus hiring leads and talent acquisition specialists
            </p>
          </div>
          <span className="badge" style={{ background: "#f1f5f9", color: "#334155", fontWeight: 700 }}>
            {filteredRecruiters.length} Contacts
          </span>
        </div>

        <div className="toolbar" style={{ marginTop: "8px" }}>
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across recruiters, company, email, phone, designation..."
            />
          </div>

          <div className="toolbar-filters">
            {/* Recruiter Status Filter */}
            <div className="select-box">
              <select value={recruiterStatusFilter} onChange={(e) => setRecruiterStatusFilter(e.target.value)}>
                <option value="ALL">All Contacts</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
              <ChevronDown size={15} />
            </div>

            {/* Company Filter Dropdown */}
            <div className="select-box">
              <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
                <option value="ALL">All Companies ({companiesList.length})</option>
                {companiesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>

            {(search || activeStageTab !== "ALL" || recruiterStatusFilter !== "ALL" || companyFilter !== "ALL" || driveFilter !== "ALL") && (
              <button
                className="secondary-button small-button"
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveStageTab("ALL");
                  setRecruiterStatusFilter("ALL");
                  setCompanyFilter("ALL");
                  setDriveFilter("ALL");
                }}
              >
                <RotateCcw size={14} />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {filteredRecruiters.length === 0 ? (
          <EmptyState
            title="No recruiter contacts match the criteria"
            message="Try changing your search terms or filters, or add a new recruiter contact."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <SortHeader label="RECRUITER" sortKey="name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="COMPANY" sortKey="company_name" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="DESIGNATION" sortKey="designation" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="EMAIL" sortKey="email" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="PHONE" sortKey="phone" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="COMPANY STATUS" sortKey="company_status" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="RECRUITER STATUS" sortKey="status" currentSort={sort} onSort={handleSort} />
                  <SortHeader label="LAST CONTACTED" sortKey="last_contacted" currentSort={sort} onSort={handleSort} />
                  <th>DRIVES</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecruiters.map((recruiter) => (
                  <tr key={recruiter.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div className="recruiter-avatar-circle">
                          {recruiter.name ? recruiter.name.slice(0, 2).toUpperCase() : "HR"}
                        </div>
                        <div>
                          <strong>{recruiter.name}</strong>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{recruiter.department || "Talent Acquisition"}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: getCompanyLogoGradient(recruiter.company_name),
                            color: "#fff",
                            fontSize: "9px",
                            fontWeight: 800,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          {getCompanyInitials(recruiter.company_name)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{recruiter.company_name || "—"}</span>
                      </div>
                    </td>

                    <td>{recruiter.designation || "HR Manager"}</td>

                    <td>
                      {recruiter.email ? (
                        <a href={`mailto:${recruiter.email}`} style={{ color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Mail size={12} /> {recruiter.email}
                        </a>
                      ) : "—"}
                    </td>

                    <td>
                      {recruiter.phone && recruiter.phone !== "—" ? (
                        <a href={`tel:${recruiter.phone}`} style={{ color: "#475569", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <Phone size={12} /> {recruiter.phone}
                        </a>
                      ) : "—"}
                    </td>

                    <td>
                      <StatusBadge status={recruiter.company_status || "COLD"} />
                    </td>

                    <td>
                      <span className="badge" style={{
                        background: recruiter.status === "ACTIVE" ? "#dcfce7" : "#f1f5f9",
                        color: recruiter.status === "ACTIVE" ? "#15803d" : "#64748b",
                        fontSize: "11px",
                        fontWeight: 700
                      }}>
                        {recruiter.status || "ACTIVE"}
                      </span>
                    </td>

                    <td style={{ fontSize: "12px", color: "#64748b" }}>
                      {recruiter.last_contacted ? new Date(recruiter.last_contacted).toLocaleDateString() : "—"}
                    </td>

                    <td>
                      <span className="badge" style={{ background: "#eff6ff", color: "#1d4ed8", fontWeight: 700 }}>
                        {recruiter.total_drives ?? 0}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View Recruiter Profile"
                          onClick={() => openRecruiterDetails(recruiter)}
                        >
                          <Eye size={16} />
                        </button>
                        {canEdit && (
                          <>
                            <button
                              type="button"
                              title="Edit Recruiter Contact"
                              onClick={() => openEditRecruiterModal(recruiter)}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete Recruiter Contact"
                              className="danger-icon"
                              onClick={() => openDeleteRecruiterModal(recruiter)}
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

      {/* 6. MODALS */}

      {/* Import Modal */}
      <RecruiterImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          invalidateCache("/api/recruiters/overview");
          loadRecruitersData();
          showNotification("Recruiters imported successfully!");
        }}
      />

      {/* Export & Print Modal */}
      <ExportPrintModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Recruiters & Companies Directory"
        filename="recruiters_directory"
        columns={exportColumns}
        data={filteredRecruiters}
        filtersSummary={`Stage: ${activeStageTab} | Recruiter Status: ${recruiterStatusFilter} | Company: ${companyFilter === "ALL" ? "All" : companyFilter}`}
      />

      {/* View Company Modal */}
      {modalMode === "view_company" && selectedCompany && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  className="company-logo-container"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: getCompanyLogoGradient(selectedCompany.name),
                    borderRadius: "10px",
                  }}
                >
                  {selectedCompany.logo_url ? (
                    <img src={selectedCompany.logo_url} alt={selectedCompany.name} className="company-logo-img" />
                  ) : (
                    getCompanyInitials(selectedCompany.name)
                  )}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>{selectedCompany.name}</h2>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                    {selectedCompany.industry || "Enterprise Partner"} &bull; Relationship Stage:{" "}
                    <StatusBadge status={selectedCompany.recruiter_status} />
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-body">
              {detailsLoading ? (
                <LoadingState message="Loading company engagement records…" />
              ) : (
                <>
                  {/* Company Top Bar & Website */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Update Stage:</span>
                      {canEdit ? (
                        <select
                          className={`company-status-dropdown status-${(selectedCompany.recruiter_status || "COLD").toLowerCase().replace("_", "-")}`}
                          value={selectedCompany.recruiter_status}
                          onChange={(e) => {
                            handleCompanyStatusChange(selectedCompany.id, e.target.value);
                            setSelectedCompany({ ...selectedCompany, recruiter_status: e.target.value });
                          }}
                        >
                          <option value="HOT">🔥 Hot (Active Recruitment)</option>
                          <option value="WARM">⚡ Warm (In Discussion)</option>
                          <option value="COLD">❄️ Cold (Prospect)</option>
                          <option value="DRIVE_COMPLETED">✅ Drive Completed</option>
                        </select>
                      ) : (
                        <StatusBadge status={selectedCompany.recruiter_status} />
                      )}
                    </div>

                    {selectedCompany.website && (
                      <a
                        href={selectedCompany.website.startsWith("http") ? selectedCompany.website : `https://${selectedCompany.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="secondary-button small-button"
                      >
                        <Globe size={14} />
                        {selectedCompany.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </div>

                  {/* 4 Stat Metrics */}
                  <div className="stats-grid four" style={{ marginTop: "14px" }}>
                    <StatCard icon={BriefcaseBusiness} title="Total Drives" value={companyDetails?.total_drives ?? 0} />
                    <StatCard icon={CheckCircle2} title="Active Drives" value={companyDetails?.active_drives ?? 0} tone="blue" />
                    <StatCard icon={FileText} title="Applications" value={companyDetails?.total_applications ?? 0} />
                    <StatCard icon={Award} title="Selections / Offers" value={companyDetails?.selected_students ?? 0} tone="green" />
                  </div>

                  {/* Tabs: Contacts vs Drives */}
                  <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", marginTop: "18px", paddingBottom: "8px" }}>
                    <button
                      type="button"
                      className={`secondary-button small-button ${companyModalTab === "contacts" ? "primary-button" : ""}`}
                      onClick={() => setCompanyModalTab("contacts")}
                    >
                      <Users size={14} />
                      Recruiter Contacts ({companyDetails?.recruiters?.length ?? 0})
                    </button>

                    <button
                      type="button"
                      className={`secondary-button small-button ${companyModalTab === "drives" ? "primary-button" : ""}`}
                      onClick={() => setCompanyModalTab("drives")}
                    >
                      <BriefcaseBusiness size={14} />
                      Placement Drives ({companyDetails?.drives?.length ?? 0})
                    </button>

                    {canEdit && (
                      <button
                        type="button"
                        className="secondary-button small-button"
                        style={{ marginLeft: "auto" }}
                        onClick={() => openAddRecruiterModal(selectedCompany.id)}
                      >
                        <Plus size={14} /> Add Recruiter to {selectedCompany.name}
                      </button>
                    )}
                  </div>

                  {/* Contacts Tab Content */}
                  {companyModalTab === "contacts" && (
                    <div style={{ marginTop: "12px" }}>
                      {!companyDetails?.recruiters || companyDetails.recruiters.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                          No recruiter contacts recorded for this company yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {companyDetails.recruiters.map((rec) => (
                            <div key={rec.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "10px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div className="recruiter-avatar-circle">
                                  {rec.name.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <strong style={{ fontSize: "13.5px", color: "#0f172a" }}>{rec.name}</strong>
                                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                                    {rec.designation || "HR Lead"} &bull; {rec.department || "Talent Acquisition"}
                                  </p>
                                </div>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12.5px" }}>
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
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Drives Tab Content */}
                  {companyModalTab === "drives" && (
                    <div style={{ marginTop: "12px" }}>
                      {!companyDetails?.drives || companyDetails.drives.length === 0 ? (
                        <div style={{ padding: "20px", textAlign: "center", color: "#64748b", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                          No placement drives scheduled for this company yet.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {companyDetails.drives.map((d) => (
                            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", flexWrap: "wrap", gap: "8px" }}>
                              <div>
                                <strong style={{ fontSize: "14px", color: "#0f172a" }}>{d.title}</strong>
                                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#64748b" }}>
                                  Location: {d.location || "On-campus"} &bull; Package: {d.package_lpa || "Best in Industry"}
                                </p>
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <span style={{ fontSize: "12px", color: "#64748b" }}>
                                  {d.drive_date ? new Date(d.drive_date).toLocaleDateString() : "Date TBD"}
                                </span>
                                <StatusBadge status={d.status} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Last Engagement Note */}
                  {selectedCompany.last_contacted_at && (
                    <p style={{ marginTop: "16px", fontSize: "12px", color: "#94a3b8", textAlign: "right" }}>
                      Last Contacted / Updated: {new Date(selectedCompany.last_contacted_at).toLocaleDateString()}
                    </p>
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

      {/* View Recruiter Modal */}
      {modalMode === "view_recruiter" && selectedRecruiter && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div className="recruiter-avatar-circle" style={{ width: "40px", height: "40px", fontSize: "15px" }}>
                  {selectedRecruiter.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px" }}>{selectedRecruiter.name}</h2>
                  <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
                    {selectedRecruiter.designation || "HR Lead"} &bull; {selectedRecruiter.company_name}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label><Mail size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Email Address</label>
                  <p><a href={`mailto:${selectedRecruiter.email}`} style={{ color: "#2563eb", textDecoration: "none" }}>{selectedRecruiter.email}</a></p>
                </div>

                <div className="form-group">
                  <label><Phone size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Primary Phone</label>
                  <p>{selectedRecruiter.phone || "—"}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="form-group">
                  <label><Building2 size={13} style={{ verticalAlign: "middle", marginRight: "4px" }} />Company & Stage</label>
                  <p>
                    <strong>{selectedRecruiter.company_name}</strong> &bull;{" "}
                    <StatusBadge status={selectedRecruiter.company_status || "COLD"} />
                  </p>
                </div>

                <div className="form-group">
                  <label>Contact Status</label>
                  <p>
                    <span className="badge" style={{ background: selectedRecruiter.status === "ACTIVE" ? "#dcfce7" : "#f1f5f9", color: selectedRecruiter.status === "ACTIVE" ? "#15803d" : "#64748b" }}>
                      {selectedRecruiter.status || "ACTIVE"}
                    </span>
                  </p>
                </div>
              </div>

              {selectedRecruiter.department && (
                <div className="form-group">
                  <label>Department / Functional Team</label>
                  <p>{selectedRecruiter.department}</p>
                </div>
              )}

              {selectedRecruiter.notes && (
                <div className="form-group">
                  <label>Notes & Follow-up History</label>
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: "6px", fontSize: "13px", color: "#475569" }}>
                    {selectedRecruiter.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {canEdit && (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => openEditRecruiterModal(selectedRecruiter)}
                >
                  <Pencil size={14} /> Edit Contact
                </button>
              )}
              <button type="button" className="primary-button" onClick={() => setModalMode(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Recruiter Modal */}
      {(modalMode === "add_recruiter" || modalMode === "edit_recruiter") && canEdit && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalMode === "edit_recruiter" ? "Edit Recruiter Contact" : "Add Recruiter Contact"}</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <form onSubmit={handleSaveRecruiter}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    required
                    type="text"
                    value={recruiterForm.name}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, name: e.target.value })}
                    placeholder="e.g., Priya Sharma, Rohan Deshmukh"
                  />
                </div>

                <div className="form-group">
                  <label>Company *</label>
                  {modalMode === "edit_recruiter" ? (
                    <input type="text" disabled value={recruiterForm.company_name} />
                  ) : (
                    <select
                      required
                      value={recruiterForm.company_id}
                      onChange={(e) => {
                        const targetComp = companiesList.find((c) => String(c.id) === e.target.value);
                        setRecruiterForm({
                          ...recruiterForm,
                          company_id: e.target.value,
                          company_name: targetComp?.name || "",
                        });
                      }}
                    >
                      {companiesList.map((comp) => (
                        <option key={comp.id} value={comp.id}>
                          {comp.name} ({comp.industry || "General"})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Designation *</label>
                    <input
                      required
                      type="text"
                      value={recruiterForm.designation}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, designation: e.target.value })}
                      placeholder="e.g., Campus HR Lead, Technical Recruiter"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      required
                      type="email"
                      value={recruiterForm.email}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                      placeholder="recruiter@company.com"
                    />
                  </div>
                </div>

                <div className="form-row two-col">
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      value={recruiterForm.phone}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                    />
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={recruiterForm.status}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Department / Focus Area</label>
                  <input
                    type="text"
                    value={recruiterForm.department}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, department: e.target.value })}
                    placeholder="e.g., Engineering Hiring, University Relations"
                  />
                </div>

                <div className="form-group">
                  <label>Notes / Engagement Details</label>
                  <textarea
                    rows={2}
                    value={recruiterForm.notes}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, notes: e.target.value })}
                    placeholder="Details about recent conversation, hiring dates, or recruitment preferences..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? "Saving..." : modalMode === "edit_recruiter" ? "Save Changes" : "Add Recruiter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Recruiter Modal */}
      {modalMode === "delete_recruiter" && canEdit && selectedRecruiter && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Recruiter Contact</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete recruiter contact <strong>{selectedRecruiter.name}</strong> ({selectedRecruiter.company_name})?
              </p>
              <p style={{ color: "#ef4444", marginTop: "8px", fontSize: "13px" }}>
                This will remove the contact from the recruiter directory. Company records will be preserved safely.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                style={{ background: "#ef4444" }}
                onClick={handleDeleteRecruiter}
                disabled={saving}
              >
                {saving ? "Deleting..." : "Delete Recruiter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component for individual Company Cards in the 4 Stage Sections
function CompanyCard({ company, canEdit, isUpdating, onStatusChange, onViewCompany, onAddRecruiter }) {
  const isCompleted = ["DRIVE_COMPLETED", "DRIVE COMPLETED"].includes(company.recruiter_status);

  return (
    <div className="company-card">
      {/* Top row: Logo, Name, Industry, Website link */}
      <div className="company-card-top">
        <div
          className="company-logo-container"
          style={{ background: getCompanyLogoGradient(company.name) }}
        >
          {company.logo_url ? (
            <img src={company.logo_url} alt={company.name} className="company-logo-img" />
          ) : (
            getCompanyInitials(company.name)
          )}
        </div>

        <div className="company-card-meta">
          <h4>{company.name}</h4>
          <p>{company.industry || "Enterprise Partner"}</p>
          {company.website && (
            <a
              href={company.website.startsWith("http") ? company.website : `https://${company.website}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "11.5px", color: "#2563eb", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "3px", marginTop: "2px" }}
            >
              <Globe size={11} /> {company.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
            </a>
          )}
        </div>
      </div>

      {/* Contact person details */}
      <div className="company-card-contact">
        <div className="contact-person-name">
          <span>{company.primary_contact || company.contact_name || "Campus Hiring Team"}</span>
          <span className="badge" style={{ fontSize: "10.5px", background: "#e2e8f0", color: "#334155" }}>
            {company.recruiter_count ? `${company.recruiter_count} Contact${company.recruiter_count > 1 ? "s" : ""}` : "1 Contact"}
          </span>
        </div>

        <div className="contact-links">
          {company.primary_email || company.contact_email ? (
            <a href={`mailto:${company.primary_email || company.contact_email}`}>
              <Mail size={12} /> {company.primary_email || company.contact_email}
            </a>
          ) : (
            <span>No email listed</span>
          )}

          {(company.primary_phone || company.contact_phone) && (
            <a href={`tel:${company.primary_phone || company.contact_phone}`}>
              <Phone size={12} /> {company.primary_phone || company.contact_phone}
            </a>
          )}
        </div>
      </div>

      {/* Placement Drives & Drive Completed Outcomes */}
      <div className="company-card-stats">
        <div>
          <span style={{ fontWeight: 600, color: "#0f172a" }}>Drives: {company.total_drives ?? 0}</span>
          {company.latest_drive_title && (
            <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
              Latest: <strong>{company.latest_drive_title}</strong> ({company.latest_drive_status || "OPEN"})
            </div>
          )}
          {isCompleted && (company.applicants_count > 0 || company.selected_count > 0) && (
            <div style={{ fontSize: "11px", color: "#15803d", fontWeight: 600, marginTop: "2px" }}>
              🎯 {company.applicants_count} Applied &bull; {company.selected_count} Selected
            </div>
          )}
        </div>

        {/* Interactive Status Selector Dropdown */}
        <div>
          {canEdit ? (
            <select
              className={`company-status-dropdown status-${(company.recruiter_status || "COLD").toLowerCase().replace("_", "-")}`}
              value={company.recruiter_status || "COLD"}
              disabled={isUpdating}
              onChange={(e) => onStatusChange(company.id, e.target.value)}
              title="Change relationship stage"
            >
              <option value="HOT">HOT</option>
              <option value="WARM">WARM</option>
              <option value="COLD">COLD</option>
              <option value="DRIVE_COMPLETED">COMPLETED</option>
            </select>
          ) : (
            <StatusBadge status={company.recruiter_status || "COLD"} />
          )}
        </div>
      </div>

      {/* Footer: Last contacted & View Company Button */}
      <div className="company-card-footer">
        <span className="last-contacted-text">
          {company.last_contacted_at ? `Contact: ${new Date(company.last_contacted_at).toLocaleDateString()}` : "Recent"}
        </span>

        <button
          type="button"
          className="company-view-btn"
          onClick={() => onViewCompany(company)}
        >
          <Eye size={13} /> View Company
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   5. PLACEMENT DRIVES
========================================================= */

export function Drives() {
  const canEdit = canManageDrives();
  const [drives, setDrives] = useState(() => getCached("/api/drives") || []);
  const [companies, setCompanies] = useState(() => getCached("/api/companies") || []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "title", direction: "asc" });
  const [loading, setLoading] = useState(() => !(getCached("/api/drives")?.length > 0));
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
      if (!getCached("/api/drives")?.length) setLoading(true);
      const [driveList, compList] = await Promise.all([
        api("/api/drives"),
        api("/api/companies"),
      ]);
      setDrives(Array.isArray(driveList) ? driveList : []);
      setCompanies(Array.isArray(compList) ? compList : []);
    } catch (err) {
      if (!drives.length) setError(err.message);
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
  const [applications, setApplications] = useState(() => getCached("/api/applications") || []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sort, setSort] = useState({ key: "student_name", direction: "asc" });
  const [loading, setLoading] = useState(() => !(getCached("/api/applications")?.length > 0));
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  async function loadApplications() {
    try {
      if (!getCached("/api/applications")?.length) setLoading(true);
      const result = await api("/api/applications");
      setApplications(Array.isArray(result) ? result : []);
    } catch (err) {
      if (!applications.length) setError(err.message);
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
  const [reportsData, setReportsData] = useState(() => getCached("/api/reports") || null);
  const [companies, setCompanies] = useState(() => getCached("/api/companies") || []);
  const [loading, setLoading] = useState(() => !getCached("/api/reports"));
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
      const isInitialDefault = search === "" && selectedCompany === "ALL" && selectedDept === "ALL" && studentStatus === "ALL" && companyStatus === "ALL";
      if (!isInitialDefault || !getCached("/api/reports")) {
        setLoading(true);
      }
      setError("");

      const params = new URLSearchParams();
      if (search) params.append("query", search);
      if (selectedCompany !== "ALL") params.append("company", selectedCompany);
      if (selectedDept !== "ALL") params.append("department", selectedDept);
      if (studentStatus !== "ALL") params.append("student_status", studentStatus);
      if (companyStatus !== "ALL") params.append("company_status", companyStatus);

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const [repResult, compList] = await Promise.all([
        api(`/api/reports${queryString}`),
        api("/api/companies"),
      ]);

      setReportsData(repResult);
      setCompanies(Array.isArray(compList) ? compList : []);
    } catch (err) {
      if (!reportsData) setError(err.message || "Failed to load report data.");
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
  const [audit, setAudit] = useState(() => getCached("/api/audit") || []);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(() => !(getCached("/api/audit")?.length > 0));
  const [error, setError] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    if (!getCached("/api/audit")?.length) setLoading(true);
    api("/api/audit")
      .then((result) => setAudit(Array.isArray(result) ? result : []))
      .catch((err) => { if (!audit.length) setError(err.message); })
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
  const [notifications, setNotifications] = useState(() => getCached("/api/notifications") || []);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(() => !(getCached("/api/notifications")?.length > 0));
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(() => getCached("/api/notifications/unread-count")?.unread_count || 0);

  async function loadNotifications() {
    try {
      if (!getCached("/api/notifications")?.length) setLoading(true);
      setError("");
      const [listResult, countResult] = await Promise.all([
        api("/api/notifications"),
        api("/api/notifications/unread-count"),
      ]);

      setNotifications(Array.isArray(listResult) ? listResult : []);
      setUnreadCount(countResult?.unread_count || 0);
    } catch (err) {
      if (!notifications.length) setError(err.message || "Unable to load notifications.");
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
  const [loading, setLoading] = useState(() => !currentCtxUser && !getCached("/api/settings"));
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
  const [adminUsers, setAdminUsers] = useState(() => getCached("/api/users?include_inactive=true") || []);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [userLoading, setUserLoading] = useState(false);

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadSettings() {
    try {
      if (!currentCtxUser && !getCached("/api/settings")) setLoading(true);
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
      if (!userProfile) setError(err.message || "Failed to load settings.");
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