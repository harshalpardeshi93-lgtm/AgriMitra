import datetime
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from app.database.session import Base
from sqlalchemy.orm import relationship

class BuyerOffer(Base):
    __tablename__ = "buyer_offers"

    id = Column(Integer, primary_key=True, index=True)
    lot_id = Column(Integer, ForeignKey("produce_lots.id"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    
    offered_price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)
    message = Column(String, nullable=True)
    
    status = Column(String, default="Pending", index=True) # "Pending", "Accepted", "Rejected"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    lot = relationship("ProduceLot")
    buyer = relationship("User", foreign_keys=[buyer_id])
