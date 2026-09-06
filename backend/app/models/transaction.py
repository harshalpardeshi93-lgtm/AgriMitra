import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.database.session import Base
from sqlalchemy.orm import relationship

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("buyer_offers.id"), nullable=False, unique=True)
    lot_id = Column(Integer, ForeignKey("produce_lots.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    farmer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    crop_id = Column(Integer, ForeignKey("crops.id"), nullable=False)
    
    quantity_quintals = Column(Float, nullable=False)
    agreed_price_per_quintal = Column(Float, nullable=False)
    total_amount = Column(Float, nullable=False)
    
    payment_status = Column(String, default="Pending", index=True)       # "Pending", "Processing", "Paid"
    transaction_status = Column(String, default="Confirmed", index=True) # "Confirmed", "In Progress", "Completed", "Cancelled"
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    offer = relationship("BuyerOffer")
    lot = relationship("ProduceLot")
    buyer = relationship("User", foreign_keys=[buyer_id])
    farmer = relationship("User", foreign_keys=[farmer_id])
    crop = relationship("Crop")
