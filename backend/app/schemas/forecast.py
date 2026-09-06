from typing import List
from pydantic import BaseModel

class ForecastPoint(BaseModel):
    date: str
    predicted_modal_price: float
    min_expected: float
    max_expected: float
    is_forecast: bool = True

class ForecastResponse(BaseModel):
    crop_id: int
    crop_name: str
    market_id: int
    market_name: str
    horizon_days: int
    mae_score: float
    observation_count: int
    confidence_score: float
    confidence_label: str = "Confidence estimate"
    forecast_points: List[ForecastPoint]
