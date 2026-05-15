from datetime import datetime, timezone
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field
import uuid

def now_utc() -> datetime:
    return datetime.now(timezone.utc)

def gen_id() -> str:
    return str(uuid.uuid4())

# ===== USER =====
class UserPublic(BaseModel):
    id: str
    email: EmailStr
    name: str
    role: Literal['user', 'admin'] = 'user'
    credits: int = 0
    created_at: datetime

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: str = Field(min_length=1, max_length=80)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    user: UserPublic

# ===== PROJECT / CHAT =====
class ChatMessage(BaseModel):
    id: str = Field(default_factory=gen_id)
    role: Literal['user', 'assistant', 'system'] = 'user'
    content: str
    created_at: datetime = Field(default_factory=now_utc)

class ProjectFile(BaseModel):
    path: str
    content: str
    language: str = 'text'

class Project(BaseModel):
    id: str = Field(default_factory=gen_id)
    user_id: str
    name: str
    description: str = ''
    messages: List[ChatMessage] = []
    files: List[ProjectFile] = []
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class ProjectCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str = ''

class ProjectRenameRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)

class ChatRequest(BaseModel):
    message: str = Field(min_length=1)

# ===== PACKAGE =====
class Package(BaseModel):
    id: str = Field(default_factory=gen_id)
    name: str
    description: str = ''
    credits: int = Field(ge=1)
    price_usd: float = Field(gt=0)
    active: bool = True
    sort_order: int = 0
    created_at: datetime = Field(default_factory=now_utc)

class PackageUpsert(BaseModel):
    name: str
    description: str = ''
    credits: int = Field(ge=1)
    price_usd: float = Field(gt=0)
    active: bool = True
    sort_order: int = 0

# ===== PAYMENT =====
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=gen_id)
    user_id: str
    user_email: str
    package_id: str
    package_name: str
    credits: int
    amount: float
    currency: str = 'usd'
    session_id: str
    payment_status: str = 'initiated'  # initiated | pending | paid | failed | expired
    credits_granted: bool = False
    metadata: Dict[str, Any] = {}
    created_at: datetime = Field(default_factory=now_utc)
    updated_at: datetime = Field(default_factory=now_utc)

class CheckoutRequest(BaseModel):
    package_id: str
    origin_url: str

# ===== SETTINGS =====
class Settings(BaseModel):
    stripe_api_key: str = ''
    stripe_publishable_key: str = ''
    stripe_mode: Literal['test', 'live'] = 'test'
    free_signup_credits: int = 10
    site_name: str = 'Emergent Clone'

class SettingsUpdate(BaseModel):
    stripe_api_key: Optional[str] = None
    stripe_publishable_key: Optional[str] = None
    stripe_mode: Optional[Literal['test', 'live']] = None
    free_signup_credits: Optional[int] = None
    site_name: Optional[str] = None

# ===== ADMIN =====
class AdminCreditAdjust(BaseModel):
    user_id: str
    delta: int  # positive to add, negative to subtract
    reason: str = ''

class AdminUserUpdate(BaseModel):
    role: Optional[Literal['user', 'admin']] = None
    credits: Optional[int] = None
