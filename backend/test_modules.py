#!/usr/bin/env python3
import sys
import time
import subprocess
import requests
from pathlib import Path

# Start uvicorn in background
proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8001"],
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    cwd=Path.cwd()
)

time.sleep(3)

try:
    # Test health
    r = requests.get("http://127.0.0.1:8001/api/health", timeout=5)
    print(f"HEALTH={r.status_code}")
    
    # Login
    login = requests.post("http://127.0.0.1:8001/api/auth/login", 
        json={"email": "admin@rportal.com", "password": "admin123"})
    print(f"LOGIN={login.status_code}")
    
    if login.status_code == 200:
        token = login.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test recruiters endpoint
        recruiters = requests.get("http://127.0.0.1:8001/api/recruiters", headers=headers)
        print(f"RECRUITERS={recruiters.status_code} data={len(recruiters.json())}")
        
        # Test reports endpoint  
        reports = requests.get("http://127.0.0.1:8001/api/reports", headers=headers)
        print(f"REPORTS={reports.status_code}")
        if reports.status_code == 200:
            data = reports.json()
            print(f"  - Total Students: {data.get('total_students')}")
            print(f"  - Placed: {data.get('placed_students')}")
            print(f"  - Hot Recruiters: {data.get('hot_recruiters')}")
        
        # Test notifications endpoint
        notifs = requests.get("http://127.0.0.1:8001/api/notifications", headers=headers)
        print(f"NOTIFICATIONS={notifs.status_code} count={len(notifs.json())}")
        
        # Test notifications unread count
        unread = requests.get("http://127.0.0.1:8001/api/notifications/unread-count", headers=headers)
        print(f"UNREAD_COUNT={unread.status_code} unread={unread.json()}")
        
        print("\n✓ ALL ENDPOINTS WORKING")
    else:
        print(f"Login failed: {login.text}")
finally:
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()
