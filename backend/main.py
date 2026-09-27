"""
Basic FastAPI backend for signup + login.

Run this with:
    uvicorn main:app --reload

Then visit http://127.0.0.1:8000/docs to see and test the endpoints
in an interactive auto-generated page (a nice built-in FastAPI feature).
"""

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr

from database import Base, engine, get_db
from models import User
from auth import hash_password, verify_password, create_access_token

# Creates the SQLite file + users table on first run, if they don't exist yet
Base.metadata.create_all(bind=engine)

app = FastAPI()

# --------------------------------------------------------------
# CORS — lets your React app (running on a different port) call this API
# --------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # your Vite dev server address
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------
# Request/response "shapes" (Pydantic models)
# These define what JSON data each endpoint expects/returns.
# --------------------------------------------------------------
class SignupRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# --------------------------------------------------------------
# Routes
# --------------------------------------------------------------
@app.post("/signup", response_model=TokenResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    # Check if the email is already registered
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create and save the new user with a hashed password
    new_user = User(
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Log them in immediately by returning a token
    token = create_access_token({"sub": new_user.email})
    return TokenResponse(access_token=token)


@app.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    # Same error message for "no such user" and "wrong password" —
    # this is intentional, so attackers can't tell which one was wrong.
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user.email})
    return TokenResponse(access_token=token)


@app.get("/")
def root():
    return {"message": "Backend is running."}
