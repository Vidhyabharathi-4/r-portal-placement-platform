from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}

def test_admin_login_and_endpoints():
    login = client.post("/api/auth/login", json={"email": "admin@rportal.com", "password": "admin123"})
    assert login.status_code == 200
    token = login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    recruiters = client.get("/api/recruiters", headers=headers)
    assert recruiters.status_code == 200
    assert isinstance(recruiters.json(), list)

    reports = client.get("/api/reports", headers=headers)
    assert reports.status_code == 200
    data = reports.json()
    assert "total_students" in data
    assert "placed_students" in data
    assert "hot_recruiters" in data

    notifs = client.get("/api/notifications", headers=headers)
    assert notifs.status_code == 200

    unread = client.get("/api/notifications/unread-count", headers=headers)
    assert unread.status_code == 200
    assert "unread_count" in unread.json()
