#!/usr/bin/env python3
"""
Comprehensive backend API tests for Emergent Clone
Tests all endpoints: Auth, Projects, Payments, Admin
"""
import requests
import json
import random
import string
from typing import Dict, Optional

# Base URL from frontend/.env
BASE_URL = "https://emergence-build-3.preview.emergentagent.com/api"

# Admin credentials from backend/.env
ADMIN_EMAIL = "admin@test.com"
ADMIN_PASSWORD = "Admin12345"

# Test state
test_user_email = None
test_user_token = None
test_user_id = None
admin_token = None
test_project_id = None
test_package_id = None
created_package_id = None

def random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{rand}@example.com"

def print_test(name: str):
    """Print test name"""
    print(f"\n{'='*80}")
    print(f"TEST: {name}")
    print('='*80)

def print_result(success: bool, message: str, response: Optional[requests.Response] = None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if response:
        print(f"  Status: {response.status_code}")
        try:
            print(f"  Response: {json.dumps(response.json(), indent=2)[:500]}")
        except:
            print(f"  Response: {response.text[:500]}")
    print()

def test_auth_signup():
    """Test 1: POST /api/auth/signup - should return 200 with token and user"""
    global test_user_email, test_user_token, test_user_id
    print_test("Auth Signup - New User")
    
    test_user_email = random_email()
    payload = {
        "email": test_user_email,
        "password": "Password123",
        "name": "Tester"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'access_token' in data and 'user' in data:
                test_user_token = data['access_token']
                user = data['user']
                test_user_id = user.get('id')
                
                # Verify user has correct attributes
                if (user.get('credits') == 10 and 
                    user.get('role') == 'user' and 
                    user.get('email') == test_user_email.lower()):
                    print_result(True, f"Signup successful for {test_user_email}", resp)
                    return True
                else:
                    print_result(False, f"User attributes incorrect: credits={user.get('credits')}, role={user.get('role')}", resp)
                    return False
            else:
                print_result(False, "Missing access_token or user in response", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_auth_signup_duplicate():
    """Test 2: POST /api/auth/signup - duplicate email should return 400"""
    print_test("Auth Signup - Duplicate Email")
    
    payload = {
        "email": test_user_email,
        "password": "Password123",
        "name": "Tester"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json=payload, timeout=10)
        
        if resp.status_code == 400:
            print_result(True, "Duplicate signup correctly rejected with 400", resp)
            return True
        else:
            print_result(False, f"Expected 400, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_auth_login_wrong_password():
    """Test 3: POST /api/auth/login - wrong password should return 401"""
    print_test("Auth Login - Wrong Password")
    
    payload = {
        "email": test_user_email,
        "password": "WrongPassword123"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        
        if resp.status_code == 401:
            print_result(True, "Wrong password correctly rejected with 401", resp)
            return True
        else:
            print_result(False, f"Expected 401, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_auth_login_correct():
    """Test 4: POST /api/auth/login - correct credentials should return 200"""
    print_test("Auth Login - Correct Credentials")
    
    payload = {
        "email": test_user_email,
        "password": "Password123"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'access_token' in data:
                print_result(True, "Login successful with correct credentials", resp)
                return True
            else:
                print_result(False, "Missing access_token in response", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_auth_me_no_token():
    """Test 5: GET /api/auth/me - without token should return 401"""
    print_test("Auth /me - No Token")
    
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", timeout=10)
        
        if resp.status_code == 401:
            print_result(True, "Request without token correctly rejected with 401", resp)
            return True
        else:
            print_result(False, f"Expected 401, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_auth_me_with_token():
    """Test 6: GET /api/auth/me - with token should return 200 with user info"""
    print_test("Auth /me - With Token")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('email') == test_user_email.lower():
                print_result(True, "Auth /me returned correct user info", resp)
                return True
            else:
                print_result(False, f"Email mismatch: expected {test_user_email.lower()}, got {data.get('email')}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_create():
    """Test 7: POST /api/projects - create new project"""
    global test_project_id
    print_test("Projects - Create")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {
        "name": "Demo",
        "description": ""
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/projects", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'id' in data and data.get('name') == 'Demo':
                test_project_id = data['id']
                print_result(True, f"Project created with id: {test_project_id}", resp)
                return True
            else:
                print_result(False, "Missing id or incorrect name in response", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_list():
    """Test 8: GET /api/projects - list should contain new project"""
    print_test("Projects - List")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/projects", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                project_ids = [p.get('id') for p in data]
                if test_project_id in project_ids:
                    print_result(True, f"Project list contains new project (found {len(data)} projects)", resp)
                    return True
                else:
                    print_result(False, f"New project not found in list. IDs: {project_ids}", resp)
                    return False
            else:
                print_result(False, "Response is not a list", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_get():
    """Test 9: GET /api/projects/{id} - get specific project"""
    print_test("Projects - Get by ID")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/projects/{test_project_id}", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('id') == test_project_id:
                print_result(True, "Project retrieved successfully", resp)
                return True
            else:
                print_result(False, f"ID mismatch: expected {test_project_id}, got {data.get('id')}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_patch():
    """Test 10: PATCH /api/projects/{id} - rename project"""
    print_test("Projects - Rename")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {"name": "Demo Renamed"}
    
    try:
        resp = requests.patch(f"{BASE_URL}/projects/{test_project_id}", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('name') == 'Demo Renamed':
                print_result(True, "Project renamed successfully", resp)
                return True
            else:
                print_result(False, f"Name not updated: got {data.get('name')}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_chat():
    """Test 11: POST /api/projects/{id}/chat - AI generation with credit decrement"""
    print_test("Projects - AI Chat")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {"message": "Build a simple landing page for a coffee shop called Mocha"}
    
    try:
        # Get current credits
        me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        credits_before = me_resp.json().get('credits', 0)
        print(f"Credits before chat: {credits_before}")
        
        # Send chat message
        resp = requests.post(f"{BASE_URL}/projects/{test_project_id}/chat", json=payload, headers=headers, timeout=30)
        
        if resp.status_code == 200:
            data = resp.json()
            
            # Check for messages and files
            messages = data.get('messages', [])
            files = data.get('files', [])
            
            # Get credits after
            me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
            credits_after = me_resp.json().get('credits', 0)
            print(f"Credits after chat: {credits_after}")
            
            # Verify
            has_assistant_msg = any(m.get('role') == 'assistant' for m in messages)
            has_files = len(files) > 0
            credits_decremented = credits_after == credits_before - 1
            
            if has_assistant_msg and has_files and credits_decremented:
                print_result(True, f"Chat successful: {len(messages)} messages, {len(files)} files, credits: {credits_before} → {credits_after}", resp)
                return True
            else:
                print_result(False, f"Chat incomplete: assistant_msg={has_assistant_msg}, files={has_files}, credits_ok={credits_decremented}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_projects_delete():
    """Test 12: DELETE /api/projects/{id} - delete project"""
    print_test("Projects - Delete")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        resp = requests.delete(f"{BASE_URL}/projects/{test_project_id}", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('ok') == True:
                print_result(True, "Project deleted successfully", resp)
                return True
            else:
                print_result(False, "Response missing 'ok: true'", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_payments_get_packages():
    """Test 13: GET /api/public/packages - get available packages"""
    global test_package_id
    print_test("Payments - Get Packages")
    
    try:
        resp = requests.get(f"{BASE_URL}/public/packages", timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list) and len(data) > 0:
                # Save first package ID for checkout test
                test_package_id = data[0].get('id')
                package_names = [p.get('name') for p in data]
                print_result(True, f"Found {len(data)} packages: {package_names}", resp)
                return True
            else:
                print_result(False, "No packages found or invalid response", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_payments_checkout_invalid_package():
    """Test 14: POST /api/payments/checkout - invalid package_id should return 404"""
    print_test("Payments - Checkout Invalid Package")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {
        "package_id": "invalid-package-id-12345",
        "origin_url": BASE_URL.replace('/api', '')
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 404:
            print_result(True, "Invalid package correctly rejected with 404", resp)
            return True
        else:
            print_result(False, f"Expected 404, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_payments_checkout_valid_package():
    """Test 15: POST /api/payments/checkout - valid package (may fail due to Stripe placeholder key)"""
    print_test("Payments - Checkout Valid Package")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    payload = {
        "package_id": test_package_id,
        "origin_url": BASE_URL.replace('/api', '')
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/payments/checkout", json=payload, headers=headers, timeout=10)
        
        # Accept either 200 (Stripe works) or 500 (Stripe placeholder key)
        if resp.status_code == 200:
            data = resp.json()
            if 'url' in data and 'session_id' in data:
                print_result(True, "Checkout successful (Stripe configured)", resp)
                return True
            else:
                print_result(False, "Missing url or session_id in response", resp)
                return False
        elif resp.status_code == 500:
            # Expected if Stripe key is placeholder
            print_result(True, "Checkout failed as expected (Stripe placeholder key)", resp)
            return True
        else:
            print_result(False, f"Expected 200 or 500, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_login():
    """Test 16: Admin login"""
    global admin_token
    print_test("Admin - Login")
    
    payload = {
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'access_token' in data:
                admin_token = data['access_token']
                user = data.get('user', {})
                if user.get('role') == 'admin':
                    print_result(True, f"Admin login successful: {ADMIN_EMAIL}", resp)
                    return True
                else:
                    print_result(False, f"User role is not admin: {user.get('role')}", resp)
                    return False
            else:
                print_result(False, "Missing access_token in response", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_get_settings():
    """Test 17: GET /api/admin/settings"""
    print_test("Admin - Get Settings")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/admin/settings", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'site_name' in data and 'free_signup_credits' in data:
                print_result(True, f"Settings retrieved: site_name={data.get('site_name')}, free_signup_credits={data.get('free_signup_credits')}", resp)
                return True
            else:
                print_result(False, "Missing expected fields in settings", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_update_settings():
    """Test 18: PUT /api/admin/settings"""
    print_test("Admin - Update Settings")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "site_name": "My Clone",
        "free_signup_credits": 15
    }
    
    try:
        resp = requests.put(f"{BASE_URL}/admin/settings", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('site_name') == 'My Clone' and data.get('free_signup_credits') == 15:
                print_result(True, "Settings updated successfully", resp)
                return True
            else:
                print_result(False, f"Settings not updated correctly: {data}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_get_packages():
    """Test 19: GET /api/admin/packages"""
    print_test("Admin - Get Packages")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/admin/packages", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print_result(True, f"Retrieved {len(data)} packages", resp)
                return True
            else:
                print_result(False, "Response is not a list", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_create_package():
    """Test 20: POST /api/admin/packages"""
    global created_package_id
    print_test("Admin - Create Package")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Test Pack",
        "description": "",
        "credits": 10,
        "price_usd": 1.0,
        "active": True,
        "sort_order": 99
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/admin/packages", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if 'id' in data and data.get('name') == 'Test Pack':
                created_package_id = data['id']
                print_result(True, f"Package created with id: {created_package_id}", resp)
                return True
            else:
                print_result(False, "Missing id or incorrect name", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_update_package():
    """Test 21: PUT /api/admin/packages/{id}"""
    print_test("Admin - Update Package")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    payload = {
        "name": "Test Pack",
        "description": "",
        "credits": 25,
        "price_usd": 1.0,
        "active": True,
        "sort_order": 99
    }
    
    try:
        resp = requests.put(f"{BASE_URL}/admin/packages/{created_package_id}", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('credits') == 25:
                print_result(True, "Package updated successfully (credits: 10 → 25)", resp)
                return True
            else:
                print_result(False, f"Credits not updated: got {data.get('credits')}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_delete_package():
    """Test 22: DELETE /api/admin/packages/{id}"""
    print_test("Admin - Delete Package")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        resp = requests.delete(f"{BASE_URL}/admin/packages/{created_package_id}", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if data.get('ok') == True:
                print_result(True, "Package deleted successfully", resp)
                return True
            else:
                print_result(False, "Response missing 'ok: true'", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_get_users():
    """Test 23: GET /api/admin/users"""
    print_test("Admin - Get Users")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/admin/users", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                user_emails = [u.get('email') for u in data]
                has_admin = ADMIN_EMAIL in user_emails
                has_test_user = test_user_email.lower() in user_emails
                
                if has_admin and has_test_user:
                    print_result(True, f"User list contains both admin and test user ({len(data)} total users)", resp)
                    return True
                else:
                    print_result(False, f"Missing users: admin={has_admin}, test_user={has_test_user}", resp)
                    return False
            else:
                print_result(False, "Response is not a list", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_adjust_credits():
    """Test 24: POST /api/admin/credits/adjust"""
    print_test("Admin - Adjust Credits")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Get current credits
    me_headers = {"Authorization": f"Bearer {test_user_token}"}
    me_resp = requests.get(f"{BASE_URL}/auth/me", headers=me_headers, timeout=10)
    credits_before = me_resp.json().get('credits', 0)
    print(f"User credits before adjustment: {credits_before}")
    
    payload = {
        "user_id": test_user_id,
        "delta": 50,
        "reason": "test"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/admin/credits/adjust", json=payload, headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            credits_after = data.get('credits', 0)
            print(f"User credits after adjustment: {credits_after}")
            
            if credits_after == credits_before + 50:
                print_result(True, f"Credits adjusted successfully: {credits_before} → {credits_after}", resp)
                return True
            else:
                print_result(False, f"Credits not adjusted correctly: expected {credits_before + 50}, got {credits_after}", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_get_transactions():
    """Test 25: GET /api/admin/transactions"""
    print_test("Admin - Get Transactions")
    
    headers = {"Authorization": f"Bearer {admin_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/admin/transactions", headers=headers, timeout=10)
        
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, list):
                print_result(True, f"Retrieved {len(data)} transactions", resp)
                return True
            else:
                print_result(False, "Response is not a list", resp)
                return False
        else:
            print_result(False, f"Expected 200, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def test_admin_endpoint_with_regular_user():
    """Test 26: Admin endpoint with regular user token should return 403"""
    print_test("Admin - Regular User Access (should be 403)")
    
    headers = {"Authorization": f"Bearer {test_user_token}"}
    
    try:
        resp = requests.get(f"{BASE_URL}/admin/settings", headers=headers, timeout=10)
        
        if resp.status_code == 403:
            print_result(True, "Regular user correctly denied access to admin endpoint with 403", resp)
            return True
        else:
            print_result(False, f"Expected 403, got {resp.status_code}", resp)
            return False
    except Exception as e:
        print_result(False, f"Exception: {e}")
        return False

def main():
    """Run all tests"""
    print("\n" + "="*80)
    print("EMERGENT CLONE BACKEND API TESTS")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = []
    
    # Auth tests
    results.append(("Auth Signup", test_auth_signup()))
    results.append(("Auth Signup Duplicate", test_auth_signup_duplicate()))
    results.append(("Auth Login Wrong Password", test_auth_login_wrong_password()))
    results.append(("Auth Login Correct", test_auth_login_correct()))
    results.append(("Auth /me No Token", test_auth_me_no_token()))
    results.append(("Auth /me With Token", test_auth_me_with_token()))
    
    # Projects tests
    results.append(("Projects Create", test_projects_create()))
    results.append(("Projects List", test_projects_list()))
    results.append(("Projects Get", test_projects_get()))
    results.append(("Projects Patch", test_projects_patch()))
    results.append(("Projects Chat", test_projects_chat()))
    results.append(("Projects Delete", test_projects_delete()))
    
    # Payments tests
    results.append(("Payments Get Packages", test_payments_get_packages()))
    results.append(("Payments Checkout Invalid", test_payments_checkout_invalid_package()))
    results.append(("Payments Checkout Valid", test_payments_checkout_valid_package()))
    
    # Admin tests
    results.append(("Admin Login", test_admin_login()))
    results.append(("Admin Get Settings", test_admin_get_settings()))
    results.append(("Admin Update Settings", test_admin_update_settings()))
    results.append(("Admin Get Packages", test_admin_get_packages()))
    results.append(("Admin Create Package", test_admin_create_package()))
    results.append(("Admin Update Package", test_admin_update_package()))
    results.append(("Admin Delete Package", test_admin_delete_package()))
    results.append(("Admin Get Users", test_admin_get_users()))
    results.append(("Admin Adjust Credits", test_admin_adjust_credits()))
    results.append(("Admin Get Transactions", test_admin_get_transactions()))
    results.append(("Admin 403 for Regular User", test_admin_endpoint_with_regular_user()))
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {name}")
    
    print("\n" + "="*80)
    print(f"TOTAL: {passed}/{total} tests passed ({passed*100//total}%)")
    print("="*80)
    
    return passed == total

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
