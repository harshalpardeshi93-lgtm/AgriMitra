from typing import List, Optional
from pydantic import BaseModel

class MarketRankingItem(BaseModel):
    market_name: str
    district: str
    state: str
    latest_modal_price: float
    expected_5d_price: float
    expected_gain: float
    expected_gain_pct: float
    trend_direction: str
    price_change_pct: float
    arrival_quantity: float
    composite_score: float

class AdvisorResponse(BaseModel):
    crop_id: int
    crop_name: str
    quantity_kg: float
    quality_grade: str
    recommended_market: str
    district: str
    state: str
    current_modal_price: Optional[float] = None
    expected_price: Optional[float] = None
    expected_gain: Optional[float] = None
    recommended_window: str  # Options: Sell now, Sell within 1–2 days, Consider waiting, Limited confidence
    confidence_level: str   # Options: Confidence estimate, Limited confidence
    confidence_score: Optional[float] = None
    mae_validation_score: Optional[float] = None
    observation_count: int
    key_reasons: List[str]
    market_rankings: List[MarketRankingItem]
    data_disclaimer: str = "Market insights are based on structured prototype data and are designed for integration with government/open-data sources."
