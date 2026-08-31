import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  CheckCheck,
  ChevronDown,
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
  X,
  Zap,
  Activity,
} from "lucide-react";

const API = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "" : "http://localhost:8000")).replace(/\/$/, "");

function isAdmin() {
  try {
    return JSON.parse(localStorage.getItem("rportal_session"))?.user?.role === "ADMIN";
  } catch {
    return false;
  }
}

async function api(path, options = {}) {
  const token = localStorage.getItem("rportal_token");

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("rportal_token");
      localStorage.removeItem("rportal_session");
      window.location.href = "/login";
    }
    const text = await response.text();
    throw new Error(text || `Request failed: ${response.status}`);
  }

  if (response.status === 204) return null;

  return response.json();
}

function LoadingState() {
  return (
    <div className="state-card">
      <div className="spinner" />
      <span>Loading...</span>
    </div>
  );
}

function EmptyState({ title, message }) {
  return (
    <div className="state-card">
      <FileText size={30} />
      <strong>{title}</strong>
      <span>{message}</span>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="state-card error-state">
      <AlertCircle size={30} />
      <strong>Unable to load data</strong>
      <span>{message}</span>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, tone = "" }) {
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

function StatusBadge({ status }) {
  const value = String(status || "—").toLowerCase();

  return (
    <span className={`status-badge status-${value.replaceAll(" ", "-")}`}>
      <span className="status-dot" />
      {String(status || "—").toUpperCase()}
    </span>
  );
}

/* =========================================================
   DASHBOARD
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

        const [dashboard, companyData, driveData, applicationData, auditData] =
          await Promise.all([
            api("/api/dashboard"),
            api("/api/companies"),
            api("/api/drives"),
            api("/api/applications"),
            api("/api/audit"),
          ]);

        if (!active) return;

        setData(dashboard);
        setCompanies(Array.isArray(companyData) ? companyData : companyData?.items || []);
        setDrives(Array.isArray(driveData) ? driveData : driveData?.items || []);
        setApplications(
          Array.isArray(applicationData)
            ? applicationData
            : applicationData?.items || []
        );
        setAudit(Array.isArray(auditData) ? auditData : auditData?.items || []);
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

  const stats = data?.stats || data || {};

  const totalStudents =
    stats.total_students ??
    stats.students ??
    data?.total_students ??
    0;

  const eligibleStudents =
    stats.eligible_students ??
    data?.eligible_students ??
    0;

  const placedStudents =
    stats.placed_students ??
    data?.placed_students ??
    0;

  const placementPercentage =
    stats.placement_percentage ??
    data?.placement_percentage ??
    0;

  const activeDrives =
    stats.active_drives ??
    drives.filter((d) =>
      ["active", "upcoming", "open"].includes(
        String(d.status || "").toLowerCase()
      )
    ).length;

  const companyCount =
    stats.total_companies ??
    stats.companies ??
    companies.length;

  const applicationCount =
    stats.total_applications ??
    stats.applications ??
    applications.length;

  const offers =
    stats.total_offers ??
    stats.offers ??
    applications.filter((a) =>
      ["selected", "offer", "placed"].includes(
        String(a.status || "").toLowerCase()
      )
    ).length;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLACEMENT OPERATIONS</span>
          <h1>Overview</h1>
          <p>Monitor placement activity and recruitment progress.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={Users}
          title="Total Students"
          value={totalStudents}
          subtitle="Students in placement"
        />

        <StatCard
          icon={CheckCircle2}
          title="Eligible Students"
          value={eligibleStudents}
          subtitle="Currently eligible"
          tone="blue"
        />

        <StatCard
          icon={GraduationCap}
          title="Placed Students"
          value={placedStudents}
          subtitle="Successful placements"
          tone="green"
        />

        <StatCard
          icon={TrendingUp}
          title="Placement Percentage"
          value={`${Number(placementPercentage).toFixed(1)}%`}
          subtitle="Overall placement"
          tone="purple"
        />

        <StatCard
          icon={BriefcaseBusiness}
          title="Active Drives"
          value={activeDrives}
          subtitle="Current opportunities"
        />

        <StatCard
          icon={Building2}
          title="Companies"
          value={companyCount}
          subtitle="Recruiting companies"
          tone="blue"
        />

        <StatCard
          icon={FileText}
          title="Applications"
          value={applicationCount}
          subtitle="Student applications"
        />

        <StatCard
          icon={CheckCircle2}
          title="Offers"
          value={offers}
          subtitle="Offers / selections"
          tone="green"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel large-panel">
          <div className="panel-header">
            <div>
              <h2>Placement Overview</h2>
              <p>Current placement position</p>
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
                  <strong>
                    {Math.max(Number(totalStudents) - Number(placedStudents), 0)}
                  </strong>
                  <span>Not placed</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recruiter Momentum</h2>
              <p>Current company pipeline</p>
            </div>
          </div>

          <div className="momentum-list">
            <div className="momentum-row">
              <StatusBadge status="HOT" />
              <strong>
                {companies.filter(
                  (c) => String(c.status).toLowerCase() === "hot"
                ).length}
              </strong>
            </div>

            <div className="momentum-row">
              <StatusBadge status="WARM" />
              <strong>
                {companies.filter(
                  (c) => String(c.status).toLowerCase() === "warm"
                ).length}
              </strong>
            </div>

            <div className="momentum-row">
              <StatusBadge status="COLD" />
              <strong>
                {companies.filter(
                  (c) => String(c.status).toLowerCase() === "cold"
                ).length}
              </strong>
            </div>
          </div>
        </section>
      </div>

      <div className="dashboard-grid bottom-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Drives</h2>
              <p>Latest placement drives</p>
            </div>
          </div>

          {drives.length === 0 ? (
            <EmptyState
              title="No drives available"
              message="Placement drives will appear here when added."
            />
          ) : (
            <div className="compact-list">
              {drives.slice(0, 5).map((drive, index) => (
                <div className="compact-row" key={drive.id || index}>
                  <div>
                    <strong>
                      {typeof drive.company === "object"
                        ? (drive.company?.name || drive.title || "Placement Drive")
                        : (drive.company_name || drive.role || "Placement Drive")}
                    </strong>
                    <span>
                      {drive.drive_date || drive.date || "Date not available"}
                    </span>
                  </div>

                  <StatusBadge status={drive.status || "upcoming"} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest system changes</p>
            </div>
          </div>

          {audit.length === 0 ? (
            <EmptyState
              title="No activity"
              message="Recent placement activity will appear here."
            />
          ) : (
            <div className="compact-list">
              {audit.slice(0, 5).map((item, index) => (
                <div className="activity-row" key={item.id || index}>
                  <div className="activity-icon">
                    <Clock3 size={16} />
                  </div>

                  <div>
                    <strong>
                      {item.action || item.event || "System activity"}
                    </strong>
                    <span>
                      {item.created_at ||
                        item.timestamp ||
                        "Recently updated"}
                    </span>
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
   STUDENTS
========================================================= */

export function Students() {
  const admin = isAdmin();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [notification, setNotification] = useState(null);
  
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
  });
  
  const fileInputRef = useRef(null);

  const showNotification = (message, tone = "success") => {
    setNotification({ message, tone });
    setTimeout(() => setNotification(null), 4000);
  };

  async function loadStudents() {
    try {
      setLoading(true);
      const result = await api("/api/students");
      setStudents(Array.isArray(result) ? result : result?.items || []);
    } catch (err) {
      setError(err.message);
      showNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleImportExcel(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isValidType = /\.(xlsx|xls)$/i.test(file.name);
    if (!isValidType) {
      setImportFeedback({ tone: "error", message: "Only .xlsx and .xls files are supported." });
      event.target.value = "";
      return;
    }

    setImporting(true);
    setImportFeedback(null);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      const token = localStorage.getItem("rportal_token");

      const response = await fetch(`${API}/api/students/import`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formDataUpload,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = payload?.detail || payload?.message || "The Excel file could not be imported.";
        throw new Error(typeof detail === "string" ? detail : "The Excel file could not be imported.");
      }

      setImportFeedback({
        tone: "success",
        message: `Imported ${payload.imported ?? 0} students. ${payload.duplicates ?? 0} duplicates skipped.`,
      });
      showNotification(`Successfully imported ${payload.imported} students!`);
      await loadStudents();
    } catch (err) {
      setImportFeedback({ tone: "error", message: err.message || "Unable to import Excel file." });
      showNotification(err.message, "error");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  }

  async function handleAddStudent() {
    try {
      if (!formData.registration_number || !formData.name || !formData.email || !formData.department) {
        showNotification("Please fill all required fields", "error");
        return;
      }
      await api("/api/students", {
        method: "POST",
        body: JSON.stringify(formData),
      });
      showNotification(`Student ${formData.name} added successfully!`);
      setModalMode(null);
      setFormData({
        registration_number: "",
        name: "",
        email: "",
        phone: "",
        department: "",
        cgpa: "",
        placement_status: "SEEKING",
      });
      await loadStudents();
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  async function handleEditStudent() {
    try {
      if (!formData.registration_number || !formData.name || !formData.email || !formData.department) {
        showNotification("Please fill all required fields", "error");
        return;
      }
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

  function handleExportCSV() {
    try {
      const headers = ["S.NO", "REG. NO", "NAME", "DEPARTMENT", "EMAIL", "PHONE", "CGPA", "PLACEMENT STATUS"];
      const rows = filteredStudents.map((student, idx) => [
        idx + 1,
        student.registration_number,
        student.name,
        student.department,
        student.email,
        student.phone || "",
        student.cgpa || "",
        student.placement_status || "SEEKING",
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `students_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      showNotification("Students exported successfully!");
    } catch (err) {
      showNotification(err.message, "error");
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const departments = useMemo(() => {
    return [
      ...new Set(
        students
          .map((student) => student.department)
          .filter(Boolean)
          .map(String)
      ),
    ];
  }, [students]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter((student) => {
      const matchesSearch =
        !q ||
        String(student.name || "").toLowerCase().includes(q) ||
        String(student.registration_number || "").toLowerCase().includes(q) ||
        String(student.email || "").toLowerCase().includes(q);

      const matchesDepartment =
        department === "ALL" ||
        String(student.department || "").toUpperCase() === department;

      const studentStatus = student.placement_status || student.status || "";
      const matchesStatus =
        status === "ALL" ||
        String(studentStatus).toUpperCase() === status;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [students, search, department, status]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

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
          <h1>Student Details</h1>
          <p>Manage and monitor students participating in placements.</p>
        </div>

        <div className="page-heading-actions">
          {admin && <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              hidden
              onChange={handleImportExcel}
            />

            <button
              className="secondary-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              <Download size={16} />
              {importing ? "Importing..." : "Import Excel"}
            </button>

            <button
              className="primary-button"
              type="button"
              onClick={() => {
                setModalMode("add");
                setFormData({
                  registration_number: "",
                  name: "",
                  email: "",
                  phone: "",
                  department: "",
                  cgpa: "",
                  placement_status: "SEEKING",
                });
              }}
            >
              <Plus size={17} />
              Add Student
            </button>
          </>}
        </div>
      </div>

      {importFeedback && (
        <div className={`inline-alert ${importFeedback.tone === "error" ? "error" : "success"}`}>
          {importFeedback.message}
        </div>
      )}

      <div className="inline-kpis">
        <div className="mini-kpi">
          <span>Total Students</span>
          <strong>{students.length}</strong>
        </div>

        <div className="mini-kpi">
          <span>Placed</span>
          <strong>
            {
              students.filter((s) =>
                ["placed", "selected"].includes(
                  String(s.placement_status || s.status || "").toLowerCase()
                )
              ).length
            }
          </strong>
        </div>

        <div className="mini-kpi">
          <span>Unplaced</span>
          <strong>
            {
              students.filter(
                (s) =>
                  !["placed", "selected"].includes(
                    String(s.placement_status || s.status || "").toLowerCase()
                  )
              ).length
            }
          </strong>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, registration number or email..."
            />
          </div>

          <div className="toolbar-filters">
            <div className="select-box">
              <Filter size={16} />
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="ALL">All Departments</option>
                {departments.map((item) => (
                  <option key={item} value={item.toUpperCase()}>
                    {item}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} />
            </div>

            <div className="select-box">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PLACED">Placed</option>
                <option value="SEEKING">Seeking</option>
                <option value="NOT_ELIGIBLE">Not Eligible</option>
              </select>
              <ChevronDown size={15} />
            </div>

            <button className="secondary-button" onClick={handleExportCSV}>
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <EmptyState
            title="No students found"
            message="Import or add student records to populate this table."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.NO</th>
                  <th>REG. NO.</th>
                  <th>NAME</th>
                  <th>DEPARTMENT</th>
                  <th>EMAIL</th>
                  <th>CGPA</th>
                  <th>PLACEMENT</th>
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
                    <td>{student.cgpa || "—"}</td>
                    <td>
                      <StatusBadge status={student.placement_status || "SEEKING"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          title="View"
                          onClick={() => {
                            setSelectedStudent(student);
                            setFormData(student);
                            setModalMode("view");
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {admin && <>
                          <button
                            title="Edit"
                            onClick={() => {
                              setSelectedStudent(student);
                              setFormData(student);
                              setModalMode("edit");
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            title="Delete"
                            className="danger-icon"
                            onClick={() => {
                              setSelectedStudent(student);
                              setModalMode("delete");
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalMode === "view" && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Student Details</h2>
              <button onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number</label>
                <p>{selectedStudent.registration_number}</p>
              </div>
              <div className="form-group">
                <label>Name</label>
                <p>{selectedStudent.name}</p>
              </div>
              <div className="form-group">
                <label>Email</label>
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
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setModalMode(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {modalMode === "add" && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Student</h2>
              <button onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                  placeholder="e.g., REG-2025-001"
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Full Name"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="student@example.com"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  placeholder="e.g., CSE, ECE, Mechanical"
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
                  onChange={(e) => setFormData({...formData, cgpa: e.target.value})}
                  placeholder="e.g., 8.5"
                />
              </div>
              <div className="form-group">
                <label>Placement Status</label>
                <select
                  value={formData.placement_status}
                  onChange={(e) => setFormData({...formData, placement_status: e.target.value})}
                >
                  <option value="SEEKING">Seeking</option>
                  <option value="PLACED">Placed</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setModalMode(null)}>Cancel</button>
              <button className="primary-button" onClick={handleAddStudent}>Add Student</button>
            </div>
          </div>
        </div>
      )}

      {modalMode === "edit" && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Student</h2>
              <button onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Registration Number *</label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({...formData, registration_number: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Department *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
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
                  onChange={(e) => setFormData({...formData, cgpa: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Placement Status</label>
                <select
                  value={formData.placement_status}
                  onChange={(e) => setFormData({...formData, placement_status: e.target.value})}
                >
                  <option value="SEEKING">Seeking</option>
                  <option value="PLACED">Placed</option>
                  <option value="NOT_ELIGIBLE">Not Eligible</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setModalMode(null)}>Cancel</button>
              <button className="primary-button" onClick={handleEditStudent}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {modalMode === "delete" && selectedStudent && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Student</h2>
              <button onClick={() => setModalMode(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to delete <strong>{selectedStudent.name}</strong> ({selectedStudent.registration_number})?
              </p>
              <p style={{ color: "#ef4444", marginTop: "12px" }}>This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setModalMode(null)}>Cancel</button>
              <button className="primary-button" style={{ background: "#ef4444" }} onClick={handleDeleteStudent}>
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   PLACEMENT TEAM
========================================================= */

export function PlacementTeam() {
  const admin = isAdmin();
  const [members, setMembers] = useState([]);
  const [drives, setDrives] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [driveFilter, setDriveFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importFeedback, setImportFeedback] = useState(null);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  const [modalMode, setModalMode] = useState(null);
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
    window.clearTimeout(showNotification.timeout);
    showNotification.timeout = window.setTimeout(() => setNotification(null), 4000);
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
      const response = await fetch(`${API}/api/placement-team/import`, {
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

  useEffect(() => {
    loadAll();
  }, []);

  const roleOptions = useMemo(
    () => [...new Set(members.map((member) => member.role).filter(Boolean))],
    [members]
  );

  const summary = useMemo(() => {
    const totalMembers = members.length;
    const activeMembers = members.filter((member) => member.is_active).length;
    const teamLeads = members.filter((member) => member.is_active && member.is_team_lead).length;
    const assignedDriveIds = new Set(
      members.flatMap((member) => (member.assigned_drives || []).map((drive) => Number(drive.id)))
    );

    return {
      totalMembers,
      activeMembers,
      teamLeads,
      assignedDrives: assignedDriveIds.size,
    };
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = search.toLowerCase();

    return members.filter((member) => {
      const name = member.user?.full_name || "";
      const email = member.user?.email || "";
      const roleValue = String(member.role || "");
      const responsibility = String(member.responsibility || "");
      const matchesSearch =
        !q ||
        `${name} ${email} ${roleValue} ${responsibility}`
          .toLowerCase()
          .includes(q);

      const matchesRole =
        roleFilter === "ALL" || roleValue === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && member.is_active) ||
        (statusFilter === "INACTIVE" && !member.is_active);

      const hasAssignment = (member.assigned_drives || []).length > 0;
      const matchesDrive =
        driveFilter === "ALL" ||
        (driveFilter === "ASSIGNED" && hasAssignment) ||
        (driveFilter === "UNASSIGNED" && !hasAssignment);

      return matchesSearch && matchesRole && matchesStatus && matchesDrive;
    });
  }, [members, search, roleFilter, statusFilter, driveFilter]);

  const resetForm = () => {
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
  };

  const openCreateModal = () => {
    setSelectedMember(null);
    setModalMode("add");
    resetForm();
  };

  const openEditModal = (member) => {
    setSelectedMember(member);
    setModalMode("edit");
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
  };

  const openViewModal = (member) => {
    setSelectedMember(member);
    setModalMode("view");
  };

  const openAssignDriveModal = (member) => {
    setSelectedMember(member);
    setSelectedDriveId("");
    setModalMode("assign");
  };

  const handleCreateMember = async () => {
    if (!formData.user_id || !formData.role || !formData.responsibility) {
      showNotification("Please select a user and fill the required role and responsibility.", "error");
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
      resetForm();
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to add team member.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    if (!formData.role || !formData.responsibility) {
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

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to delete this team member?")) return;
    setSaving(true);
    try {
      await api(`/api/placement-team/${memberId}`, { method: "DELETE" });
      showNotification("Team member deleted successfully.", "success");
      await loadAll();
    } catch (err) {
      showNotification(err.message || "Unable to delete team member.", "error");
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
          <span className="eyebrow">PLACEMENT OPERATIONS</span>
          <h1>Placement Team</h1>
          <p>Coordinate responsibilities across placement operations.</p>
        </div>

        {admin && <div className="page-heading-actions">
          <input ref={teamFileInputRef} type="file" accept=".xlsx,.xls" hidden onChange={handleImportExcel} />
          <button className="secondary-button" type="button" onClick={() => teamFileInputRef.current?.click()} disabled={importing}>
            <Download size={16} />
            {importing ? "Importing..." : "Import Excel"}
          </button>
          <button className="primary-button" type="button" onClick={openCreateModal}>
            <Plus size={17} />
            Add Team Member
          </button>
        </div>}
      </div>

      {importFeedback && <div className={`inline-alert ${importFeedback.tone === "error" ? "error" : "success"}`}>{importFeedback.message}</div>}

      <div className="inline-kpis">
        <StatCard icon={Users} title="Total Team Members" value={summary.totalMembers} />
        <StatCard icon={CheckCircle2} title="Active Members" value={summary.activeMembers} />
        <StatCard icon={TrendingUp} title="Team Leads" value={summary.teamLeads} />
        <StatCard icon={BriefcaseBusiness} title="Assigned Drives" value={summary.assignedDrives} />
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
                <option value="ALL">All Roles</option>
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

            <div className="select-box">
              <select value={driveFilter} onChange={(e) => setDriveFilter(e.target.value)}>
                <option value="ALL">All Assignments</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="UNASSIGNED">Unassigned</option>
              </select>
              <ChevronDown size={15} />
            </div>
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <EmptyState
            title="No placement team members found"
            message="Add team members to start managing placement operations."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>NAME</th>
                  <th>EMAIL</th>
                  <th>ROLE</th>
                  <th>RESPONSIBILITY</th>
                  <th>ASSIGNED DRIVES</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member, index) => (
                  <tr key={member.id || index}>
                    <td>
                      <strong>{member.user?.full_name || "—"}</strong>
                    </td>
                    <td>{member.user?.email || "—"}</td>
                    <td>{member.role || "—"}</td>
                    <td>{member.responsibility || "—"}</td>
                    <td>
                      {(member.assigned_drives || []).length > 0 ? (
                        <div className="inline-tags">
                          {(member.assigned_drives || []).slice(0, 3).map((drive) => (
                            <button
                              key={drive.id}
                              type="button"
                              className="tag-button"
                              onClick={() => {
                                const target = drives.find((item) => Number(item.id) === Number(drive.id));
                                if (target) {
                                  window.location.hash = `/drives`;
                                }
                              }}
                            >
                              {drive.title || "Drive"}
                            </button>
                          ))}
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
                        <button type="button" title="View details" onClick={() => openViewModal(member)}>
                          <Eye size={16} />
                        </button>
                        {admin && <>
                          <button type="button" title="Edit member" onClick={() => openEditModal(member)}>
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
                          <button type="button" title="Assign drive" className="secondary-button small-button" onClick={() => openAssignDriveModal(member)}>
                            Assign Drive
                          </button>
                          <button
                            type="button"
                            title="Delete member"
                            className="danger-icon"
                            onClick={() => handleDeleteMember(member.id)}
                            disabled={saving}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalMode === "add" && (
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
                    <option value="">Select user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.full_name} ({user.email})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Admin">Admin</option>
                    <option value="Placement Coordinator">Placement Coordinator</option>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Faculty Coordinator">Faculty Coordinator</option>
                    <option value="Support Staff">Support Staff</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Responsibility *</label>
                  <input
                    type="text"
                    value={formData.responsibility}
                    onChange={(e) => setFormData({ ...formData, responsibility: e.target.value })}
                    placeholder="Student Verification"
                  />
                </div>

                <div className="form-group">
                  <label>Department / Responsibility Area</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Placement Cell"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                  />
                </div>

                <div className="form-group">
                  <label>Assignment</label>
                  <input
                    type="text"
                    value={formData.assignment}
                    onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                    placeholder="Drive Coordinator"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group checkbox-row">
                  <label>Status</label>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Active member
                  </label>
                </div>

                <div className="form-group checkbox-row">
                  <label>Team Lead</label>
                  <label className="checkbox-inline">
                    <input
                      type="checkbox"
                      checked={formData.is_team_lead}
                      onChange={(e) => setFormData({ ...formData, is_team_lead: e.target.checked })}
                    />
                    Mark as team lead
                  </label>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleCreateMember} disabled={saving}>
                {saving ? "Saving..." : "Add Team Member"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === "edit" && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Team Member</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Role *</label>
                  <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                    <option value="Admin">Admin</option>
                    <option value="Placement Coordinator">Placement Coordinator</option>
                    <option value="Placement Officer">Placement Officer</option>
                    <option value="Faculty Coordinator">Faculty Coordinator</option>
                    <option value="Support Staff">Support Staff</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={formData.is_active ? "ACTIVE" : "INACTIVE"} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "ACTIVE" })}>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
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
                  <label>Department / Responsibility Area</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Assignment</label>
                  <input
                    type="text"
                    value={formData.assignment}
                    onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                  />
                </div>
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

      {modalMode === "view" && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Team Member Details</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="form-group">
                  <label>Name</label>
                  <p>{selectedMember.user?.full_name || "—"}</p>
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
                  <label>Joined Date</label>
                  <p>{selectedMember.joined_date ? new Date(selectedMember.joined_date).toLocaleDateString() : "—"}</p>
                </div>
                <div className="form-group wide">
                  <label>Assigned Drives</label>
                  <div className="inline-tags">
                    {(selectedMember.assigned_drives || []).length > 0 ? (
                      selectedMember.assigned_drives.map((drive) => (
                        admin ? (
                          <button key={drive.id} type="button" className="tag-button" onClick={() => handleRemoveAssignment(selectedMember.id, drive.id, drive.title)}>
                            {drive.title} ×
                          </button>
                        ) : (
                          <span key={drive.id} className="tag-button">{drive.title}</span>
                        )
                      ))
                    ) : (
                      <span>Not assigned</span>
                    )}
                  </div>
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

      {modalMode === "assign" && selectedMember && (
        <div className="modal-backdrop" onClick={() => setModalMode(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Assign Drive</h2>
              <button type="button" onClick={() => setModalMode(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Team Member</label>
                <p>{selectedMember.user?.full_name || "—"}</p>
              </div>

              <div className="form-group">
                <label>Placement Drive *</label>
                <select value={selectedDriveId} onChange={(e) => setSelectedDriveId(e.target.value)}>
                  <option value="">Select a drive</option>
                  {drives.map((drive) => (
                    <option key={drive.id} value={drive.id}>{drive.title} ({drive.company?.name || "Company"})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Role / Responsibility</label>
                <input
                  type="text"
                  value={formData.assignment || selectedMember.responsibility || ""}
                  onChange={(e) => setFormData({ ...formData, assignment: e.target.value })}
                  placeholder="Drive Coordinator"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setModalMode(null)}>
                Cancel
              </button>
              <button type="button" className="primary-button" onClick={handleAssignDrive} disabled={saving}>
                {saving ? "Assigning..." : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   RECRUITERS
========================================================= */

export function Recruiters() {
  const admin = isAdmin();
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [temperature, setTemperature] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    industry: "",
    contact_name: "",
    contact_email: "",
    recruiter_status: "COLD",
  });

  async function load() {
    try {
      setLoading(true);
      const result = await api("/api/recruiters");
      setCompanies(Array.isArray(result) ? result : result?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = companies.filter((company) => {
    const q = search.toLowerCase();
    const companyTemp = String(company.recruiter_status || "COLD").toUpperCase();

    return (
      (!q ||
        String(company.name || "").toLowerCase().includes(q) ||
        String(company.contact_name || "").toLowerCase().includes(q) ||
        String(company.contact_email || "").toLowerCase().includes(q)) &&
      (temperature === "ALL" || companyTemp === temperature)
    );
  });

  const stats = {
    total: companies.length,
    cold: companies.filter((c) => c.recruiter_status === "COLD").length,
    warm: companies.filter((c) => c.recruiter_status === "WARM").length,
    hot: companies.filter((c) => c.recruiter_status === "HOT").length,
    drive_completed: companies.filter((c) => c.recruiter_status === "DRIVE_COMPLETED").length,
  };

  async function handleSave() {
    if (!formData.name.trim()) {
      alert("Company name is required");
      return;
    }
    try {
      setSaving(true);
      if (editingCompany) {
        await api(`/api/recruiters/${editingCompany.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
      } else {
        await api("/api/recruiters", {
          method: "POST",
          body: JSON.stringify(formData),
        });
      }
      setFormData({
        name: "",
        website: "",
        industry: "",
        contact_name: "",
        contact_email: "",
        recruiter_status: "COLD",
      });
      setEditingCompany(null);
      setShowAddModal(false);
      setShowEditModal(false);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  function openAddModal() {
    setFormData({
      name: "",
      website: "",
      industry: "",
      contact_name: "",
      contact_email: "",
      recruiter_status: "COLD",
    });
    setEditingCompany(null);
    setShowAddModal(true);
  }

  function openEditModal(company) {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      website: company.website || "",
      industry: company.industry || "",
      contact_name: company.contact_name || "",
      contact_email: company.contact_email || "",
      recruiter_status: company.recruiter_status || "COLD",
    });
    setShowEditModal(true);
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this recruiter?")) return;
    try {
      await api(`/api/recruiters/${id}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">RECRUITMENT PIPELINE</span>
          <h1>Recruiters</h1>
          <p>Company relationships and recruitment momentum</p>
        </div>

        {admin && (
          <button className="primary-button" onClick={openAddModal}>
            <Plus size={17} />
            Add Recruiter
          </button>
        )}
      </div>

      <div className="stats-grid four">
        <StatCard icon={Building2} title="Total Recruiters" value={stats.total} />
        <StatCard icon={Zap} title="Hot" value={stats.hot} />
        <StatCard icon={TrendingUp} title="Warm" value={stats.warm} />
        <StatCard icon={BarChart3} title="Cold" value={stats.cold} />
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company name, contact, or email..."
            />
          </div>

          <div className="select-box">
            <select
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
            >
              <option value="ALL">All Temperatures</option>
              <option value="HOT">Hot</option>
              <option value="WARM">Warm</option>
              <option value="COLD">Cold</option>
              <option value="DRIVE_COMPLETED">Drive Completed</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No recruiters found"
            message="Create or add recruiters to track company relationships."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>COMPANY NAME</th>
                  <th>CONTACT</th>
                  <th>EMAIL</th>
                  <th>INDUSTRY</th>
                  <th>TEMPERATURE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((company, index) => (
                  <tr key={company.id || index}>
                    <td>
                      <strong>{company.name || "—"}</strong>
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
                          title="View details"
                          onClick={() => {
                            setViewingCompany(company);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {admin && (
                          <>
                            <button onClick={() => openEditModal(company)}>
                              <Pencil size={16} />
                            </button>
                            <button
                              className="danger-icon"
                              onClick={() => handleDelete(company.id)}
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

      {admin && (showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingCompany ? "Edit Recruiter" : "Add Recruiter"}</h2>
              <button
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter company name"
                />
              </div>

              <div className="form-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  value={formData.contact_name}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                  placeholder="Enter contact person name"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label>Industry</label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder="Enter industry"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="Enter website URL"
                />
              </div>

              <div className="form-group">
                <label>Temperature</label>
                <select
                  value={formData.recruiter_status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recruiter_status: e.target.value,
                    })
                  }
                >
                  <option value="COLD">Cold</option>
                  <option value="WARM">Warm</option>
                  <option value="HOT">Hot</option>
                  <option value="DRIVE_COMPLETED">Drive Completed</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="secondary-button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && viewingCompany && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Recruiter Details</h2>
              <button type="button" className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Company Name</label>
                <p>{viewingCompany.name}</p>
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <p>{viewingCompany.contact_name || "—"}</p>
              </div>
              <div className="form-group">
                <label>Email</label>
                <p>{viewingCompany.contact_email || "—"}</p>
              </div>
              <div className="form-group">
                <label>Industry</label>
                <p>{viewingCompany.industry || "—"}</p>
              </div>
              <div className="form-group">
                <label>Website</label>
                <p>
                  {viewingCompany.website ? (
                    <a href={viewingCompany.website.startsWith("http") ? viewingCompany.website : `https://${viewingCompany.website}`} target="_blank" rel="noopener noreferrer">
                      {viewingCompany.website}
                    </a>
                  ) : "—"}
                </p>
              </div>
              <div className="form-group">
                <label>Temperature</label>
                <p><StatusBadge status={viewingCompany.recruiter_status || "COLD"} /></p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DRIVES
========================================================= */

export function Drives() {
  const admin = isAdmin();
  const [drives, setDrives] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingDrive, setViewingDrive] = useState(null);
  const [editingDrive, setEditingDrive] = useState(null);
  const [formData, setFormData] = useState({
    title: "Placement Drive",
    company_id: "",
    location: "TBD",
    package_lpa: "",
    eligibility: "N/A",
    deadline: "",
    status: "DRAFT",
    description: "",
    drive_date: "",
    departments: "",
    required_skills: "",
    work_mode: "Hybrid",
  });

  async function load() {
    try {
      setLoading(true);
      const [driveResult, compResult] = await Promise.all([
        api("/api/drives"),
        api("/api/recruiters"),
      ]);
      setDrives(Array.isArray(driveResult) ? driveResult : driveResult?.items || []);
      setCompanies(Array.isArray(compResult) ? compResult : compResult?.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveDrive() {
    if (!formData.title || !formData.company_id) {
      alert("Drive Title and Company are required.");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        ...formData,
        company_id: Number(formData.company_id),
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null,
        drive_date: formData.drive_date ? new Date(formData.drive_date).toISOString() : null,
      };
      
      if (editingDrive) {
        await api(`/api/drives/${editingDrive.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/drives", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      
      setFormData({
        title: "Placement Drive",
        company_id: "",
        location: "TBD",
        package_lpa: "",
        eligibility: "N/A",
        deadline: "",
        status: "DRAFT",
        description: "",
        drive_date: "",
        departments: "",
        required_skills: "",
        work_mode: "Hybrid",
      });
      setEditingDrive(null);
      setShowAddModal(false);
      setShowEditModal(false);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteDrive(id) {
    if (!confirm("Are you sure you want to delete this placement drive?")) return;
    try {
      await api(`/api/drives/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = drives.filter((drive) => {
    const q = search.toLowerCase();

    return (
      (!q ||
        String(typeof drive.company === "object" ? (drive.company?.name || drive.title) : (drive.company_name || drive.role || ""))
          .toLowerCase()
          .includes(q) ||
        String(drive.role || "").toLowerCase().includes(q)) &&
      (status === "ALL" ||
        String(drive.status || "").toUpperCase() === status)
    );
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PLACEMENT DRIVES</span>
          <h1>Placement Drives</h1>
          <p>Manage upcoming and completed recruitment drives.</p>
        </div>

        {admin && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setFormData({
                title: "Placement Drive",
                company_id: "",
                location: "TBD",
                package_lpa: "",
                eligibility: "N/A",
                deadline: "",
                status: "DRAFT",
                description: "",
                drive_date: "",
                departments: "",
                required_skills: "",
                work_mode: "Hybrid",
              });
              setEditingDrive(null);
              setShowAddModal(true);
            }}
          >
            <Plus size={17} />
            Create Drive
          </button>
        )}
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search company or role..."
            />
          </div>

          <div className="select-box">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No placement drives"
            message="Create a drive to start managing recruitment activity."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>COMPANY</th>
                  <th>ROLE</th>
                  <th>DATE</th>
                  <th>LOCATION</th>
                  <th>CTC</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((drive, index) => (
                  <tr key={drive.id || index}>
                    <td>
                      <strong>
                        {typeof drive.company === "object" ? (drive.company?.name || drive.title || "—") : (drive.company_name || "—")}
                      </strong>
                    </td>
                    <td>{drive.role || "—"}</td>
                    <td>{drive.drive_date || drive.date || "—"}</td>
                    <td>{drive.location || "—"}</td>
                    <td>{drive.ctc || drive.package || "—"}</td>
                    <td>
                      <StatusBadge status={drive.status || "upcoming"} />
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => {
                            setViewingDrive(drive);
                            setShowViewModal(true);
                          }}
                        >
                          <Eye size={16} />
                        </button>
                        {admin && <>
                          <button
                            type="button"
                            title="Edit drive"
                            onClick={() => {
                              setEditingDrive(drive);
                              setFormData({
                                title: drive.title || "",
                                company_id: String(drive.company_id || ""),
                                location: drive.location || "",
                                package_lpa: drive.package_lpa || "",
                                eligibility: drive.eligibility || "",
                                deadline: drive.deadline ? drive.deadline.slice(0, 16) : "",
                                status: drive.status || "DRAFT",
                                description: drive.description || "",
                                drive_date: drive.drive_date ? drive.drive_date.slice(0, 16) : "",
                                departments: drive.departments || "",
                                required_skills: drive.required_skills || "",
                                work_mode: drive.work_mode || "Hybrid",
                              });
                              setShowEditModal(true);
                            }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            title="Delete drive"
                            className="danger-icon"
                            onClick={() => handleDeleteDrive(drive.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showViewModal && viewingDrive && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Drive Details</h2>
              <button type="button" className="close-btn" onClick={() => setShowViewModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Drive Title & Role</label>
                <p><strong>{viewingDrive.title}</strong> — {viewingDrive.role || "TBD"}</p>
              </div>
              <div className="form-group">
                <label>Company</label>
                <p>{typeof viewingDrive.company === "object" ? (viewingDrive.company?.name || viewingDrive.company_name) : (viewingDrive.company_name || "—")}</p>
              </div>
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Location</label>
                  <p>{viewingDrive.location || "—"}</p>
                </div>
                <div className="form-group">
                  <label>Work Mode</label>
                  <p>{viewingDrive.work_mode || "—"}</p>
                </div>
              </div>
              <div className="form-row two-col">
                <div className="form-group">
                  <label>CTC / Package</label>
                  <p>{viewingDrive.ctc || viewingDrive.package || viewingDrive.package_lpa || "—"}</p>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <p><StatusBadge status={viewingDrive.status} /></p>
                </div>
              </div>
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Drive Date</label>
                  <p>{viewingDrive.drive_date || viewingDrive.date || "—"}</p>
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <p>{viewingDrive.deadline || "—"}</p>
                </div>
              </div>
              <div className="form-group">
                <label>Target Departments</label>
                <p>{viewingDrive.departments || "—"}</p>
              </div>
              <div className="form-group">
                <label>Required Skills</label>
                <p>{viewingDrive.required_skills || "—"}</p>
              </div>
              <div className="form-group">
                <label>Eligibility & CGPA Criteria</label>
                <p>CGPA: {viewingDrive.min_cgpa || "6.0"} | Max Backlogs: {viewingDrive.max_backlogs ?? 0}</p>
                <p style={{ marginTop: "8px", whiteSpace: "pre-wrap" }}>{viewingDrive.eligibility || "—"}</p>
              </div>
              <div className="form-group">
                <label>Job Description & Details</label>
                <p style={{ whiteSpace: "pre-wrap" }}>{viewingDrive.description || "—"}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setShowViewModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {admin && (showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal modal-wide">
            <div className="modal-header">
              <h2>{editingDrive ? "Edit Placement Drive" : "Create Placement Drive"}</h2>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-row two-col">
                <div className="form-group">
                  <label>Drive Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Software Engineer 2026"
                  />
                </div>
                <div className="form-group">
                  <label>Target Recruiter / Company *</label>
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
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Job Role / Designation</label>
                  <input
                    type="text"
                    value={formData.role || ""}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="e.g. Backend Engineer"
                  />
                </div>
                <div className="form-group">
                  <label>Work Mode</label>
                  <select
                    value={formData.work_mode || "Hybrid"}
                    onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                  >
                    <option value="On-site">On-site</option>
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Bangalore"
                  />
                </div>
                <div className="form-group">
                  <label>CTC / Package (LPA)</label>
                  <input
                    type="text"
                    value={formData.package_lpa || ""}
                    onChange={(e) => setFormData({ ...formData, package_lpa: e.target.value })}
                    placeholder="e.g. 12.5 LPA"
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Drive Date</label>
                  <input
                    type="datetime-local"
                    value={formData.drive_date || ""}
                    onChange={(e) => setFormData({ ...formData, drive_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Application Deadline</label>
                  <input
                    type="datetime-local"
                    value={formData.deadline || ""}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row two-col">
                <div className="form-group">
                  <label>Target Departments (comma separated)</label>
                  <input
                    type="text"
                    value={formData.departments || ""}
                    onChange={(e) => setFormData({ ...formData, departments: e.target.value })}
                    placeholder="e.g. CSE, IT, ECE"
                  />
                </div>
                <div className="form-group">
                  <label>Required Skills (comma separated)</label>
                  <input
                    type="text"
                    value={formData.required_skills || ""}
                    onChange={(e) => setFormData({ ...formData, required_skills: e.target.value })}
                    placeholder="e.g. Python, SQL, React"
                  />
                </div>
              </div>

              <div className="form-row three-col">
                <div className="form-group">
                  <label>Min CGPA Cut-off</label>
                  <input
                    type="text"
                    value={formData.min_cgpa || "6.0"}
                    onChange={(e) => setFormData({ ...formData, min_cgpa: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Max Backlogs Allowed</label>
                  <input
                    type="number"
                    value={formData.max_backlogs ?? 0}
                    onChange={(e) => setFormData({ ...formData, max_backlogs: Number(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label>Drive Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="UPCOMING">Upcoming</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Eligibility details / description</label>
                <textarea
                  value={formData.eligibility}
                  onChange={(e) => setFormData({ ...formData, eligibility: e.target.value })}
                  rows={3}
                  placeholder="Enter detailed eligibility criteria"
                />
              </div>

              <div className="form-group">
                <label>Job Description & Details</label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  placeholder="Enter job description"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleSaveDrive}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   APPLICATIONS
========================================================= */

export function Applications() {
  const admin = isAdmin();
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [newStatus, setNewStatus] = useState("APPLIED");

  async function load() {
    try {
      setLoading(true);
      const result = await api("/api/applications");
      setApplications(
        Array.isArray(result) ? result : result?.items || []
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus() {
    if (!selectedApplication) return;
    try {
      setSaving(true);
      await api(`/api/applications/${selectedApplication.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      setShowStatusModal(false);
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteApplication(id) {
    if (!confirm("Are you sure you want to delete this application record?")) return;
    try {
      await api(`/api/applications/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = applications.filter((application) => {
    const q = search.toLowerCase();

    return (
      (!q ||
        String(typeof application.student === "object" ? (application.student?.name || application.student_name) : (application.student_name || ""))
          .toLowerCase()
          .includes(q) ||
        String(typeof application.company === "object" ? application.company?.name : (application.company_name || application.drive?.company?.name || ""))
          .toLowerCase()
          .includes(q)) &&
      (status === "ALL" ||
        String(application.status || "").toUpperCase() === status)
    );
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">APPLICATION PIPELINE</span>
          <h1>Applications</h1>
          <p>Track student applications across placement drives.</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student or company..."
            />
          </div>

          <div className="select-box">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>
            <ChevronDown size={15} />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No applications"
            message="Applications will appear here as students apply for drives."
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>COMPANY</th>
                  <th>DRIVE</th>
                  <th>DATE</th>
                  <th>STATUS</th>
                  <th>RESUME</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((application, index) => (
                  <tr key={application.id || index}>
                    <td>
                      <strong>
                        {typeof application.student === "object"
                          ? (application.student?.name || application.student_name || "—")
                          : (application.student_name || "—")}
                      </strong>
                    </td>
                    <td>
                      {typeof application.company === "object"
                        ? (application.company?.name || "—")
                        : (application.company_name || application.drive?.company?.name || application.drive?.title || "—")}
                    </td>
                    <td>{application.drive_id || "—"}</td>
                    <td>
                      {application.created_at ||
                        application.applied_at ||
                        "—"}
                    </td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td>
                      {application.resume_link ? (
                        <a
                          className="text-link"
                          href={application.resume_link}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <div className="table-actions">
                        {admin && (
                          <>
                            <button
                              type="button"
                              title="Update Status"
                              onClick={() => {
                                setSelectedApplication(application);
                                setNewStatus(application.status);
                                setShowStatusModal(true);
                              }}
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              title="Delete Application"
                              className="danger-icon"
                              onClick={() => handleDeleteApplication(application.id)}
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

      {showStatusModal && selectedApplication && (
        <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Application Status</h2>
              <button type="button" className="close-btn" onClick={() => setShowStatusModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Student Name</label>
                <p><strong>{typeof selectedApplication.student === "object" ? selectedApplication.student?.name : selectedApplication.student_name}</strong></p>
              </div>
              <div className="form-group">
                <label>Company / Drive</label>
                <p>{typeof selectedApplication.company === "object" ? selectedApplication.company?.name : (selectedApplication.company_name || selectedApplication.drive?.company?.name || "Placement Drive")}</p>
              </div>
              <div className="form-group">
                <label>New Application Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="APPLIED">Applied</option>
                  <option value="SHORTLISTED">Shortlisted</option>
                  <option value="SELECTED">Selected</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="secondary-button" onClick={() => setShowStatusModal(false)}>Cancel</button>
              <button type="button" className="primary-button" onClick={handleUpdateStatus} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   REPORTS
========================================================= */

export function Reports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/reports")
      .then((data) => setReports(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  const stats = reports || {};
  const departmentData = stats.department_placements || [];
  const funnelData = stats.application_funnel || [];

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ANALYTICS & REPORTING</span>
          <h1>Reports</h1>
          <p>Placement intelligence and outcome reporting</p>
        </div>

        <button className="secondary-button">
          <Download size={16} />
          Download Report
        </button>
      </div>

      <div className="stats-grid four">
        <StatCard
          icon={Users}
          title="Total Students"
          value={stats.total_students ?? 0}
        />
        <StatCard
          icon={GraduationCap}
          title="Placed"
          value={stats.placed_students ?? 0}
        />
        <StatCard
          icon={Building2}
          title="Companies"
          value={stats.total_companies ?? 0}
        />
        <StatCard
          icon={BriefcaseBusiness}
          title="Active Drives"
          value={stats.active_drives ?? 0}
        />
      </div>

      <div className="stats-grid three">
        <StatCard
          icon={TrendingUp}
          title="Hot Recruiters"
          value={stats.hot_recruiters ?? 0}
        />
        <StatCard
          icon={Activity}
          title="Offers"
          value={stats.offers ?? 0}
        />
        <StatCard
          icon={BarChart3}
          title="Placement %"
          value={`${stats.placement_percentage ?? 0}%`}
        />
      </div>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h2>Placement Overview</h2>
            <p>Key metrics calculated from live system data</p>
          </div>
        </div>

        <div className="report-grid">
          <div className="report-metric">
            <span>Total Applications</span>
            <strong>{stats.applications ?? 0}</strong>
          </div>

          <div className="report-metric">
            <span>Eligible Students</span>
            <strong>{stats.eligible_students ?? 0}</strong>
          </div>

          <div className="report-metric">
            <span>Unplaced Students</span>
            <strong>{stats.unplaced_students ?? 0}</strong>
          </div>

          <div className="report-metric">
            <span>Warm Recruiters</span>
            <strong>{stats.warm_recruiters ?? 0}</strong>
          </div>

          <div className="report-metric">
            <span>Cold Recruiters</span>
            <strong>{stats.cold_recruiters ?? 0}</strong>
          </div>

          <div className="report-metric">
            <span>Placement Rate</span>
            <strong>{stats.placement_percentage ?? 0}%</strong>
          </div>
        </div>
      </section>

      {departmentData.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h2>Department-wise Placements</h2>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>DEPARTMENT</th>
                  <th>PLACED</th>
                </tr>
              </thead>

              <tbody>
                {departmentData.map((dept, index) => (
                  <tr key={index}>
                    <td>{dept.department || "—"}</td>
                    <td>{dept.placed ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {funnelData.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h2>Application Pipeline</h2>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>STATUS</th>
                  <th>COUNT</th>
                </tr>
              </thead>

              <tbody>
                {funnelData.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

/* =========================================================
   AUDIT
========================================================= */

export function AuditLog() {
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/api/audit")
      .then((result) => {
        setAudit(Array.isArray(result) ? result : result?.items || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = audit.filter((item) => {
    const q = search.toLowerCase();

    return (
      !q ||
      JSON.stringify(item).toLowerCase().includes(q)
    );
  });

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM GOVERNANCE</span>
          <h1>Audit Log</h1>
          <p>Track important changes made across the platform.</p>
        </div>
      </div>

      <section className="panel">
        <div className="toolbar">
          <div className="search-box">
            <Search size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search audit activity..."
            />
          </div>

          <button className="secondary-button">
            <Download size={16} />
            Export
          </button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No audit activity"
            message="Important system changes will appear here."
          />
        ) : (
          <div className="audit-list">
            {filtered.map((item, index) => (
              <div className="audit-item" key={item.id || index}>
                <div className="audit-marker" />

                <div className="audit-content">
                  <strong>
                    {item.action || item.event || "System activity"}
                  </strong>

                  <span>
                    {item.description ||
                      (typeof item.details === "object" ? (Object.entries(item.details || {}).map(([k, v]) => `${k}: ${v}`).join(", ") || item.entity_type) : item.details) ||
                      item.entity_type ||
                      "Platform activity"}
                  </span>

                  <small>
                    {item.created_at ||
                      item.timestamp ||
                      "Time unavailable"}
                  </small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =========================================================
   NOTIFICATIONS
========================================================= */

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  async function load() {
    try {
      setLoading(true);

      const result = await api("/api/notifications");
      setNotifications(Array.isArray(result) ? result : result?.items || []);

      const count = await api("/api/notifications/unread-count");
      setUnreadCount(count?.unread_count || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = notifications.filter((notification) => {
    if (filter === "UNREAD") return !notification.is_read;
    if (filter === "READ") return notification.is_read;
    return true;
  });

  async function handleMarkAsRead(id) {
    try {
      await api(`/api/notifications/${id}/read`, { method: "PATCH" });
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await api("/api/notifications/read-all", { method: "PATCH" });
      await load();
    } catch (err) {
      alert("Error: " + err.message);
    }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;

  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM NOTIFICATIONS</span>
          <h1>Notifications</h1>
          <p>Operational updates requiring attention</p>
        </div>

        {unreadCount > 0 && (
          <button className="secondary-button" onClick={handleMarkAllAsRead}>
            <CheckCheck size={16} />
            Mark All as Read
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
              All {notifications.length > 0 && `(${notifications.length})`}
            </button>
            <button
              className={filter === "UNREAD" ? "active" : ""}
              onClick={() => setFilter("UNREAD")}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
            <button
              className={filter === "READ" ? "active" : ""}
              onClick={() => setFilter("READ")}
            >
              Read (
              {notifications.filter((n) => n.is_read).length})
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="You're all caught up"
            message="New notifications will appear here."
          />
        ) : (
          <div className="notification-list">
            {filtered.map((notification, index) => (
              <div
                className={`notification-item ${
                  notification.is_read ? "read" : "unread"
                }`}
                key={notification.id || index}
              >
                <div className="notification-icon">
                  {notification.is_read ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <AlertCircle size={18} />
                  )}
                </div>

                <div className="notification-content">
                  <div>
                    <strong>{notification.title || "Notification"}</strong>
                    {notification.notification_type && (
                      <span className="notification-type">
                        {notification.notification_type}
                      </span>
                    )}
                  </div>

                  <p>
                    {notification.message ||
                      notification.description ||
                      "You have a new platform update."}
                  </p>

                  <small>
                    {notification.created_at
                      ? new Date(notification.created_at).toLocaleString()
                      : ""}
                  </small>
                </div>

                {!notification.is_read && (
                  <button
                    className="notification-action"
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

/* Compatibility export for App.jsx */
export { Applications as ApplicationsPage };
export { AuditLog as AuditPage };
export { Dashboard as DashboardPage };
export { Drives as DrivesPage };
export { Notifications as NotificationsPage };
export { PlacementTeam as PlacementTeamPage };
export { Recruiters as RecruitersPage };
export { Reports as ReportsPage };
export { Students as StudentsPage };    