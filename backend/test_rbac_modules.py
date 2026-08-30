#!/usr/bin/env python3
import sys
import time
import subprocess
import requests
from pathlib import Path

# Start uvicorn in background
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8002"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=Path.cwd()
)

time.sleep(3)

try:
    BASE = "http://127.0.0.1:8002"
    
    # Create test users with different roles
    test_users = {
        "admin": {"email": "admin@rportal.com", "password": "admin123", "role": "ADMIN"},
        "manager": {"email": "manager@test.com", "password": "test123456", "role": "MANAGER"},
        "lead": {"email": "lead@test.com", "password": "test123456", "role": "LEAD"},
    }
    
    tokens = {}
    
    # Login all users
    for role, creds in test_users.items():
        # Try login first (if already exists)
        r = requests.post(f"{BASE}/api/auth/login", json={"email": creds["email"], "password": creds["password"]})
        if r.status_code == 200:
            tokens[role] = r.json()["access_token"]
        else:
            # Create new user
            r = requests.post(f"{BASE}/api/auth/register", json={
                "full_name": role.title(),
                "email": creds["email"],
                "password": creds["password"],
                "role": creds["role"]
            })
            if r.status_code == 201:
                tokens[role] = r.json()["access_token"]
                print(f"Created {role} user")
            else:
                print(f"Failed to create {role}: {r.text}")
                continue
    
    print("\n=== RECRUITERS MODULE RBAC ===")
    
    # ADMIN: Create a recruiter
    admin_headers = {"Authorization": f"Bearer {tokens['admin']}"}
    recruiter_data = {
        "name": "Test Company",
        "contact_name": "John Doe",
        "contact_email": "john@test.com",
        "industry": "IT",
        "recruiter_status": "HOT"
    }
    r = requests.post(f"{BASE}/api/recruiters", json=recruiter_data, headers=admin_headers)
    print(f"ADMIN CREATE RECRUITER: {r.status_code} (expect 201)")
    recruiter_id = r.json().get("id") if r.status_code == 201 else None
    
    # MANAGER: Try to create (should fail)
    manager_headers = {"Authorization": f"Bearer {tokens.get('manager')}"}
    r = requests.post(f"{BASE}/api/recruiters", json=recruiter_data, headers=manager_headers)
    print(f"MANAGER CREATE RECRUITER: {r.status_code} (expect 403)")
    
    # LEAD: Try to create (should fail)
    lead_headers = {"Authorization": f"Bearer {tokens.get('lead')}"}
    r = requests.post(f"{BASE}/api/recruiters", json=recruiter_data, headers=lead_headers)
    print(f"LEAD CREATE RECRUITER: {r.status_code} (expect 403)")
    
    # All roles: Read recruiters (should succeed)
    r_admin = requests.get(f"{BASE}/api/recruiters", headers=admin_headers)
    r_mgr = requests.get(f"{BASE}/api/recruiters", headers=manager_headers)
    r_lead = requests.get(f"{BASE}/api/recruiters", headers=lead_headers)
    print(f"ADMIN READ RECRUITERS: {r_admin.status_code} (expect 200)")
    print(f"MANAGER READ RECRUITERS: {r_mgr.status_code} (expect 200)")
    print(f"LEAD READ RECRUITERS: {r_lead.status_code} (expect 200)")
    
    # ADMIN: Update recruiter
    if recruiter_id:
        r = requests.put(f"{BASE}/api/recruiters/{recruiter_id}", 
            json={**recruiter_data, "recruiter_status": "WARM"}, 
            headers=admin_headers)
        print(f"ADMIN UPDATE RECRUITER: {r.status_code} (expect 200)")
        
        # MANAGER: Try to update (should fail)
        r = requests.put(f"{BASE}/api/recruiters/{recruiter_id}", 
            json={**recruiter_data, "recruiter_status": "COLD"}, 
            headers=manager_headers)
        print(f"MANAGER UPDATE RECRUITER: {r.status_code} (expect 403)")
    
    print("\n=== REPORTS MODULE RBAC ===")
    
    # All roles: Read reports (should succeed)
    r_admin = requests.get(f"{BASE}/api/reports", headers=admin_headers)
    r_mgr = requests.get(f"{BASE}/api/reports", headers=manager_headers)
    r_lead = requests.get(f"{BASE}/api/reports", headers=lead_headers)
    print(f"ADMIN READ REPORTS: {r_admin.status_code} (expect 200)")
    print(f"MANAGER READ REPORTS: {r_mgr.status_code} (expect 200)")
    print(f"LEAD READ REPORTS: {r_lead.status_code} (expect 200)")
    
    if r_admin.status_code == 200:
        data = r_admin.json()
        print(f"  Reports has stats: total_students={data.get('total_students')}, " +
              f"hot_recruiters={data.get('hot_recruiters')}, " +
              f"placement_percentage={data.get('placement_percentage')}%")
    
    print("\n=== NOTIFICATIONS MODULE RBAC ===")
    
    # All roles: Read notifications (should succeed)
    r_admin = requests.get(f"{BASE}/api/notifications", headers=admin_headers)
    r_mgr = requests.get(f"{BASE}/api/notifications", headers=manager_headers)
    r_lead = requests.get(f"{BASE}/api/notifications", headers=lead_headers)
    print(f"ADMIN READ NOTIFICATIONS: {r_admin.status_code} (expect 200)")
    print(f"MANAGER READ NOTIFICATIONS: {r_mgr.status_code} (expect 200)")
    print(f"LEAD READ NOTIFICATIONS: {r_lead.status_code} (expect 200)")
    
    # All roles: Read unread count (should succeed)
    r_admin = requests.get(f"{BASE}/api/notifications/unread-count", headers=admin_headers)
    r_mgr = requests.get(f"{BASE}/api/notifications/unread-count", headers=manager_headers)
    r_lead = requests.get(f"{BASE}/api/notifications/unread-count", headers=lead_headers)
    print(f"ADMIN UNREAD COUNT: {r_admin.status_code} (expect 200)")
    print(f"MANAGER UNREAD COUNT: {r_mgr.status_code} (expect 200)")
    print(f"LEAD UNREAD COUNT: {r_lead.status_code} (expect 200)")
    
    print("\n✓ RBAC TESTS COMPLETED")
    
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
