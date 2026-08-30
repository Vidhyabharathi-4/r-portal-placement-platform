import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def user_tokens():
    test_users = {
        "admin": {"email": "admin@rportal.com", "password": "admin123", "role": "ADMIN"},
        "manager": {"email": "manager@test.com", "password": "test123456", "role": "MANAGER"},
        "lead": {"email": "lead@test.com", "password": "test123456", "role": "LEAD"},
    }
    tokens = {}
    for role, creds in test_users.items():
        r = client.post("/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        if r.status_code == 200:
            tokens[role] = r.json()["access_token"]
        else:
            r = client.post("/api/auth/register", json={
                "full_name": role.title(),
                "email": creds["email"],
                "password": creds["password"],
                "role": creds["role"]
            })
            if r.status_code == 201:
                tokens[role] = r.json()["access_token"]
    return tokens


def test_rbac_recruiter_operations(user_tokens):
    admin_headers = {"Authorization": f"Bearer {user_tokens['admin']}"}
    manager_headers = {"Authorization": f"Bearer {user_tokens['manager']}"}
    lead_headers = {"Authorization": f"Bearer {user_tokens['lead']}"}

    recruiter_data = {
        "name": "Test Company RBAC",
        "contact_name": "John Doe",
        "contact_email": "john_rbac@test.com",
        "industry": "IT",
        "recruiter_status": "HOT"
    }

    # Admin can create recruiter
    r = client.post("/api/recruiters", json=recruiter_data, headers=admin_headers)
    assert r.status_code in [201, 409]
    recruiter_id = r.json().get("id") if r.status_code == 201 else None

    # Manager and Lead cannot create recruiters
    r_mgr = client.post("/api/recruiters", json=recruiter_data, headers=manager_headers)
    assert r_mgr.status_code == 403

    r_lead = client.post("/api/recruiters", json=recruiter_data, headers=lead_headers)
    assert r_lead.status_code == 403

    # All roles can read recruiters
    assert client.get("/api/recruiters", headers=admin_headers).status_code == 200
    assert client.get("/api/recruiters", headers=manager_headers).status_code == 200
    assert client.get("/api/recruiters", headers=lead_headers).status_code == 200

    # Admin update vs Manager update
    if recruiter_id:
        r_update_admin = client.put(f"/api/recruiters/{recruiter_id}", json={**recruiter_data, "recruiter_status": "WARM"}, headers=admin_headers)
        assert r_update_admin.status_code == 200

        r_update_mgr = client.put(f"/api/recruiters/{recruiter_id}", json={**recruiter_data, "recruiter_status": "COLD"}, headers=manager_headers)
        assert r_update_mgr.status_code == 403


def test_rbac_reports_and_notifications(user_tokens):
    admin_headers = {"Authorization": f"Bearer {user_tokens['admin']}"}
    manager_headers = {"Authorization": f"Bearer {user_tokens['manager']}"}
    lead_headers = {"Authorization": f"Bearer {user_tokens['lead']}"}

    # All roles can view reports
    assert client.get("/api/reports", headers=admin_headers).status_code == 200
    assert client.get("/api/reports", headers=manager_headers).status_code == 200
    assert client.get("/api/reports", headers=lead_headers).status_code == 200

    # All roles can view notifications
    assert client.get("/api/notifications", headers=admin_headers).status_code == 200
    assert client.get("/api/notifications", headers=manager_headers).status_code == 200
    assert client.get("/api/notifications", headers=lead_headers).status_code == 200

    # All roles can view unread count
    assert client.get("/api/notifications/unread-count", headers=admin_headers).status_code == 200
    assert client.get("/api/notifications/unread-count", headers=manager_headers).status_code == 200
    assert client.get("/api/notifications/unread-count", headers=lead_headers).status_code == 200
