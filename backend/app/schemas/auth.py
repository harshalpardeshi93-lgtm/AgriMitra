from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    name: str
    phone: str
    password: str
    role: str # "farmer", "buyer", "fpo"
    location: Optional[str] = None

class UserLogin(BaseModel):
    phone: str
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    role: str
    location: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    user: UserResponse
    token: str
