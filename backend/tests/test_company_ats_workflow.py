import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_token(email="sivasubramaniyam@gmail.com", password="SS@Rathinam"):
    res = client.post("/api/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["access_token"]


def test_company_and_ats_workflow():
    token = get_auth_token()
    headers = {"Authorization": f"Bearer {token}"}

    import uuid
    random_suffix = uuid.uuid4().hex[:6]
    company_name = f"Acme Tech Innovations {random_suffix}"

    # 1. Create a Company
    comp_payload = {
        "name": company_name,
        "industry": "Artificial Intelligence & Cloud",
        "location": "Bengaluru, Karnataka",
        "address": "Tech Park Block B, Electronic City",
        "description": "Leading provider of autonomous enterprise cloud services.",
        "website": "https://acmetech.io",
        "contact_name": "Deepak Verma",
        "contact_email": "deepak.verma@acmetech.io",
        "contact_phone": "+91 9988776655",
        "contact_designation": "Director of University Talent",
        "recruiter_status": "HOT",
    }
    create_res = client.post("/api/companies", json=comp_payload, headers=headers)
    assert create_res.status_code == 201, f"Company creation failed: {create_res.text}"
    company_id = create_res.json()["id"]

    # 2. Verify Company Details 8 Sections
    details_res = client.get(f"/api/companies/{company_id}/details", headers=headers)
    assert details_res.status_code == 200, f"Details failed: {details_res.text}"
    details = details_res.json()
    assert details["name"] == company_name
    assert "recruiters" in details
    assert "drives" in details
    assert "job_descriptions" in details
    assert "eligible_students" in details
    assert "applications" in details
    assert "placed_students" in details
    assert "activity_history" in details

    # 3. Create a Placement Drive with rich JD
    drive_payload = {
        "company_id": company_id,
        "title": "Cloud Software Engineer 2026",
        "job_role": "Backend Cloud Engineer",
        "location": "Bengaluru / Hybrid",
        "package_lpa": "12.5 LPA",
        "eligibility": "B.E / B.Tech CSE, IT, ECE with CGPA >= 7.0",
        "min_cgpa": "7.0",
        "max_backlogs": 0,
        "required_skills": "Python, FastAPI, Docker, SQL, Git",
        "preferred_skills": "AWS, Kubernetes, Redis",
        "departments": "CSE, IT, ECE",
        "status": "OPEN",
        "work_mode": "Hybrid",
    }
    drive_res = client.post("/api/drives", json=drive_payload, headers=headers)
    assert drive_res.status_code == 201, f"Drive creation failed: {drive_res.text}"
    drive_id = drive_res.json()["id"]

    # 4. Upload JD Document (test text extraction & parsing)
    jd_content = b"""
    Job Title: Cloud Software Engineer
    Company: Acme Tech Innovations
    Required Skills: Python, FastAPI, Docker, SQL, PostgreSQL, Git, Linux
    Preferred Skills: AWS, Kubernetes
    Minimum CGPA: 7.5 CGPA cut-off
    Eligible Departments: CSE, IT, AIDS
    Salary: 14.0 LPA CTC
    Experience: Fresher (2026 Batch)
    """
    files = {"file": ("job_description.txt", jd_content, "text/plain")}
    jd_upload_res = client.post(f"/api/drives/{drive_id}/jd-upload", files=files, headers=headers)
    assert jd_upload_res.status_code == 200, f"JD Upload failed: {jd_upload_res.text}"
    parsed_data = jd_upload_res.json()
    assert "parsed_requirements" in parsed_data
    assert "Python" in parsed_data["parsed_requirements"]["required_skills"]

    # 5. Run ATS Matching
    ats_res = client.get(f"/api/drives/{drive_id}/ats-match", headers=headers)
    assert ats_res.status_code == 200, f"ATS Match failed: {ats_res.text}"
    ats_data = ats_res.json()
    assert ats_data["drive_id"] == drive_id
    assert "matches" in ats_data
    assert len(ats_data["matches"]) > 0

    first_match = ats_data["matches"][0]
    assert "ats_score" in first_match
    assert "is_eligible" in first_match
    assert "skills_match_pct" in first_match
    assert "reasons" in first_match

    # 6. Bulk Shortlist Top Candidate
    if first_match["student_id"]:
        shortlist_res = client.post(
            f"/api/drives/{drive_id}/ats-shortlist",
            json={"student_ids": [first_match["student_id"]]},
            headers=headers
        )
        assert shortlist_res.status_code == 200, f"Shortlist failed: {shortlist_res.text}"
        assert shortlist_res.json()["shortlisted_count"] == 1
