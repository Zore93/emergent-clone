from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from fastapi.security import HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from typing import List, Optional

from models import (
    SignupRequest, LoginRequest, TokenResponse, UserPublic,
    ProjectCreateRequest, ProjectRenameRequest, ChatRequest, Project, ChatMessage,
    Package, PackageUpsert, CheckoutRequest, PaymentTransaction,
    Settings, SettingsUpdate, AdminCreditAdjust, AdminUserUpdate,
    now_utc, gen_id,
)
from auth_utils import (
    hash_password, verify_password, create_access_token, decode_token,
    bearer_scheme, user_record_to_public,
)
from llm_service import generate_app

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title='Emergent Clone API')
api = APIRouter(prefix='/api')

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger('api')

# ---------- Auth dependencies ----------
async def get_current_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    if not creds:
        raise HTTPException(status_code=401, detail='Not authenticated')
    user_id = decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    u = await db.users.find_one({'id': user_id})
    if not u:
        raise HTTPException(status_code=401, detail='User not found')
    return u

async def require_admin(user=Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail='Admin only')
    return user

# ---------- Helpers ----------
async def get_settings_dict() -> dict:
    s = await db.settings.find_one({'_key': 'app'})
    if not s:
        s = {'_key': 'app', **Settings().model_dump()}
        await db.settings.insert_one(s)
    s.pop('_id', None)
    return s

async def get_signup_credits() -> int:
    s = await get_settings_dict()
    return int(s.get('free_signup_credits', 10))

# ---------- Public ----------
@api.get('/')
async def root():
    return {'message': 'Emergent Clone API', 'status': 'ok'}

@api.get('/public/settings')
async def public_settings():
    s = await get_settings_dict()
    return {
        'site_name': s.get('site_name', 'Emergent Clone'),
        'stripe_publishable_key': s.get('stripe_publishable_key', ''),
        'free_signup_credits': s.get('free_signup_credits', 10),
    }

@api.get('/public/packages', response_model=List[Package])
async def public_packages():
    cur = db.packages.find({'active': True}).sort('sort_order', 1)
    out = []
    async for p in cur:
        p.pop('_id', None)
        out.append(Package(**p))
    return out

