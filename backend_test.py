#!/usr/bin/env python3
"""
Backend API test for AI chat verification
Tests the complete flow: signup → create project → AI chat
"""
import requests
import json
import random
import string
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://emergence-build-3.preview.emergentagent.com/api"

def generate_random_email():
    """Generate a random email for testing"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
    return f"test_{random_str}@example.com"

def test_ai_chat_flow():
    """
    Test the complete AI chat flow:
    1. Signup with random email + password "Password123"
    2. Create a project
    3. POST /api/projects/{id}/chat with message about ice cream shop
    4. Verify response: 200, files[] with index.html, assistant message
    5. CRITICAL: Verify assistant reply does NOT contain "EMERGENT_LLM_KEY missing"
    """
    print("=" * 80)
    print("AI CHAT FLOW VERIFICATION TEST")
    print("=" * 80)
    
    # Step 1: Signup
    print("\n[1/3] Testing signup...")
    email = generate_random_email()
    password = "Password123"
    signup_data = {
        "email": email,
        "password": password,
        "name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
    print(f"  Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"  ❌ FAIL: Expected 200, got {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    signup_result = response.json()
    token = signup_result.get("access_token")
    
    if not token:
        print(f"  ❌ FAIL: No access_token in response")
        print(f"  Response: {json.dumps(signup_result, indent=2)}")
        return False
    
    print(f"  ✅ PASS: Signup successful")
    print(f"  Email: {email}")
    print(f"  Token: {token[:20]}...")
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Step 2: Create project
    print("\n[2/3] Creating project...")
    project_data = {"name": "Ice Cream Shop Project"}
    
    response = requests.post(f"{BASE_URL}/projects", json=project_data, headers=headers)
    print(f"  Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"  ❌ FAIL: Expected 200, got {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    project = response.json()
    project_id = project.get("id")
    
    if not project_id:
        print(f"  ❌ FAIL: No project id in response")
        print(f"  Response: {json.dumps(project, indent=2)}")
        return False
    
    print(f"  ✅ PASS: Project created")
    print(f"  Project ID: {project_id}")
    print(f"  Project Name: {project.get('name')}")
    
    # Step 3: AI Chat - Generate app
    print("\n[3/3] Testing AI chat (generating app)...")
    chat_data = {
        "message": "Make a simple landing page for an ice cream shop called Frosty"
    }
    
    response = requests.post(
        f"{BASE_URL}/projects/{project_id}/chat",
        json=chat_data,
        headers=headers
    )
    print(f"  Status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"  ❌ FAIL: Expected 200, got {response.status_code}")
        print(f"  Response: {response.text}")
        return False
    
    result = response.json()
    
    # Verify response structure
    print("\n  Verifying response structure...")
    
    # Check files array
    files = result.get("files", [])
    if not files:
        print(f"  ❌ FAIL: files[] is empty")
        print(f"  Response: {json.dumps(result, indent=2)[:500]}")
        return False
    
    print(f"  ✅ Files count: {len(files)}")
    
    # Check for index.html
    has_index_html = any(f.get("path") == "index.html" for f in files)
    if not has_index_html:
        print(f"  ❌ FAIL: No index.html in files[]")
        print(f"  Files: {[f.get('path') for f in files]}")
        return False
    
    print(f"  ✅ index.html found in files[]")
    
    # Check messages
    messages = result.get("messages", [])
    if not messages:
        print(f"  ❌ FAIL: No messages in response")
        return False
    
    # Find assistant message
    assistant_messages = [m for m in messages if m.get("role") == "assistant"]
    if not assistant_messages:
        print(f"  ❌ FAIL: No assistant message found")
        print(f"  Messages: {json.dumps(messages, indent=2)[:500]}")
        return False
    
    print(f"  ✅ Assistant message found")
    
    # Get the latest assistant message
    latest_assistant = assistant_messages[-1]
    assistant_reply = latest_assistant.get("content", "")
    
    print(f"\n  Assistant reply (first 200 chars):")
    print(f"  {'-' * 76}")
    print(f"  {assistant_reply[:200]}")
    print(f"  {'-' * 76}")
    
    # CRITICAL CHECK: Verify reply does NOT contain "EMERGENT_LLM_KEY missing"
    print("\n  CRITICAL CHECK: Verifying LLM key is NOT missing...")
    if "EMERGENT_LLM_KEY missing" in assistant_reply:
        print(f"  ❌ FAIL: Assistant reply contains 'EMERGENT_LLM_KEY missing'")
        print(f"  This means the LLM is still using fallback mode!")
        print(f"  Full reply: {assistant_reply}")
        return False
    
    print(f"  ✅ PASS: LLM key is properly loaded (no fallback message)")
    
    # Additional checks
    print("\n  Additional verification...")
    print(f"  - Project name: {result.get('name')}")
    print(f"  - Description: {result.get('description', 'N/A')[:100]}")
    print(f"  - Files: {[f.get('path') for f in files]}")
    print(f"  - Message count: {len(messages)}")
    
    # Check credits
    user_credits = result.get("user_credits")
    if user_credits is not None:
        print(f"  - User credits after chat: {user_credits}")
    
    print("\n" + "=" * 80)
    print("✅ ALL TESTS PASSED")
    print("=" * 80)
    print("\nSUMMARY:")
    print(f"  ✅ Signup successful with email: {email}")
    print(f"  ✅ Project created with ID: {project_id}")
    print(f"  ✅ AI chat returned 200 response")
    print(f"  ✅ files[] contains {len(files)} file(s) including index.html")
    print(f"  ✅ Assistant message present")
    print(f"  ✅ LLM key properly loaded (NOT using fallback)")
    print(f"\n  Assistant reply preview: {assistant_reply[:200]}")
    
    return True

if __name__ == "__main__":
    try:
        success = test_ai_chat_flow()
        exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ TEST FAILED WITH EXCEPTION: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
