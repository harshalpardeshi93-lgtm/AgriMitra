from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.session import get_db
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserResponse, AuthResponse
from app.services.auth_service import hash_password, verify_password, generate_token

router = APIRouter()

ALLOWED_ROLES = {"farmer", "buyer", "fpo"}

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_in: UserRegister, db: Session = Depends(get_db)):
    # Validate fields
    clean_name = user_in.name.strip() if user_in.name else ""
    clean_phone = user_in.phone.strip() if user_in.phone else ""
    clean_role = user_in.role.strip().lower() if user_in.role else ""

    if not clean_name:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    if not clean_phone:
        raise HTTPException(status_code=400, detail="Please enter your phone number.")
    if not user_in.password or len(user_in.password) < 3:
        raise HTTPException(status_code=400, detail="Password must be at least 3 characters long.")
    if clean_role not in ALLOWED_ROLES:
        raise HTTPException(status_code=400, detail="Role must be 'farmer', 'buyer', or 'fpo'.")

    # Check for duplicate phone
    existing_user = db.query(User).filter(User.phone == clean_phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number is already registered. Please log in.")

    # Hash password securely
    hashed_pwd = hash_password(user_in.password)

    new_user = User(
        name=clean_name,
        phone=clean_phone,
        password_hash=hashed_pwd,
        role=clean_role,
        location=user_in.location.strip() if user_in.location else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = generate_token(new_user.id, new_user.role)
    user_resp = UserResponse.from_orm(new_user)

    return AuthResponse(user=user_resp, token=token)

@router.post("/login", response_model=AuthResponse)
def login_user(user_in: UserLogin, db: Session = Depends(get_db)):
    clean_phone = user_in.phone.strip() if user_in.phone else ""
    if not clean_phone or not user_in.password:
        raise HTTPException(status_code=400, detail="Please enter your phone number and password.")

    user = db.query(User).filter(User.phone == clean_phone).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Phone number or password is incorrect.")

    token = generate_token(user.id, user.role)
    user_resp = UserResponse.from_orm(user)

    return AuthResponse(user=user_resp, token=token)

from app.api.deps import get_current_user as get_current_user_dep

@router.get("/me", response_model=UserResponse)
def get_current_user_route(current_user: User = Depends(get_current_user_dep)):
    return UserResponse.from_orm(current_user)

@router.get("/buyers", response_model=List[UserResponse])
def get_buyers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user_dep)
):
    buyers = db.query(User).filter(User.role == "buyer").all()
    return [UserResponse.from_orm(b) for b in buyers]