# ---------- Auth ----------
@api.post('/auth/signup', response_model=TokenResponse)
async def signup(req: SignupRequest):
    existing = await db.users.find_one({'email': req.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail='Email already registered')
    credits = await get_signup_credits()
    user = {
        'id': gen_id(),
        'email': req.email.lower(),
        'name': req.name,
        'password_hash': hash_password(req.password),
        'role': 'user',
        'credits': credits,
        'created_at': now_utc(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user['id'])
    return TokenResponse(access_token=token, user=user_record_to_public(user))

@api.post('/auth/login', response_model=TokenResponse)
async def login(req: LoginRequest):
    u = await db.users.find_one({'email': req.email.lower()})
    if not u or not verify_password(req.password, u.get('password_hash', '')):
        raise HTTPException(status_code=401, detail='Invalid email or password')
    token = create_access_token(u['id'])
    return TokenResponse(access_token=token, user=user_record_to_public(u))

@api.get('/auth/me', response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return user_record_to_public(user)

# ---------- Projects ----------
@api.get('/projects', response_model=List[Project])
async def list_projects(user=Depends(get_current_user)):
    cur = db.projects.find({'user_id': user['id']}).sort('updated_at', -1)
    out = []
    async for p in cur:
        p.pop('_id', None)
        out.append(Project(**p))
    return out

@api.post('/projects', response_model=Project)
async def create_project(req: ProjectCreateRequest, user=Depends(get_current_user)):
    p = Project(user_id=user['id'], name=req.name, description=req.description)
    await db.projects.insert_one(p.model_dump())
    return p

@api.get('/projects/{pid}', response_model=Project)
async def get_project(pid: str, user=Depends(get_current_user)):
    p = await db.projects.find_one({'id': pid, 'user_id': user['id']})
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    p.pop('_id', None)
    return Project(**p)

@api.patch('/projects/{pid}', response_model=Project)
async def rename_project(pid: str, req: ProjectRenameRequest, user=Depends(get_current_user)):
    res = await db.projects.find_one_and_update(
        {'id': pid, 'user_id': user['id']},
        {'$set': {'name': req.name, 'updated_at': now_utc()}},
        return_document=True,
    )
    if not res:
        raise HTTPException(status_code=404, detail='Project not found')
    res.pop('_id', None)
    return Project(**res)

@api.delete('/projects/{pid}')
async def delete_project(pid: str, user=Depends(get_current_user)):
    res = await db.projects.delete_one({'id': pid, 'user_id': user['id']})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Project not found')
    return {'ok': True}

@api.post('/projects/{pid}/chat', response_model=Project)
async def chat_in_project(pid: str, req: ChatRequest, user=Depends(get_current_user)):
    p = await db.projects.find_one({'id': pid, 'user_id': user['id']})
    if not p:
        raise HTTPException(status_code=404, detail='Project not found')
    if user.get('credits', 0) <= 0:
        raise HTTPException(status_code=402, detail='Out of credits. Please top up.')

    user_msg = ChatMessage(role='user', content=req.message)
    history = p.get('messages', [])
    history.append(user_msg.model_dump())

    result = await generate_app(
        session_id=pid,
        history=[{'role': m['role'], 'content': m['content']} for m in history],
        user_message=req.message,
    )
    assistant_msg = ChatMessage(role='assistant', content=result['reply'])
    history.append(assistant_msg.model_dump())

    # Decrement 1 credit
    await db.users.update_one({'id': user['id']}, {'$inc': {'credits': -1}})

    set_fields = {
        'messages': history,
        'files': result['files'],
        'updated_at': now_utc(),
    }
    # On first generation, also update name/description from model if user kept defaults
    if not p.get('description') and result.get('description'):
        set_fields['description'] = result['description']
    if (p.get('name', '').lower() in ('new project', 'untitled', '')) and result.get('project_name'):
        set_fields['name'] = result['project_name']

    res = await db.projects.find_one_and_update({'id': pid}, {'$set': set_fields}, return_document=True)
    res.pop('_id', None)
    return Project(**res)

# ---------- Payments ----------
@api.post('/payments/checkout')
async def create_checkout(req: CheckoutRequest, user=Depends(get_current_user)):
    pkg = await db.packages.find_one({'id': req.package_id, 'active': True})
    if not pkg:
        raise HTTPException(status_code=404, detail='Package not found')
    settings = await get_settings_dict()
    api_key = settings.get('stripe_api_key') or os.environ.get('STRIPE_API_KEY', '')
    if not api_key:
        raise HTTPException(status_code=400, detail='Stripe is not configured. Contact admin.')

    from emergentintegrations.payments.stripe.checkout import (
        StripeCheckout, CheckoutSessionRequest,
    )
    origin = req.origin_url.rstrip('/')
    success_url = f'{origin}/billing/success?session_id={{CHECKOUT_SESSION_ID}}'
    cancel_url = f'{origin}/billing'
    webhook_url = f'{origin}/api/webhook/stripe'
    checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)

    metadata = {
        'user_id': user['id'],
        'user_email': user['email'],
        'package_id': pkg['id'],
        'credits': str(pkg['credits']),
    }
    cs_req = CheckoutSessionRequest(
        amount=float(pkg['price_usd']), currency='usd',
        success_url=success_url, cancel_url=cancel_url, metadata=metadata,
    )
    try:
        session = await checkout.create_checkout_session(cs_req)
    except Exception as e:
        logger.exception('Stripe checkout error')
        raise HTTPException(status_code=500, detail=f'Stripe error: {e}')

    tx = PaymentTransaction(
        user_id=user['id'], user_email=user['email'],
        package_id=pkg['id'], package_name=pkg['name'],
        credits=int(pkg['credits']), amount=float(pkg['price_usd']),
        session_id=session.session_id, payment_status='initiated', metadata=metadata,
    )
    await db.payment_transactions.insert_one(tx.model_dump())
    return {'url': session.url, 'session_id': session.session_id}

@api.get('/payments/status/{session_id}')
async def payment_status(session_id: str, user=Depends(get_current_user)):
    tx = await db.payment_transactions.find_one({'session_id': session_id, 'user_id': user['id']})
    if not tx:
        raise HTTPException(status_code=404, detail='Transaction not found')

    if tx.get('payment_status') == 'paid':
        return {'payment_status': 'paid', 'credits_granted': tx.get('credits_granted', False)}

    settings = await get_settings_dict()
    api_key = settings.get('stripe_api_key') or os.environ.get('STRIPE_API_KEY', '')
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    checkout = StripeCheckout(api_key=api_key, webhook_url='')
    try:
        status = await checkout.get_checkout_status(session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Stripe status error: {e}')

    new_status = status.payment_status  # 'paid' / 'unpaid' / 'no_payment_required'
    granted = tx.get('credits_granted', False)
    update = {'payment_status': new_status, 'updated_at': now_utc()}
    if new_status == 'paid' and not granted:
        await db.users.update_one({'id': tx['user_id']}, {'$inc': {'credits': int(tx['credits'])}})
        update['credits_granted'] = True
    await db.payment_transactions.update_one({'session_id': session_id}, {'$set': update})
    return {'payment_status': new_status, 'credits_granted': update.get('credits_granted', granted)}

@api.post('/webhook/stripe')
async def stripe_webhook(request: Request):
    settings = await get_settings_dict()
    api_key = settings.get('stripe_api_key') or os.environ.get('STRIPE_API_KEY', '')
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    checkout = StripeCheckout(api_key=api_key, webhook_url='')
    body = await request.body()
    sig = request.headers.get('Stripe-Signature', '')
    try:
        evt = await checkout.handle_webhook(body, sig)
    except Exception as e:
        logger.exception('Stripe webhook error')
        raise HTTPException(status_code=400, detail=str(e))
    if evt.session_id and evt.payment_status == 'paid':
        tx = await db.payment_transactions.find_one({'session_id': evt.session_id})
        if tx and not tx.get('credits_granted', False):
            await db.users.update_one({'id': tx['user_id']}, {'$inc': {'credits': int(tx['credits'])}})
            await db.payment_transactions.update_one(
                {'session_id': evt.session_id},
                {'$set': {'payment_status': 'paid', 'credits_granted': True, 'updated_at': now_utc()}},
            )
    return {'received': True}

# ---------- Admin ----------
@api.get('/admin/settings', response_model=Settings)
async def admin_get_settings(user=Depends(require_admin)):
    s = await get_settings_dict()
    s.pop('_key', None)
    return Settings(**{k: v for k, v in s.items() if k in Settings.model_fields})

@api.put('/admin/settings', response_model=Settings)
async def admin_update_settings(req: SettingsUpdate, user=Depends(require_admin)):
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    if update:
        await db.settings.update_one({'_key': 'app'}, {'$set': update}, upsert=True)
    s = await get_settings_dict()
    s.pop('_key', None)
    return Settings(**{k: v for k, v in s.items() if k in Settings.model_fields})

@api.get('/admin/packages', response_model=List[Package])
async def admin_list_packages(user=Depends(require_admin)):
    cur = db.packages.find({}).sort('sort_order', 1)
    out = []
    async for p in cur:
        p.pop('_id', None)
        out.append(Package(**p))
    return out

@api.post('/admin/packages', response_model=Package)
async def admin_create_package(req: PackageUpsert, user=Depends(require_admin)):
    p = Package(**req.model_dump())
    await db.packages.insert_one(p.model_dump())
    return p

@api.put('/admin/packages/{pid}', response_model=Package)
async def admin_update_package(pid: str, req: PackageUpsert, user=Depends(require_admin)):
    res = await db.packages.find_one_and_update({'id': pid}, {'$set': req.model_dump()}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail='Package not found')
    res.pop('_id', None)
    return Package(**res)

@api.delete('/admin/packages/{pid}')
async def admin_delete_package(pid: str, user=Depends(require_admin)):
    res = await db.packages.delete_one({'id': pid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail='Package not found')
    return {'ok': True}

@api.get('/admin/users', response_model=List[UserPublic])
async def admin_list_users(user=Depends(require_admin)):
    cur = db.users.find({}).sort('created_at', -1).limit(500)
    out = []
    async for u in cur:
        out.append(user_record_to_public(u))
    return out

@api.put('/admin/users/{uid}', response_model=UserPublic)
async def admin_update_user(uid: str, req: AdminUserUpdate, user=Depends(require_admin)):
    update = {k: v for k, v in req.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail='No changes')
    res = await db.users.find_one_and_update({'id': uid}, {'$set': update}, return_document=True)
    if not res:
        raise HTTPException(status_code=404, detail='User not found')
    return user_record_to_public(res)

@api.post('/admin/credits/adjust', response_model=UserPublic)
async def admin_adjust_credits(req: AdminCreditAdjust, user=Depends(require_admin)):
    res = await db.users.find_one_and_update(
        {'id': req.user_id}, {'$inc': {'credits': int(req.delta)}}, return_document=True,
    )
    if not res:
        raise HTTPException(status_code=404, detail='User not found')
    await db.credit_logs.insert_one({
        'id': gen_id(), 'user_id': req.user_id, 'delta': int(req.delta),
        'reason': req.reason, 'by_admin': user['id'], 'created_at': now_utc(),
    })
    return user_record_to_public(res)

@api.get('/admin/transactions', response_model=List[PaymentTransaction])
async def admin_list_tx(user=Depends(require_admin)):
    cur = db.payment_transactions.find({}).sort('created_at', -1).limit(500)
    out = []
    async for t in cur:
        t.pop('_id', None)
        out.append(PaymentTransaction(**t))
    return out

# Mount
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_credentials=True, allow_methods=['*'], allow_headers=['*'],
)

@app.on_event('startup')
async def on_startup():
    await db.users.create_index('email', unique=True)
    await db.users.create_index('id', unique=True)
    await db.projects.create_index('id', unique=True)
    await db.projects.create_index('user_id')
    await db.packages.create_index('id', unique=True)
    await db.payment_transactions.create_index('session_id', unique=True)
    await db.settings.create_index('_key', unique=True)
    # Bootstrap admin from env if provided & no admin exists
    admin_email = os.environ.get('ADMIN_EMAIL')
    admin_password = os.environ.get('ADMIN_PASSWORD')
    if admin_email and admin_password:
        existing = await db.users.find_one({'email': admin_email.lower()})
        if not existing:
            await db.users.insert_one({
                'id': gen_id(),
                'email': admin_email.lower(),
                'name': os.environ.get('ADMIN_NAME', 'Admin'),
                'password_hash': hash_password(admin_password),
                'role': 'admin',
                'credits': 1000,
                'created_at': now_utc(),
            })
            logger.info(f'Bootstrapped admin user: {admin_email}')
        elif existing.get('role') != 'admin':
            await db.users.update_one({'id': existing['id']}, {'$set': {'role': 'admin'}})
    # Seed default packages if empty
    if await db.packages.count_documents({}) == 0:
        defaults = [
            {'name': 'Starter', 'description': '50 credits', 'credits': 50, 'price_usd': 9.0, 'sort_order': 1},
            {'name': 'Builder', 'description': '200 credits', 'credits': 200, 'price_usd': 29.0, 'sort_order': 2},
            {'name': 'Pro', 'description': '1000 credits', 'credits': 1000, 'price_usd': 99.0, 'sort_order': 3},
        ]
        for d in defaults:
            pkg = Package(**d)
            await db.packages.insert_one(pkg.model_dump())

@app.on_event('shutdown')
async def on_shutdown():
    client.close()
