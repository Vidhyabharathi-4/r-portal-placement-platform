import io
import uuid
from openpyxl import Workbook
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database import SessionLocal
from app.models import Role, User, Student, PlacementStatus
from app.dependencies import get_current_user


def _build_workbook():
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Students"
    sheet.append(["Registration Number", "Name", "Email", "Department", "CGPA", "Placement Status"])
    
    u1 = uuid.uuid4().hex[:8]
    u2 = uuid.uuid4().hex[:8]
    
    sheet.append([f"REG-{u1}", f"Alice {u1}", f"alice_{u1}@example.com", "CSE", "8.91", "Placed"])
    sheet.append([f"REG-{u2}", f"Bob {u2}", f"bob_{u2}@example.com", "ECE", "7.80", "Unplaced"])
    buf = io.BytesIO()
    workbook.save(buf)
    buf.seek(0)
    return buf.read()


def test_student_import_route_accepts_excel_file():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        full_name="Admin User",
        email="admin@rportal.com",
        role=Role.ADMIN,
        is_active=True
    )
    try:
        payload = _build_workbook()

        response = client.post(
            "/api/students/import",
            files={"file": ("students.xlsx", payload, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["imported"] >= 1
        assert "message" in body
    finally:
        app.dependency_overrides.clear()


def test_student_import_csv_and_fuzzy_headers():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        full_name="Manager User",
        email="manager@rportal.com",
        role=Role.MANAGER,
        is_active=True
    )
    try:
        u1 = uuid.uuid4().hex[:8]
        u2 = uuid.uuid4().hex[:8]
        
        # Test CSV with alternate fuzzy header names: RegNo, Candidate Name, Branch, Mail ID, Mobile No, Overall CGPA
        csv_content = (
            f"RegNo,Candidate Name,Branch,Mail ID,Mobile No,Overall CGPA,Status\n"
            f"CSV-{u1},Chitra {u1},AI&DS,chitra_{u1}@example.com,9876543210,9.25,Selected\n"
            f"CSV-{u2},Dinesh {u2},IT,dinesh_{u2}@example.com,9876543211,8.10,Available\n"
        ).encode("utf-8-sig")

        response = client.post(
            "/api/students/import?mode=skip",
            files={"file": ("students.csv", csv_content, "text/csv")},
        )

        assert response.status_code == 200, response.text
        body = response.json()
        assert body["imported"] == 2
        assert body["duplicates"] == 0

        with SessionLocal() as db:
            st = db.scalar(select(Student).where(Student.registration_number == f"CSV-{u1}"))
            assert st is not None
            assert st.name == f"Chitra {u1}"
            assert st.department == "AI&DS"
            assert st.cgpa == "9.25"
            assert st.placement_status == PlacementStatus.PLACED

        # Re-importing same file in skip mode should report duplicates with 200 OK
        response2 = client.post(
            "/api/students/import?mode=skip",
            files={"file": ("students.csv", csv_content, "text/csv")},
        )
        assert response2.status_code == 200
        body2 = response2.json()
        assert body2["imported"] == 0
        assert body2["duplicates"] == 2

        # Re-importing in upsert mode with modified CGPA
        csv_update = (
            f"RegNo,Candidate Name,Branch,Overall CGPA,Status\n"
            f"CSV-{u1},Chitra {u1} Updated,AI&DS,9.80,Placed\n"
        ).encode("utf-8")

        response3 = client.post(
            "/api/students/import?mode=upsert",
            files={"file": ("students_updated.csv", csv_update, "text/csv")},
        )
        assert response3.status_code == 200
        body3 = response3.json()
        assert body3["updated"] == 1

        with SessionLocal() as db:
            st = db.scalar(select(Student).where(Student.registration_number == f"CSV-{u1}"))
            assert st.name == f"Chitra {u1} Updated"
            assert st.cgpa == "9.8"

    finally:
        app.dependency_overrides.clear()


def test_download_sample_templates():
    client = TestClient(app)
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        full_name="Admin User",
        email="admin@rportal.com",
        role=Role.ADMIN,
        is_active=True
    )
    try:
        # Download XLSX template
        res_xlsx = client.get("/api/students/sample-template?format=xlsx")
        assert res_xlsx.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" in res_xlsx.headers["content-type"]
        assert len(res_xlsx.content) > 100

        # Download CSV template
        res_csv = client.get("/api/students/sample-template?format=csv")
        assert res_csv.status_code == 200
        assert "text/csv" in res_csv.headers["content-type"]
        assert b"Registration Number,Student Name,Department" in res_csv.content
    finally:
        app.dependency_overrides.clear()
