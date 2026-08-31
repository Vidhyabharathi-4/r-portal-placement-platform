import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Role, User, RecruiterStatus, PlacementStatus
from app.dependencies import get_current_user


def test_rbac_and_modules():
    client = TestClient(app)

    # 1. Test Admin
    admin_user = User(id=1, full_name="Admin User", email="admin@rportal.com", role=Role.ADMIN, is_active=True)
    app.dependency_overrides[get_current_user] = lambda: admin_user

    # Admin reports
    res = client.get("/api/reports")
    assert res.status_code == 200, res.text
    rep_data = res.json()
    assert "total_students" in rep_data
    assert "hot_recruiters" in rep_data
    assert "records" in rep_data
    assert "recruiter_metrics" in rep_data

    # Admin recruiters
    res = client.get("/api/recruiters")
    assert res.status_code == 200
    res_active = client.get("/api/recruiters/active")
    assert res_active.status_code == 200

    # Admin notifications
    res = client.get("/api/notifications")
    assert res.status_code == 200
    res_count = client.get("/api/notifications/unread-count")
    assert res_count.status_code == 200
    res_read_all = client.patch("/api/notifications/read-all")
    assert res_read_all.status_code == 200

    # 2. Test Manager
    manager_user = User(id=2, full_name="Manager User", email="manager@test.com", role=Role.MANAGER, is_active=True)
    app.dependency_overrides[get_current_user] = lambda: manager_user

    # Manager CAN view placement team
    res = client.get("/api/placement-team")
    assert res.status_code == 200

    # Manager CANNOT create/edit placement team
    res = client.post("/api/placement-team", json={"user_id": 1, "role": "Officer", "responsibility": "Verification"})
    assert res.status_code == 403

    # Manager CAN view and create students
    import uuid
    uid = uuid.uuid4().hex[:6]
    res = client.post("/api/students", json={
        "registration_number": f"REG-MGR-{uid}",
        "name": f"Manager Student {uid}",
        "email": f"mgr_student_{uid}@example.com",
        "department": "CSE",
        "cgpa": "8.5",
        "placement_status": "SEEKING"
    })
    assert res.status_code == 201, res.text
    created_student_id = res.json()["id"]

    # Manager CAN update student
    res = client.put(f"/api/students/{created_student_id}", json={
        "registration_number": f"REG-MGR-{uid}",
        "name": f"Manager Student Updated {uid}",
        "email": f"mgr_student_{uid}@example.com",
        "department": "CSE",
        "cgpa": "9.0",
        "placement_status": "PLACED"
    })
    assert res.status_code == 200

    # Manager CAN delete student
    res = client.delete(f"/api/students/{created_student_id}")
    assert res.status_code == 204

    # 3. Test Lead
    lead_user = User(id=3, full_name="Lead User", email="lead@test.com", role=Role.LEAD, is_active=True)
    app.dependency_overrides[get_current_user] = lambda: lead_user

    # Lead CAN view students
    res = client.get("/api/students")
    assert res.status_code == 200

    # Lead CANNOT create/edit/delete student
    res = client.post("/api/students", json={
        "registration_number": f"REG-LEAD-{uid}",
        "name": "Lead Student",
        "email": f"lead_student_{uid}@example.com",
        "department": "ECE"
    })
    assert res.status_code == 403

    # Lead CAN access reports, recruiters, notifications
    res = client.get("/api/reports")
    assert res.status_code == 200
    res = client.get("/api/recruiters")
    assert res.status_code == 200
    res = client.get("/api/notifications")
    assert res.status_code == 200

    app.dependency_overrides.clear()
