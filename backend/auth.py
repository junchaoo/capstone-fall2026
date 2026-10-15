"""
Handles password hashing/checking, and creating/reading login tokens (JWT).
"""

from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt

# --------------------------------------------------------------
# Password hashing
# --------------------------------------------------------------
# We NEVER store plain-text passwords. This turns a password into
# a scrambled hash that can be checked later, but not reversed.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# --------------------------------------------------------------
# JWT tokens
# --------------------------------------------------------------
# IMPORTANT: change this to a long random string before this goes
# anywhere beyond your own machines. For now, a placeholder is fine
# for local development.
SECRET_KEY = "CHANGE_THIS_TO_A_RANDOM_SECRET_LATER"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # token lasts 1 day


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
