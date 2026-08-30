import io
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.models import Role, User, RecruiterStatus, Company, RecruiterContact
from app.dependencies import get_current_user
from app.database import SessionLocal

client = TestClient(app)

def test_recruiters_overview_and_contacts_crud():
    admin_user = User(id=1, full_name="Admin User", email="admin@rportal.com", role=Role.ADMIN, is_active=True)
    manager_user = User(id=2, full_name="Manager User", email="manager@test.com", role=Role.MANAGER, is_active=True)
    lead_user = User(id=3, full_name="Lead User", email="lead@test.com", role=Role.LEAD, is_active=True)

    # 1. Lead can view overview
    app.dependency_overrides[get_current_user] = lambda: lead_user
    res = client.get("/api/recruiters/overview")
    assert res.status_code == 200
    data = res.json()
    assert "summary" in data
    assert "engagement_distribution" in data
    assert "companies" in data
    assert "recruiters" in data
    assert data["summary"]["total_recruiters"] >= 0
    assert data["summary"]["connected_companies"] >= 0

    # 2. Get contacts list
    res_contacts = client.get("/api/recruiters/contacts")
    assert res_contacts.status_code == 200
    assert isinstance(res_contacts.json(), list)

    # 3. Manager can update company status
    app.dependency_overrides[get_current_user] = lambda: manager_user
    if data["companies"]:
        target_company = data["companies"][0]
        company_id = target_company["id"]
        res_status = client.patch(f"/api/companies/{company_id}/status", json={"status": "HOT"})
        assert res_status.status_code == 200
        assert res_status.json()["recruiter_status"] == "HOT"

    # 4. Manager can create recruiter contact
    if data["companies"]:
        company_id = data["companies"][0]["id"]
        import uuid
        uid = uuid.uuid4().hex[:6]
        recruiter_payload = {
            "company_id": company_id,
            "name": f"Test Contact {uid}",
            "designation": "Technical Talent Lead",
            "email": f"test_recruiter_{uid}@company.com",
            "phone": "+91 9988776655",
            "department": "Engineering Hiring",
            "status": "ACTIVE",
            "notes": "Testing pipeline integration"
        }
        res_add = client.post("/api/recruiters/contacts", json=recruiter_payload)
        assert res_add.status_code == 201
        contact_id = res_add.json()["id"]

        # 5. Manager can update recruiter contact
        res_upd = client.patch(f"/api/recruiters/contacts/{contact_id}", json={
            "designation": "Senior Director of Campus Hiring",
            "status": "ACTIVE"
        })
        assert res_upd.status_code == 200

        # 6. Lead cannot delete recruiter contact
        app.dependency_overrides[get_current_user] = lambda: lead_user
        res_del_lead = client.delete(f"/api/recruiters/contacts/{contact_id}")
        assert res_del_lead.status_code == 403

        # 7. Manager can delete recruiter contact
        app.dependency_overrides[get_current_user] = lambda: manager_user
        res_del = client.delete(f"/api/recruiters/contacts/{contact_id}")
        assert res_del.status_code == 204

    # 8. Test sample template download
    res_csv_template = client.get("/api/recruiters/sample-template?format=csv")
    assert res_csv_template.status_code == 200
    assert "attachment; filename=\"recruiters_sample_template.csv\"" in res_csv_template.headers["content-disposition"]

    app.dependency_overrides.clear()
