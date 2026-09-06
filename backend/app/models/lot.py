import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.database.session import Base
from sqlalchemy.orm import relationship

class ProduceLot(Base):
    __tablename__ = "produce_lots"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False, index=True)
    
    quantity_quintals = Column(Float, nullable=False)
    quality_grade = Column(String, nullable=False)
    expected_price_per_quintal = Column(Float, nullable=False)
    
    status = Column(String, default="Available", index=True) # "Available", "Sold", "Hidden"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    farmer = relationship("User", foreign_keys=[farmer_id])
    crop = relationship("Crop")
    market = relationship("Market")
