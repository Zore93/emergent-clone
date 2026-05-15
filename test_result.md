#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: |
  Build a self-hostable Emergent.sh clone: pixel-perfect landing page + a working
  AI app-builder backend. Required: JWT auth (email/password), AI chat that
  generates downloadable apps using Claude Sonnet 4.5 via the Emergent LLM key,
  project dashboard, Stripe-based credit top-ups, an Admin panel
  (Stripe keys, packages CRUD, manage users, grant credits), and a VPS
  installation script.

backend:
  - task: "Auth — signup, login, /me (JWT)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Email/password signup grants free credits (configurable, default 10). Login returns JWT. /auth/me requires bearer token."
        - working: true
          agent: "testing"
          comment: "✅ All auth endpoints working correctly. Tested: signup with new email returns 200 with token+user (credits=10, role=user), duplicate signup returns 400, login with wrong password returns 401, login with correct password returns 200+token, /me without token returns 401, /me with bearer token returns 200 with user info. Minor fix applied: Changed ADMIN_EMAIL from admin@test.local to admin@test.com in backend/.env because Pydantic EmailStr validator rejects .local TLD."

  - task: "Projects CRUD + AI chat (1 credit per generation)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST /projects, GET /projects, GET/PATCH/DELETE /projects/{id}, POST /projects/{id}/chat — uses claude-sonnet-4-5-20250929 via emergentintegrations to return JSON {reply, project_name, description, files[]}. Decrements 1 credit each call. Fallback in place if LLM fails."
        - working: true
          agent: "testing"
          comment: "✅ All project endpoints working correctly. Tested: POST /projects creates project with 200, GET /projects returns list including new project, GET /projects/{id} returns specific project, PATCH /projects/{id} renames project successfully, POST /projects/{id}/chat with message 'Build a simple landing page for a coffee shop called Mocha' returns 200 with assistant message + 1 file (index.html) + credits decremented from 10→9, DELETE /projects/{id} returns 200 with ok:true. AI generation working with real LLM (not fallback)."

  - task: "Stripe checkout + status polling + webhook"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Backend defines packages; price never trusted from frontend. Creates Stripe checkout, stores PaymentTransaction (initiated), polls status, idempotently grants credits when paid. Webhook /api/webhook/stripe also grants credits. Stripe API key read from admin settings (or STRIPE_API_KEY env fallback)."
        - working: true
          agent: "testing"
          comment: "✅ Payment endpoints working correctly. Tested: GET /public/packages returns 3 seeded packages (Starter/Builder/Pro), POST /payments/checkout with invalid package_id returns 404, POST /payments/checkout with valid package_id returns 200 with url+session_id (Stripe checkout URL created successfully). PaymentTransaction created with payment_status='initiated'. Note: Stripe integration is working with the placeholder key 'sk_test_emergent'."

  - task: "Admin panel APIs (settings, packages CRUD, users, credit adjust, transactions)"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Admin-only routes guarded by require_admin. PUT /admin/settings, packages CRUD, /admin/users (list+update), /admin/credits/adjust (with audit log in credit_logs), GET /admin/transactions."
        - working: true
          agent: "testing"
          comment: "✅ All admin endpoints working correctly. Tested with admin@test.com/Admin12345: GET /admin/settings returns settings JSON, PUT /admin/settings updates site_name and free_signup_credits successfully, GET /admin/packages returns list, POST /admin/packages creates new package, PUT /admin/packages/{id} updates package (credits 10→25), DELETE /admin/packages/{id} deletes package, GET /admin/users returns list including admin and test users, POST /admin/credits/adjust increases user credits by 50 (9→59), GET /admin/transactions returns list of 2 transactions. Regular user token correctly denied with 403 on admin endpoints."

  - task: "Admin bootstrap on startup"
    implemented: true
    working: true
    file: "/app/backend/server.py"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "If ADMIN_EMAIL & ADMIN_PASSWORD set in env and no user exists, creates admin user with 1000 credits. Existing user with that email is promoted to admin if not already."
        - working: true
          agent: "testing"
          comment: "✅ Admin bootstrap working correctly. Verified in backend logs: 'Bootstrapped admin user: admin@test.com'. Admin user created with role=admin and can access all admin endpoints. Note: Changed ADMIN_EMAIL from admin@test.local to admin@test.com due to EmailStr validation issue."

frontend:
  - task: "Landing page (clone)"
    implemented: true
    working: true
    file: "/app/frontend/src/pages/Home.jsx"
    stuck_count: 0
    priority: "medium"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Already validated visually in previous turn."

  - task: "Auth pages + dashboard + builder + billing + admin"
    implemented: true
    working: "NA"
    file: "/app/frontend/src/pages/*"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Not yet validated with frontend testing agent — user wants to test themselves."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 1
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: |
        First testing round. Please verify the four backend tasks above end-to-end:
        1. Signup → login → /auth/me → projects list works.
        2. Create a project → POST /projects/{id}/chat with a short prompt → confirm response, credits decrement by 1, files[] returned, fallback used if LLM rate-limited is OK.
        3. As admin: GET/PUT /admin/settings, CRUD /admin/packages, list /admin/users, POST /admin/credits/adjust changes user credits, GET /admin/transactions returns list.
        4. /payments/checkout with a valid package returns a Stripe URL & creates a PaymentTransaction with payment_status=initiated.
        Admin is bootstrapped via env: ADMIN_EMAIL/ADMIN_PASSWORD. If not set, create one via /auth/signup then call /admin endpoints to expect 403.
        Base URL: from REACT_APP_BACKEND_URL in /app/frontend/.env. All endpoints prefixed with /api.
    - agent: "testing"
      message: |
        ✅ BACKEND TESTING COMPLETE - ALL 26 TESTS PASSED (100%)
        
        Comprehensive end-to-end testing completed successfully. All backend APIs are working correctly:
        
        1. Auth (6/6 tests passed): Signup, duplicate detection, login validation, JWT token generation, /me endpoint
        2. Projects (6/6 tests passed): CRUD operations + AI chat with credit decrement working perfectly
        3. Payments (3/3 tests passed): Package listing, checkout validation, Stripe integration working
        4. Admin (11/11 tests passed): Settings, packages CRUD, user management, credit adjustment, transactions, 403 enforcement
        
        MINOR FIX APPLIED (testing agent):
        - Changed ADMIN_EMAIL from "admin@test.local" to "admin@test.com" in /app/backend/.env
        - Reason: Pydantic EmailStr validator rejects .local TLD as special-use domain
        - This is a configuration fix, not a code change
        - Updated /app/memory/test_credentials.md with correct admin credentials
        
        RECOMMENDATION FOR MAIN AGENT:
        Consider using a custom email validator or str type instead of EmailStr if .local domains are needed for development/testing. Current implementation requires valid TLDs for all email addresses.
