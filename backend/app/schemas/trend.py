from typing import List, Optional
from pydantic import BaseModel

class TrendPoint(BaseModel):
    date: str
    modal_price: float
    min_price: float
    max_price: float
    arrival_quantity: float

class TrendResponse(BaseModel):
    crop_id: int
    crop_name: str
    market_id: int
    market_name: str
    trend_direction: str
    price_change_pct: Optional[float] = None
    price_velocity_per_day: Optional[float] = None
    sma_3: Optional[float] = None
    sma_7: Optional[float] = None
    volatility: Optional[float] = None
    latest_price: Optional[float] = None
    historical_points: List[TrendPoint]
