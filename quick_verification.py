#!/usr/bin/env python3
"""
Quick verification test for project AI chat flow
Tests the specific flow requested by user
"""
import requests
import json
import random
import string

# Base URL from frontend/.env
BASE_URL = "https://emergence-build-3.preview.emergentagent.com/api"

def random_email():
    """Generate random email for testing"""
    rand = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"test_{rand}@example.com"

def print_step(step_num, description):
    """Print test step"""
    print(f"\n{'='*80}")
    print(f"STEP {step_num}: {description}")
    print('='*80)

def print_result(success, message, response=None):
    """Print result"""
    status = "✅ SUCCESS" if success else "❌ FAILED"
    print(f"\n{status}: {message}")
    if response:
        print(f"Status Code: {response.status_code}")
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)[:1000]}")
        except:
            print(f"Response: {response.text[:500]}")

def main():
    """Run quick verification test"""
    print("\n" + "="*80)
    print("QUICK VERIFICATION - PROJECT AI CHAT FLOW")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    # Step 1: Signup
    print_step(1, "POST /api/auth/signup")
    email = random_email()
    signup_payload = {
        "email": email,
        "password": "Password123",
        "name": "Tester"
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload, timeout=10)
        
        if resp.status_code != 200:
            print_result(False, f"Signup failed with status {resp.status_code}", resp)
            if resp.status_code == 500:
                try:
                    detail = resp.json().get('detail', 'No detail provided')
                    print(f"\n⚠️  ERROR DETAIL: {detail}")
                except:
                    pass
            return False
        
        data = resp.json()
        if 'access_token' not in data:
            print_result(False, "No access_token in signup response", resp)
            return False
        
        token = data['access_token']
        print_result(True, f"Signup successful for {email}", resp)
        
    except Exception as e:
        print_result(False, f"Exception during signup: {e}")
        return False
    
    # Step 2: Create project
    print_step(2, "POST /api/projects")
    headers = {"Authorization": f"Bearer {token}"}
    project_payload = {"name": "New Project"}
    
    try:
        resp = requests.post(f"{BASE_URL}/projects", json=project_payload, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            print_result(False, f"Project creation failed with status {resp.status_code}", resp)
            if resp.status_code == 500:
                try:
                    detail = resp.json().get('detail', 'No detail provided')
                    print(f"\n⚠️  ERROR DETAIL: {detail}")
                except:
                    pass
            return False
        
        data = resp.json()
        if 'id' not in data:
            print_result(False, "No id in project creation response", resp)
            return False
        
        project_id = data['id']
        print_result(True, f"Project created with id: {project_id}", resp)
        
    except Exception as e:
        print_result(False, f"Exception during project creation: {e}")
        return False
    
    # Step 3: Chat with AI
    print_step(3, "POST /api/projects/{id}/chat")
    chat_payload = {"message": "Make a tiny landing page for a bakery called Toasted"}
    
    try:
        resp = requests.post(f"{BASE_URL}/projects/{project_id}/chat", json=chat_payload, headers=headers, timeout=60)
        
        if resp.status_code != 200:
            print_result(False, f"Chat failed with status {resp.status_code}", resp)
            if resp.status_code == 500:
                try:
                    detail = resp.json().get('detail', 'No detail provided')
                    print(f"\n⚠️  ERROR DETAIL: {detail}")
                except:
                    pass
            return False
        
        data = resp.json()
        
        # Check for files
        files = data.get('files', [])
        if not files:
            print_result(False, "No files in chat response", resp)
            return False
        
        # Check for index.html
        has_index_html = any(f.get('path') == 'index.html' for f in files)
        if not has_index_html:
            file_paths = [f.get('path') for f in files]
            print_result(False, f"No index.html found. Files: {file_paths}", resp)
            return False
        
        # Check for assistant message
        messages = data.get('messages', [])
        has_assistant_msg = any(m.get('role') == 'assistant' for m in messages)
        if not has_assistant_msg:
            print_result(False, "No assistant message in response", resp)
            return False
        
        print_result(True, f"Chat successful: {len(files)} file(s) generated, including index.html", resp)
        
        # Step 4: Verify credits
        print_step(4, "Verify credits decremented to 9")
        
        me_resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        if me_resp.status_code != 200:
            print_result(False, f"Failed to get user info: {me_resp.status_code}", me_resp)
            return False
        
        user_data = me_resp.json()
        credits = user_data.get('credits')
        
        if credits == 9:
            print_result(True, f"Credits correctly decremented: 10 → 9", me_resp)
        else:
            print_result(False, f"Credits incorrect: expected 9, got {credits}", me_resp)
            return False
        
        # All steps passed
        print("\n" + "="*80)
        print("✅ ALL VERIFICATION STEPS PASSED")
        print("="*80)
        print(f"✓ Signup successful")
        print(f"✓ Project created")
        print(f"✓ AI chat generated files (including index.html)")
        print(f"✓ Credits decremented correctly (10 → 9)")
        print("="*80)
        return True
        
    except Exception as e:
        print_result(False, f"Exception during chat: {e}")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
