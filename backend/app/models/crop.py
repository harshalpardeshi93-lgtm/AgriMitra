from sqlalchemy import Column, Integer, String
from app.database.session import Base

class Crop(Base):
    __tablename__ = "crops"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    unit = Column(String, nullable=False, default="quintal")
