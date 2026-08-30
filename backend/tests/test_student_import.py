import io

from openpyxl import Workbook
from fastapi.testclient import TestClient

from app.main import app


import uuid

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


from app.models import Role, User
from app.dependencies import get_current_user


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
