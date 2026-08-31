import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from app.main import app
from app.database import SessionLocal
from app.models import Role, User
from app.dependencies import get_current_user
from app.security import hash_password, verify_password


def test_settings_and_preferences():
    client = TestClient(app)

    with SessionLocal() as db:
        admin_user = db.scalar(select(User).where(User.email == "admin@rportal.com"))
        if not admin_user:
            admin_user = User(
                full_name="System Admin",
                email="admin@rportal.com",
                password_hash=hash_password("admin123"),
                role=Role.ADMIN,
                is_active=True,
                preferences={},
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
        else:
            admin_user.password_hash = hash_password("admin123")
            admin_user.full_name = "System Admin"
            admin_user.preferences = {}
            db.commit()
            db.refresh(admin_user)
        admin_id = admin_user.id

    # 1. Test Admin settings
    app.dependency_overrides[get_current_user] = lambda: admin_user

    # GET /api/settings
    res = client.get("/api/settings")
    assert res.status_code == 200
    settings_data = res.json()
    assert "user" in settings_data
    assert "preferences" in settings_data
    assert settings_data["preferences"]["theme"] == "system"

    # PATCH /api/profile
    res = client.patch("/api/profile", json={"full_name": "Admin Super User"})
    assert res.status_code == 200
    assert res.json()["full_name"] == "Admin Super User"

    # PATCH /api/profile with invalid name (<2 chars)
    res = client.patch("/api/profile", json={"full_name": "A"})
    assert res.status_code == 422

    # PATCH /api/settings
    res = client.patch("/api/settings", json={
        "theme": "dark",
        "table_density": "compact",
        "default_page": "/reports",
        "notifications": {
            "student_updates": False,
            "drive_updates": True,
        }
    })
    assert res.status_code == 200
    updated_user = res.json()
    assert updated_user["preferences"]["theme"] == "dark"
    assert updated_user["preferences"]["table_density"] == "compact"
    assert updated_user["preferences"]["notifications"]["student_updates"] is False
    assert updated_user["preferences"]["notifications"]["drive_updates"] is True

    # POST /api/auth/change-password
    # Wrong current password
    res = client.post("/api/auth/change-password", json={
        "current_password": "wrongpassword",
        "new_password": "newsecurepassword123",
    })
    assert res.status_code == 400

    # Short new password
    res = client.post("/api/auth/change-password", json={
        "current_password": "admin123",
        "new_password": "short",
    })
    assert res.status_code == 422

    # Valid password change
    res = client.post("/api/auth/change-password", json={
        "current_password": "admin123",
        "new_password": "newsecurepassword123",
    })
    assert res.status_code == 200
    assert res.json()["message"] == "Password changed successfully."

    # 2. Test Admin User Status Management
    # Create target regular user for testing status toggle
    with SessionLocal() as db:
        test_user = db.scalar(select(User).where(User.email == "test_member@rportal.com"))
        if not test_user:
            test_user = User(
                full_name="Test Member",
                email="test_member@rportal.com",
                password_hash=hash_password("testpass123"),
                role=Role.LEAD,
                is_active=True,
            )
            db.add(test_user)
            db.commit()
            db.refresh(test_user)
        test_user_id = test_user.id

    # Admin toggling user status
    res = client.patch(f"/api/users/{test_user_id}/status", json={"is_active": False})
    assert res.status_code == 200
    assert res.json()["is_active"] is False

    res = client.patch(f"/api/users/{test_user_id}/status", json={"is_active": True})
    assert res.status_code == 200
    assert res.json()["is_active"] is True

    # Admin trying to deactivate self -> blocked
    res = client.patch(f"/api/users/{admin_id}/status", json={"is_active": False})
    assert res.status_code == 400

    # 3. Test Manager access control
    with SessionLocal() as db:
        manager_user = db.scalar(select(User).where(User.email == "manager_settings@rportal.com"))
        if not manager_user:
            manager_user = User(
                full_name="Manager Test",
                email="manager_settings@rportal.com",
                password_hash=hash_password("managerpass123"),
                role=Role.MANAGER,
                is_active=True,
                preferences={},
            )
            db.add(manager_user)
            db.commit()
            db.refresh(manager_user)
        else:
            manager_user.preferences = {}
            db.commit()
            db.refresh(manager_user)

    app.dependency_overrides[get_current_user] = lambda: manager_user

    # Manager can GET settings
    res = client.get("/api/settings")
    assert res.status_code == 200

    # Manager can update own profile
    res = client.patch("/api/profile", json={"full_name": "Manager Updated"})
    assert res.status_code == 200

    # Manager CANNOT update another user's status
    res = client.patch(f"/api/users/{test_user_id}/status", json={"is_active": False})
    assert res.status_code == 403

    app.dependency_overrides.clear()


def test_requested_user_logins():
    client = TestClient(app)

    users_to_test = [
        ("sivasubramaniyam@gmail.com", "SS@Rathinam", "ADMIN", "sivasubramaniyam"),
        ("jeyakkanan@gmail.com", "Jk@Rathinam", "MANAGER", "Jeyakkanan"),
        ("swetha@gmail.com", "Swetha@Rathinam", "LEAD", "Swetha"),
    ]

    for email, password, expected_role, expected_name in users_to_test:
        res = client.post("/api/auth/login", json={"email": email, "password": password})
        assert res.status_code == 200, f"Login failed for {email}: {res.status_code} {res.text}"
        data = res.json()
        assert "access_token" in data
        assert data["user"]["role"] == expected_role
        assert data["user"]["full_name"].lower() == expected_name.lower()
        assert data["user"]["is_active"] is True

