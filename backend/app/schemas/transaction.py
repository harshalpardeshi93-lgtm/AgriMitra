from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TransactionCreate(BaseModel):
    offer_id: int

class PaymentStatusUpdate(BaseModel):
    payment_status: str # "Pending", "Processing", "Paid"

class TransactionStatusUpdate(BaseModel):
    transaction_status: str # "Confirmed", "In Progress", "Completed", "Cancelled"

class TransactionResponse(BaseModel):
    id: int
    offer_id: int
    lot_id: int
    buyer_id: int
    farmer_id: int
    crop_id: int
    
    quantity_quintals: float
    agreed_price_per_quintal: float
    total_amount: float
    
    payment_status: str
    transaction_status: str
    
    created_at: datetime
    updated_at: datetime
    
    # Resolved display names for convenience in UI
    buyer_name: str
    farmer_name: str
    crop_name: str
    quality_grade: str
    market_name: str

    class Config:
        from_attributes = True
