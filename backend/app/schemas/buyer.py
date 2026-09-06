from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- PRODUCE LOTS ---

class ProduceLotBase(BaseModel):
    farmer_id: int
    crop_id: int
    market_id: int
    quantity_quintals: float
    quality_grade: str
    expected_price_per_quintal: float
    status: str = "Available"

class ProduceLotCreate(BaseModel):
    crop_id: int
    market_id: int
    quantity_quintals: float
    quality_grade: str
    expected_price_per_quintal: float
    status: Optional[str] = "Available"

class ProduceLotResponse(ProduceLotBase):
    id: int
    created_at: datetime
    # We will include resolved names for convenience in the frontend
    farmer_name: str
    crop_name: str
    market_name: str
    district: str
    state: str

    class Config:
        from_attributes = True


# --- BUYER OFFERS ---

class BuyerOfferCreate(BaseModel):
    lot_id: int
    offered_price: float
    quantity: float
    message: Optional[str] = None

class BuyerOfferStatusUpdate(BaseModel):
    status: str  # "Accepted", "Rejected"

class BuyerOfferResponse(BaseModel):
    id: int
    lot_id: int
    buyer_id: int
    offered_price: float
    quantity: float
    message: Optional[str] = None
    status: str
    created_at: datetime
    
    # Resolved names for convenience
    farmer_name: str
    crop_name: str

    class Config:
        from_attributes = True

