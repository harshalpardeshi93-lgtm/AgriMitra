from sqlalchemy import Column, Integer, String
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    role = Column(String, index=True, nullable=False)  # "farmer", "buyer", "fpo"
    location = Column(String, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=True)

