import io

from openpyxl import Workbook
from fastapi.testclient import TestClient

from app.main import app


def _build_workbook():
    workbook = Workbook()
    sheet = workbook.active
    sheet.title = "Students"
    sheet.append(["Registration Number", "Name", "Email", "Department", "CGPA", "Placement Status"])
    sheet.append(["REG-1001", "Alice Student", "alice@example.com", "CSE", "8.91", "Placed"])
    sheet.append(["REG-1002", "Bob Student", "bob@example.com", "ECE", "7.80", "Unplaced"])
    workbook.save("/tmp/student_import_test.xlsx")
    with open("/tmp/student_import_test.xlsx", "rb") as fh:
        return fh.read()


def test_student_import_route_accepts_excel_file():
    client = TestClient(app)
    payload = _build_workbook()

    response = client.post(
        "/api/students/import",
        files={"file": ("students.xlsx", payload, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
    )

    assert response.status_code == 200, response.text
    body = response.json()
    assert body["imported"] >= 1
    assert "message" in body
