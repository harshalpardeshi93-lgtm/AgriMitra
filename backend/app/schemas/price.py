from typing import Optional
from pydantic import BaseModel, ConfigDict

class MarketPriceResponse(BaseModel):
    id: int
    market_id: int
    market_name: str
    district: str
    state: str
    crop_id: int
    crop_name: str
    date: str
    min_price: float
    max_price: float
    modal_price: float
    arrival_quantity: Optional[float] = None
    
    source_name: str = "AgriMitra Database"
    fetched_at: Optional[str] = None
    data_timestamp: Optional[str] = None
    freshness: str = "Fallback"

    model_config = ConfigDict(from_attributes=True)
