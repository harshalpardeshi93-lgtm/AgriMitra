from sqlalchemy import Column, Integer, String, Float
from app.database.session import Base

class Market(Base):
    __tablename__ = "markets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    district = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
