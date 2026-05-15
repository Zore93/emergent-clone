import os
from datetime import timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from passlib.context import CryptContext
from models import now_utc, UserPublic

JWT_SECRET = os.environ.get('JWT_SECRET', 'dev-secret-change-me')
JWT_ALGORITHM = os.environ.get('JWT_ALGORITHM', 'HS256')
JWT_EXPIRE_HOURS = int(os.environ.get('JWT_EXPIRE_HOURS', '168'))

pwd_ctx = CryptContext(schemes=['bcrypt'], deprecated='auto')
bearer_scheme = HTTPBearer(auto_error=False)

def hash_password(plain: str) -> str:
    return pwd_ctx.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(plain, hashed)
    except Exception:
        return False

def create_access_token(user_id: str) -> str:
    expire = now_utc() + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {'sub': user_id, 'exp': expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload.get('sub')
    except JWTError:
        return None

async def get_current_user_record(db, creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme)):
    if creds is None:
        raise HTTPException(status_code=401, detail='Not authenticated')
    user_id = decode_token(creds.credentials)
    if not user_id:
        raise HTTPException(status_code=401, detail='Invalid or expired token')
    user = await db.users.find_one({'id': user_id})
    if not user:
        raise HTTPException(status_code=401, detail='User not found')
    return user

def user_record_to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u['id'],
        email=u['email'],
        name=u.get('name', ''),
        role=u.get('role', 'user'),
        credits=u.get('credits', 0),
        created_at=u.get('created_at') or now_utc(),
    )
