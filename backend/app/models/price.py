from sqlalchemy import Column, Integer, String, Float, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.session import Base

class MarketPrice(Base):
    __tablename__ = "market_prices"

    id = Column(Integer, primary_key=True, index=True)
    market_id = Column(Integer, ForeignKey("markets.id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False, index=True)
    date = Column(String, nullable=False, index=True)  # Store ISO YYYY-MM-DD for simple queries
    min_price = Column(Float, nullable=False)
    max_price = Column(Float, nullable=False)
    modal_price = Column(Float, nullable=False)
    arrival_quantity = Column(Float, nullable=False)  # in quintals

    market = relationship("Market")
    crop = relationship("Crop")
