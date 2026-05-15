#!/usr/bin/env python3
"""Check current admin settings"""
import requests
import json

BASE_URL = "https://emergence-build-3.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "Admin12345"

# Login as admin
login_resp = requests.post(f"{BASE_URL}/auth/login", json={
    "email": ADMIN_EMAIL,
    "password": ADMIN_PASSWORD
}, timeout=10)

if login_resp.status_code == 200:
    token = login_resp.json()['access_token']
    
    # Get settings
    settings_resp = requests.get(f"{BASE_URL}/admin/settings", headers={
        "Authorization": f"Bearer {token}"
    }, timeout=10)
    
    if settings_resp.status_code == 200:
        settings = settings_resp.json()
        print("Current Admin Settings:")
        print(json.dumps(settings, indent=2))
    else:
        print(f"Failed to get settings: {settings_resp.status_code}")
else:
    print(f"Failed to login: {login_resp.status_code}")
